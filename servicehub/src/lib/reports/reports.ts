import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/database";
import type { ReportStatus, ReportTargetType, ReportReason, SafeReport } from "@/types/report";
import { listingsCollection } from "@/lib/suppliers/listings";

export type ReportDocument = {
  _id: ObjectId; reporterId: ObjectId; targetType: ReportTargetType; targetId: ObjectId;
  reason: ReportReason; note?: string; status: ReportStatus; adminNote?: string;
  clientRequestId?: string;
  moderationHistory?: Array<{ moderatorId: ObjectId; from: ReportStatus; to: ReportStatus; note?: string; changedAt: Date }>;
  createdAt: Date; updatedAt: Date;
};

export async function reportsCollection() {
  const collection = (await getDatabase()).collection<ReportDocument>("reports");
  await Promise.all([
    collection.createIndex({ reporterId: 1, createdAt: -1 }),
    collection.createIndex({ status: 1, createdAt: -1 }),
    collection.createIndex({ targetType: 1, targetId: 1, createdAt: -1 }),
    collection.createIndex({ reporterId: 1, clientRequestId: 1 }, { unique: true, sparse: true }),
  ]);
  return collection;
}

export function toSafeReport(report: ReportDocument, targetLabel?: string, includePrivate = false): SafeReport {
  return {
    id: report._id.toString(), reporterId: report.reporterId.toString(), targetType: report.targetType,
    targetId: report.targetId.toString(), ...(targetLabel ? { targetLabel } : {}), reason: report.reason,
    ...(includePrivate && report.note ? { note: report.note } : {}), status: report.status,
    ...(includePrivate && report.adminNote ? { adminNote: report.adminNote } : {}),
    createdAt: report.createdAt.toISOString(), updatedAt: report.updatedAt.toISOString(), submissionState: "SUBMITTED",
    ...(includePrivate && report.moderationHistory ? { moderationHistory: report.moderationHistory.map((entry) => ({ moderatorId: entry.moderatorId.toString(), from: entry.from, to: entry.to, ...(entry.note ? { note: entry.note } : {}), changedAt: entry.changedAt.toISOString() })) } : {}),
  };
}

export async function findReportTarget(type: ReportTargetType, id: string) {
  if (!ObjectId.isValid(id)) return null;
  const objectId = new ObjectId(id);
  const database = await getDatabase();
  if (type === "SERVICE") {
    const target = await database.collection<{ _id: ObjectId; title: string; description: string; category: string; price: number; priceUnit: string; city: string; status: string }>("services").findOne({ _id: objectId });
    return target ? { label: target.title, details: { kind: "SERVICE" as const, description: target.description, category: target.category, price: target.price, priceUnit: target.priceUnit, city: target.city } } : null;
  }
  if (type === "SUPPLIER_LISTING") {
    const target = await (await listingsCollection()).findOne({ _id: objectId });
    return target ? { label: target.name, details: { kind: "SUPPLIER_LISTING" as const, description: target.description, category: target.category, unitPrice: target.unitPrice, unitLabel: target.unitLabel, stock: target.stock, available: target.available } } : null;
  }
  if (type === "USER") {
    const target = await database.collection<{ _id: ObjectId; name: string; email: string; role: string; blockedAt?: Date }>("users").findOne({ _id: objectId });
    return target ? { label: target.name, details: { kind: "USER" as const, email: target.email, role: target.role, blocked: Boolean(target.blockedAt) } } : null;
  }
  if (type === "REVIEW") {
    const target = await database.collection<{ _id: ObjectId; comment: string }>("reviews").findOne({ _id: objectId });
    return target ? { label: target.comment.slice(0, 80) || "Review" } : null;
  }
  const target = await database.collection<{ _id: ObjectId; title?: string; name?: string }>("workshops").findOne({ _id: objectId });
  return target ? { label: target.title ?? target.name ?? "Workshop" } : null;
}
