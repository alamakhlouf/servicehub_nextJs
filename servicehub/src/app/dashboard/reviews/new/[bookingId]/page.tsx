import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { requireRole } from "@/lib/auth/guards";
import { bookingsCollection } from "@/lib/bookings/bookings";
import { reviewsCollection, toSafeReview } from "@/lib/reviews/reviews";
import { ReviewForm } from "@/components/reviews/review-form";

export default async function ReviewPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const user = await requireRole("CUSTOMER");
  const { bookingId } = await params;
  if (!ObjectId.isValid(bookingId)) notFound();
  const booking = await (await bookingsCollection()).findOne({ _id: new ObjectId(bookingId), customerId: new ObjectId(user.id), status: "COMPLETED" });
  if (!booking) notFound();
  const existing = await (await reviewsCollection()).findOne({ bookingId: booking._id });
  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="mx-auto w-full max-w-2xl"><ReviewForm bookingId={bookingId} serviceId={booking.serviceId.toString()} serviceTitle={booking.serviceTitle} existing={existing ? toSafeReview(existing, { customerName: user.name, serviceTitle: booking.serviceTitle }) : undefined} /></div></main>;
}
