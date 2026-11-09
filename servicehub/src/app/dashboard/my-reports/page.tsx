import { requireUser } from "@/lib/auth/guards";
import { ReportHistory } from "@/components/reports/report-history";

export default async function MyReportsPage() {
  await requireUser();
  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><ReportHistory /></main>;
}
