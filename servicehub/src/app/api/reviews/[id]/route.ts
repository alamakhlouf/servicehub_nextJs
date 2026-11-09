import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { bookingsCollection } from "@/lib/bookings/bookings";
import { reviewsCollection, toSafeReview } from "@/lib/reviews/reviews";
import { reviewUpdateSchema } from "@/lib/reviews/validation";
import { servicesCollection } from "@/lib/services/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const user = await apiUser(["CUSTOMER"]);
  const { id } = await context.params;
  if (isApiError(user)) return user;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  const reviews = await reviewsCollection();
  const review = await reviews.findOne({ _id: new ObjectId(id), customerId: new ObjectId(user.id) });
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  const booking = await (await bookingsCollection()).findOne({ _id: review.bookingId, customerId: new ObjectId(user.id), status: "COMPLETED" });
  if (!booking) return NextResponse.json({ error: "This review is no longer editable." }, { status: 409 });
  const parsed = reviewUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the review fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  await reviews.updateOne({ _id: review._id }, { $set: { ...parsed.data, updatedAt: new Date() } });
  const updated = await reviews.findOne({ _id: review._id });
  const service = await (await servicesCollection()).findOne({ _id: review.serviceId });
  return NextResponse.json({ review: toSafeReview(updated!, { customerName: user.name, serviceTitle: service?.title }) });
}

export async function DELETE(request: Request, context: RouteContext) {
  void request;
  const user = await apiUser(["CUSTOMER"]);
  const { id } = await context.params;
  if (isApiError(user)) return user;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  const result = await (await reviewsCollection()).deleteOne({ _id: new ObjectId(id), customerId: new ObjectId(user.id) });
  if (result.deletedCount !== 1) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
