import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { findReportTarget, reportsCollection, toSafeReport } from "@/lib/reports/reports";
import { reportStatuses, type ReportStatus } from "@/types/report";

export async function GET(request: Request) {
  const user = await apiUser(["ADMIN"]);
  if (isApiError(user)) return user;
  const value = new URL(request.url).searchParams.get("status");
  if (value && !reportStatuses.includes(value as ReportStatus)) return NextResponse.json({ error: "Invalid report status." }, { status: 400 });
  const filter = value ? { status: value as ReportStatus } : { status: { $in: ["PENDING", "UNDER_REVIEW"] as ReportStatus[] } };
  const reports = await (await reportsCollection()).find(filter).sort({ createdAt: 1 }).limit(100).toArray();
  const result = await Promise.all(reports.map(async (report) => {
    const target = await findReportTarget(report.targetType, report.targetId.toString());
    return toSafeReport(report, target?.label, true);
  }));
  return NextResponse.json({ reports: result });
}
