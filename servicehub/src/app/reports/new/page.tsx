import { requireUser } from "@/lib/auth/guards";
import { ReportForm } from "@/components/reports/report-form";
import type { ReportTargetType } from "@/types/report";

export default async function NewReportPage({ searchParams }: { searchParams: Promise<{ targetType?: string; targetId?: string; label?: string }> }) {
  await requireUser();
  const params = await searchParams;
  const targetType = params.targetType as ReportTargetType;
  if (!["SERVICE", "SUPPLIER_LISTING", "REVIEW", "WORKSHOP"].includes(targetType) || !params.targetId) return <main className="min-h-screen bg-background px-4 py-10 text-center text-text-muted">Choose content to report from its detail page.</main>;
  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="mx-auto w-full max-w-2xl"><ReportForm targetType={targetType} targetId={params.targetId} targetLabel={params.label ?? targetType.toLowerCase().replace("_", " ")} /></div></main>;
}
