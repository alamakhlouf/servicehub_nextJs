import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { findUserById } from "@/lib/auth/users";
import { durationMinutes, workshopSchema } from "@/lib/workshops/validation";
import { canTransition, toSafeWorkshop, workshopsCollection } from "@/lib/workshops/workshops";
import { participantsCollection } from "@/lib/workshops/participants";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Workshop not found." }, { status: 404 });
  const collection = await workshopsCollection();
  const record = await collection.findOne({ _id: new ObjectId(id) });
  if (!record) return NextResponse.json({ error: "Workshop not found." }, { status: 404 });
  if (record.status === "DRAFT") {
    const user = await apiUser();
    if (isApiError(user) || (user.role !== "ADMIN" && (user.role !== "PROVIDER" || user.id !== record.organizerId.toString()))) return NextResponse.json({ error: "Workshop not found." }, { status: 404 });
  }
  const organizer = await findUserById(record.organizerId.toString());
  return NextResponse.json({ workshop: toSafeWorkshop(record, organizer?.name) }, record.status === "DRAFT" ? undefined : { headers: { "X-ServiceHub-Public": "1" } });
}

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const user = await apiUser(["PROVIDER", "ADMIN"]);
  if (isApiError(user)) return user;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Workshop not found." }, { status: 404 });
  const collection = await workshopsCollection();
  const record = await collection.findOne({ _id: new ObjectId(id), ...(user.role === "ADMIN" ? {} : { organizerId: new ObjectId(user.id) }) });
  if (!record) return NextResponse.json({ error: "Workshop not found." }, { status: 404 });
  const body = await request.json().catch(() => null);
  const statusOnly = body && typeof body === "object" && Object.keys(body).length === 1 && "status" in body;
  if (statusOnly) {
    const statusParsed = workshopSchema.pick({ status: true }).safeParse(body);
    if (!statusParsed.success) return NextResponse.json({ error: "Check the workshop status." }, { status: 400 });
    const status = statusParsed.data.status;
    if (!status || !canTransition(record.status, status)) return NextResponse.json({ error: `A ${record.status.toLowerCase()} workshop cannot become ${String(status).toLowerCase()}.` }, { status: 400 });
    if (status === "PUBLISHED" && record.startAt <= new Date()) return NextResponse.json({ error: "A workshop must start in the future." }, { status: 400 });
    if (status === "COMPLETED" && record.startAt > new Date()) return NextResponse.json({ error: "A workshop can only be completed after it starts." }, { status: 400 });
    await collection.updateOne({ _id: record._id }, { $set: { status, updatedAt: new Date(), ...(status === "CANCELLED" ? { approvedParticipantCount: 0 } : {}) } });
    if (status === "CANCELLED") await (await participantsCollection()).updateMany({ workshopId: record._id, status: { $in: ["PENDING", "APPROVED"] } }, { $set: { status: "CANCELLED", updatedAt: new Date() } });
    const updatedStatus = await collection.findOne({ _id: record._id });
    return NextResponse.json({ workshop: toSafeWorkshop(updatedStatus!, user.name) });
  }
  if (record.status === "COMPLETED" || record.status === "CANCELLED") return NextResponse.json({ error: "Completed and cancelled workshops are terminal." }, { status: 400 });
  const parsed = workshopSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const startAt = new Date(parsed.data.startAt);
  const duration = durationMinutes(parsed.data.startAt, parsed.data.endAt);
  if (duration < 15 || duration > 1440 || startAt <= new Date()) return NextResponse.json({ error: "Choose a future start time and a duration between 15 minutes and 24 hours." }, { status: 400 });
  if (parsed.data.capacity < record.approvedParticipantCount) return NextResponse.json({ error: "Capacity cannot be lower than approved participants." }, { status: 400 });
  if (parsed.data.status && !canTransition(record.status, parsed.data.status)) return NextResponse.json({ error: `A ${record.status.toLowerCase()} workshop cannot become ${parsed.data.status.toLowerCase()}.` }, { status: 400 });
  await collection.updateOne({ _id: record._id }, { $set: { ...parsed.data, imageUrl: parsed.data.imageUrl || undefined, startAt, durationMinutes: duration, updatedAt: new Date() } });
  const updated = await collection.findOne({ _id: record._id });
  return NextResponse.json({ workshop: toSafeWorkshop(updated!, user.name) });
}

export async function DELETE(request: Request, context: Context) {
  const { id } = await context.params;
  const user = await apiUser(["PROVIDER", "ADMIN"]);
  if (isApiError(user)) return user;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Workshop not found." }, { status: 404 });
  const collection = await workshopsCollection();
  const record = await collection.findOne({ _id: new ObjectId(id), ...(user.role === "ADMIN" ? {} : { organizerId: new ObjectId(user.id) }) });
  if (!record) return NextResponse.json({ error: "Workshop not found." }, { status: 404 });
  if (record.status === "COMPLETED" || record.status === "CANCELLED") return NextResponse.json({ error: "This workshop is already closed." }, { status: 400 });
  await collection.updateOne({ _id: record._id }, { $set: { status: "CANCELLED", approvedParticipantCount: 0, updatedAt: new Date() } });
  await (await participantsCollection()).updateMany({ workshopId: record._id, status: { $in: ["PENDING", "APPROVED"] } }, { $set: { status: "CANCELLED", updatedAt: new Date() } });
  return NextResponse.json({ cancelled: true });
}
