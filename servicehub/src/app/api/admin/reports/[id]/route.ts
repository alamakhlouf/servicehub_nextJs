import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { findReportTarget, reportsCollection, toSafeReport } from "@/lib/reports/reports";
import { reportStatusSchema } from "@/lib/reports/validation";

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
  const now = new Date();
  const result = await reports.updateOne(
    { _id: current._id, status: current.status },
    {
      $set: { status: parsed.data.status, ...(parsed.data.adminNote ? { adminNote: parsed.data.adminNote } : {}), updatedAt: now },
      $push: { moderationHistory: { moderatorId: new ObjectId(user.id), from: current.status, to: parsed.data.status, ...(parsed.data.adminNote ? { note: parsed.data.adminNote } : {}), changedAt: now } },
    },
  );
  if (result.modifiedCount !== 1) return NextResponse.json({ error: "This report has already been updated." }, { status: 409 });
  const report = await reports.findOne({ _id: new ObjectId(id) });
  const target = report ? await findReportTarget(report.targetType, report.targetId.toString()) : null;
  return NextResponse.json({ report: toSafeReport(report!, target?.label, true) });
}
