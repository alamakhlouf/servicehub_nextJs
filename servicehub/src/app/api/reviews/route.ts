import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { findUserById, toSafeUser } from "@/lib/auth/users";
import { bookingsCollection } from "@/lib/bookings/bookings";
import { servicesCollection } from "@/lib/services/services";
import { reviewsCollection, toSafeReview } from "@/lib/reviews/reviews";
import { reviewCreateSchema } from "@/lib/reviews/validation";

export async function GET(request: Request) {
  const serviceId = new URL(request.url).searchParams.get("serviceId");
  if (!serviceId || !ObjectId.isValid(serviceId)) return NextResponse.json({ error: "A valid service is required." }, { status: 400 });
  const service = await (await servicesCollection()).findOne({ _id: new ObjectId(serviceId), status: "PUBLISHED" });
  if (!service) return NextResponse.json({ reviews: [] });
  const reviews = await (await reviewsCollection()).find({ serviceId: new ObjectId(serviceId) }).sort({ createdAt: -1 }).limit(50).toArray();
  const result = await Promise.all(reviews.map(async (review) => {
    const customer = await findUserById(review.customerId.toString());
    return toSafeReview(review, { customerName: customer ? toSafeUser(customer).name : "ServiceHub customer", serviceTitle: service.title });
  }));
  return NextResponse.json({ reviews: result });
}

export async function POST(request: Request) {
  const user = await apiUser(["CUSTOMER"]);
  if (isApiError(user)) return user;
  const parsed = reviewCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the review fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const bookings = await bookingsCollection();
  const booking = await bookings.findOne({ _id: new ObjectId(parsed.data.bookingId), customerId: new ObjectId(user.id), status: "COMPLETED" });
  if (!booking) return NextResponse.json({ error: "Only your completed bookings can be reviewed." }, { status: 403 });
  const reviews = await reviewsCollection();
  if (parsed.data.clientRequestId) {
    const existingRequest = await reviews.findOne({ customerId: new ObjectId(user.id), clientRequestId: parsed.data.clientRequestId });
    if (existingRequest) return NextResponse.json({ review: toSafeReview(existingRequest), duplicate: true });
  }
  if (await reviews.findOne({ bookingId: booking._id })) return NextResponse.json({ error: "This booking already has a review." }, { status: 409 });
  const now = new Date();
  const review = { _id: new ObjectId(), bookingId: booking._id, serviceId: booking.serviceId, providerId: booking.providerId, customerId: booking.customerId, rating: parsed.data.rating, comment: parsed.data.comment, ...(parsed.data.clientRequestId ? { clientRequestId: parsed.data.clientRequestId } : {}), createdAt: now, updatedAt: now };
  try { await reviews.insertOne(review); } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("duplicate")) {
      const duplicate = await reviews.findOne({ $or: [{ bookingId: booking._id }, ...(parsed.data.clientRequestId ? [{ customerId: booking.customerId, clientRequestId: parsed.data.clientRequestId }] : [])] });
      if (duplicate) return NextResponse.json({ review: toSafeReview(duplicate), duplicate: true });
      return NextResponse.json({ error: "This booking already has a review." }, { status: 409 });
    }
    throw error;
  }
  const service = await (await servicesCollection()).findOne({ _id: booking.serviceId });
  return NextResponse.json({ review: toSafeReview(review, { customerName: user.name, serviceTitle: service?.title }) }, { status: 201 });
}
