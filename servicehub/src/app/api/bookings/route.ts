import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { findUserById } from "@/lib/auth/users";
import { bookingsCollection, toSafeBooking } from "@/lib/bookings/bookings";
import { isPastDateTime, bookingCreateSchema } from "@/lib/bookings/validation";
import { servicesCollection } from "@/lib/services/services";

export async function GET(request: Request) {
  const user = await apiUser(["CUSTOMER", "PROVIDER"]);
  if (isApiError(user)) return user;
  const status = new URL(request.url).searchParams.get("status");
  const query = user.role === "CUSTOMER" ? { customerId: new ObjectId(user.id) } : { providerId: new ObjectId(user.id) };
  if (status) Object.assign(query, { status });
  const bookings = await (await bookingsCollection()).find(query).sort({ createdAt: -1 }).toArray();
  const result = await Promise.all(bookings.map(async (booking) => {
    const provider = await findUserById(booking.providerId.toString());
    return toSafeBooking(booking, provider?.name);
  }));
  return NextResponse.json({ bookings: result });
}

export async function POST(request: Request) {
  const user = await apiUser(["CUSTOMER"]);
  if (isApiError(user)) return user;
  const parsed = bookingCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the highlighted booking fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (isPastDateTime(parsed.data.requestedDate, parsed.data.requestedTime)) return NextResponse.json({ error: "Choose a future date and time." }, { status: 400 });
  const service = await (await servicesCollection()).findOne({ _id: new ObjectId(parsed.data.serviceId), status: "PUBLISHED" });
  if (!service) return NextResponse.json({ error: "This service is no longer available for booking." }, { status: 404 });
  if (service.providerId.toString() === user.id) return NextResponse.json({ error: "You cannot book your own service." }, { status: 400 });
  const collection = await bookingsCollection();
  const existing = await collection.findOne({ customerId: new ObjectId(user.id), clientRequestId: parsed.data.clientRequestId });
  if (existing) return NextResponse.json({ booking: toSafeBooking(existing), duplicate: true });
  const now = new Date();
  const booking = { _id: new ObjectId(), serviceId: service._id, providerId: service.providerId, customerId: new ObjectId(user.id), serviceTitle: service.title, requestedDate: parsed.data.requestedDate, requestedTime: parsed.data.requestedTime, addressOrArea: parsed.data.addressOrArea, ...(parsed.data.note ? { note: parsed.data.note } : {}), clientRequestId: parsed.data.clientRequestId, status: "PENDING" as const, createdAt: now, updatedAt: now };
  try { await collection.insertOne(booking); } catch (error) {
    if (error instanceof Error && error.message.includes("duplicate")) {
      const duplicate = await collection.findOne({ customerId: booking.customerId, clientRequestId: booking.clientRequestId });
      if (duplicate) return NextResponse.json({ booking: toSafeBooking(duplicate), duplicate: true });
    }
    throw error;
  }
  const provider = await findUserById(booking.providerId.toString());
  return NextResponse.json({ booking: toSafeBooking(booking, provider?.name) }, { status: 201 });
}
