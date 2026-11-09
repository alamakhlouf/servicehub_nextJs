import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { findUserById } from "@/lib/auth/users";
import { reviewsCollection, toSafeReview } from "@/lib/reviews/reviews";
import { servicesCollection } from "@/lib/services/services";

export async function GET() {
  const user = await apiUser(["CUSTOMER"]);
  if (isApiError(user)) return user;
  const reviews = await (await reviewsCollection()).find({ customerId: new ObjectId(user.id) }).sort({ createdAt: -1 }).toArray();
  const result = await Promise.all(reviews.map(async (review) => {
    const service = await (await servicesCollection()).findOne({ _id: review.serviceId });
    const customer = await findUserById(review.customerId.toString());
    return toSafeReview(review, { customerName: customer?.name, serviceTitle: service?.title });
  }));
  return NextResponse.json({ reviews: result });
}
