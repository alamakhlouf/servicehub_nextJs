import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { findUserById } from "@/lib/auth/users";
import { bookingsCollection, toSafeBooking } from "@/lib/bookings/bookings";
import { bookingStatusSchema, canTransition, isPastDateTime } from "@/lib/bookings/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  void request;
  const user = await apiUser(["CUSTOMER", "PROVIDER"]);
  const { id } = await context.params;
  if (isApiError(user)) return user;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  const booking = await (await bookingsCollection()).findOne({ _id: new ObjectId(id), $or: [{ customerId: new ObjectId(user.id) }, { providerId: new ObjectId(user.id) }] });
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  const provider = await findUserById(booking.providerId.toString());
  return NextResponse.json({ booking: toSafeBooking(booking, provider?.name) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await apiUser(["CUSTOMER", "PROVIDER"]);
  const { id } = await context.params;
  if (isApiError(user)) return user;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  const collection = await bookingsCollection();
  const booking = await collection.findOne({ _id: new ObjectId(id), $or: [{ customerId: new ObjectId(user.id) }, { providerId: new ObjectId(user.id) }] });
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  const parsed = bookingStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !canTransition(booking.status, parsed.data.status, user.role)) return NextResponse.json({ error: "That booking status change is not allowed." }, { status: 400 });
  const agreedDate = parsed.data.agreedDate ?? booking.requestedDate;
  const agreedTime = parsed.data.agreedTime ?? booking.requestedTime;
  if (parsed.data.status === "ACCEPTED" && isPastDateTime(agreedDate, agreedTime)) return NextResponse.json({ error: "Choose a future agreed date and time." }, { status: 400 });
  if (parsed.data.status === "ACCEPTED") {
    const conflict = await collection.findOne({
      _id: { $ne: booking._id },
      providerId: booking.providerId,
      $or: [{ agreedDate, agreedTime }, { requestedDate: agreedDate, requestedTime: agreedTime }],
      status: { $in: ["ACCEPTED", "IN_PROGRESS"] },
    });
    if (conflict) return NextResponse.json({ error: "That time is no longer available. Review another request or contact the customer." }, { status: 409 });
  }
  const update = { status: parsed.data.status, updatedAt: new Date(), ...(parsed.data.status === "ACCEPTED" ? { agreedDate, agreedTime } : {}), ...(parsed.data.cancellationReason ? { cancellationReason: parsed.data.cancellationReason } : {}) };
  const result = await collection.updateOne({ _id: booking._id, status: booking.status }, { $set: update });
  if (result.modifiedCount !== 1) return NextResponse.json({ error: "This booking changed elsewhere. Refresh and try again." }, { status: 409 });
  const updated = await collection.findOne({ _id: booking._id });
  const provider = await findUserById(booking.providerId.toString());
  return NextResponse.json({ booking: toSafeBooking(updated!, provider?.name) });
}
