import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { findReportTarget, reportsCollection, toSafeReport } from "@/lib/reports/reports";
import { reportCreateSchema } from "@/lib/reports/validation";

export async function POST(request: Request) {
  const user = await apiUser(["CUSTOMER", "PROVIDER", "SUPPLIER", "ADMIN"]);
  if (isApiError(user)) return user;
  const parsed = reportCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the report fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const target = await findReportTarget(parsed.data.targetType, parsed.data.targetId);
  if (!target) return NextResponse.json({ error: "The reported content is no longer available." }, { status: 404 });
  const reports = await reportsCollection();
  if (parsed.data.clientRequestId) {
    const existing = await reports.findOne({ reporterId: new ObjectId(user.id), clientRequestId: parsed.data.clientRequestId });
    if (existing) return NextResponse.json({ report: { ...toSafeReport(existing, target.label, true), ...(target.details ? { targetDetails: target.details } : {}) }, duplicate: true });
  }
  const now = new Date();
  const report = { _id: new ObjectId(), reporterId: new ObjectId(user.id), targetType: parsed.data.targetType, targetId: new ObjectId(parsed.data.targetId), reason: parsed.data.reason, ...(parsed.data.note ? { note: parsed.data.note } : {}), ...(parsed.data.clientRequestId ? { clientRequestId: parsed.data.clientRequestId } : {}), status: "PENDING" as const, createdAt: now, updatedAt: now };
  try { await reports.insertOne(report); } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("duplicate") && parsed.data.clientRequestId) {
      const duplicate = await reports.findOne({ reporterId: report.reporterId, clientRequestId: parsed.data.clientRequestId });
      if (duplicate) return NextResponse.json({ report: { ...toSafeReport(duplicate, target.label, true), ...(target.details ? { targetDetails: target.details } : {}) }, duplicate: true });
    }
    throw error;
  }
  return NextResponse.json({ report: { ...toSafeReport(report, target.label, true), ...(target.details ? { targetDetails: target.details } : {}) } }, { status: 201 });
}
