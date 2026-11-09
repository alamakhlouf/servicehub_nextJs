import { requireRole } from "@/lib/auth/guards";
import { ModerationList } from "@/components/reports/moderation-list";

export default async function AdminReportsPage() {
  await requireRole("ADMIN");
  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><ModerationList /></main>;
}
