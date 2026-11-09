import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/database";
import type { SafeReview } from "@/types/review";

export type ReviewDocument = {
  _id: ObjectId; bookingId: ObjectId; serviceId: ObjectId; providerId: ObjectId; customerId: ObjectId;
  rating: number; comment: string; createdAt: Date; updatedAt: Date;
  clientRequestId?: string;
};

export async function reviewsCollection() {
  const collection = (await getDatabase()).collection<ReviewDocument>("reviews");
  await Promise.all([
    collection.createIndex({ bookingId: 1 }, { unique: true }),
    collection.createIndex({ customerId: 1, clientRequestId: 1 }, { unique: true, sparse: true }),
    collection.createIndex({ serviceId: 1, createdAt: -1 }),
    collection.createIndex({ customerId: 1, createdAt: -1 }),
  ]);
  return collection;
}

export function toSafeReview(review: ReviewDocument, details?: { customerName?: string; serviceTitle?: string }): SafeReview {
  return {
    id: review._id.toString(), bookingId: review.bookingId.toString(), serviceId: review.serviceId.toString(),
    providerId: review.providerId.toString(), customerId: review.customerId.toString(),
    ...(details?.customerName ? { customerName: details.customerName } : {}),
    ...(details?.serviceTitle ? { serviceTitle: details.serviceTitle } : {}),
    rating: review.rating, comment: review.comment, createdAt: review.createdAt.toISOString(), updatedAt: review.updatedAt.toISOString(), submissionState: "SUBMITTED",
  };
}
