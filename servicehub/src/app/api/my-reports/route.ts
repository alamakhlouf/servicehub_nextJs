import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { findReportTarget, reportsCollection, toSafeReport } from "@/lib/reports/reports";

export async function GET() {
  const user = await apiUser(["CUSTOMER", "PROVIDER", "SUPPLIER", "ADMIN"]);
  if (isApiError(user)) return user;
  const reports = await (await reportsCollection()).find({ reporterId: new ObjectId(user.id) }).sort({ createdAt: -1 }).toArray();
  const result = await Promise.all(reports.map(async (report) => {
    const target = await findReportTarget(report.targetType, report.targetId.toString());
    return toSafeReport(report, target?.label, true);
  }));
  return NextResponse.json({ reports: result });
}
