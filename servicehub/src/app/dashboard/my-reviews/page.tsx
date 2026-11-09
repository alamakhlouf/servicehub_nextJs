import { requireRole } from "@/lib/auth/guards";
import { ReviewHistory } from "@/components/reviews/review-history";

export default async function MyReviewsPage() {
  await requireRole("CUSTOMER");
  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><ReviewHistory /></main>;
}
