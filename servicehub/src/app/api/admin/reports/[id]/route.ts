import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { findReportTarget, reportsCollection, toSafeReport } from "@/lib/reports/reports";
import { reportStatusSchema } from "@/lib/reports/validation";
import { getDatabase } from "@/lib/db/database";
import { servicesCollection } from "@/lib/services/services";
import { listingsCollection } from "@/lib/suppliers/listings";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const user = await apiUser(["ADMIN"]);
  const { id } = await context.params;
  if (isApiError(user)) return user;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  const parsed = reportStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid moderation action.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const reports = await reportsCollection();
  const current = await reports.findOne({ _id: new ObjectId(id) });
  if (!current || !["PENDING", "UNDER_REVIEW"].includes(current.status)) return NextResponse.json({ error: "This report has already been updated." }, { status: 409 });
  if (parsed.data.action === "BLOCK_USER" && current.targetType !== "USER") return NextResponse.json({ error: "Only user reports can block a user." }, { status: 400 });
  if (parsed.data.action === "DELETE_TARGET" && !["SERVICE", "SUPPLIER_LISTING"].includes(current.targetType)) return NextResponse.json({ error: "Only service and supply reports can delete content." }, { status: 400 });
  if (parsed.data.action === "BLOCK_USER") {
    await (await getDatabase()).collection("users").updateOne({ _id: current.targetId }, { $set: { blockedAt: new Date(), updatedAt: new Date() } });
  } else if (parsed.data.action === "DELETE_TARGET") {
    if (current.targetType === "SERVICE") await (await servicesCollection()).updateOne({ _id: current.targetId }, { $set: { status: "ARCHIVED", updatedAt: new Date() } });
    else await (await listingsCollection()).updateOne({ _id: current.targetId }, { $set: { available: false, updatedAt: new Date() } });
  }
  const nextStatus = parsed.data.status ?? "RESOLVED";
  const now = new Date();
  const result = await reports.updateOne(
    { _id: current._id, status: current.status },
    {
      $set: { status: nextStatus, ...(parsed.data.adminNote ? { adminNote: parsed.data.adminNote } : {}), updatedAt: now },
      $push: { moderationHistory: { moderatorId: new ObjectId(user.id), from: current.status, to: nextStatus, ...(parsed.data.adminNote ? { note: parsed.data.adminNote } : {}), changedAt: now } },
    },
  );
  if (result.modifiedCount !== 1) return NextResponse.json({ error: "This report has already been updated." }, { status: 409 });
  const report = await reports.findOne({ _id: new ObjectId(id) });
  const target = report ? await findReportTarget(report.targetType, report.targetId.toString()) : null;
  return NextResponse.json({ report: { ...toSafeReport(report!, target?.label, true), ...(target?.details ? { targetDetails: target.details } : {}) } });
}
