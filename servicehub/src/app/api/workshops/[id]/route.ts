import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { findUserById } from "@/lib/auth/users";
import { durationMinutes, workshopSchema } from "@/lib/workshops/validation";
import { canTransition, toSafeWorkshop, workshopDate, workshopsCollection } from "@/lib/workshops/workshops";
import { participantsCollection } from "@/lib/workshops/participants";
import { createWorkshopNotification } from "@/lib/workshops/notifications";

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
    if (status === "PUBLISHED" && (record.format ?? "IN_PERSON") === "ONLINE" && !record.meetingUrl) return NextResponse.json({ error: "A meeting link is required to publish an online workshop." }, { status: 400 });
    const completionStartAt = workshopDate(record.startAt);
    if (status === "COMPLETED" && completionStartAt && completionStartAt > new Date()) return NextResponse.json({ error: "A workshop can only be completed after it starts." }, { status: 400 });
    await collection.updateOne({ _id: record._id }, { $set: { status, updatedAt: new Date(), ...(status === "CANCELLED" ? { approvedParticipantCount: 0 } : {}) } });
    if (status === "CANCELLED") {
      const participants = await (await participantsCollection()).find({ workshopId: record._id, status: { $in: ["PENDING", "APPROVED"] } }).toArray();
      await (await participantsCollection()).updateMany({ workshopId: record._id, status: { $in: ["PENDING", "APPROVED"] } }, { $set: { status: "CANCELLED", updatedAt: new Date() } });
      await Promise.all(participants.map((participant) => createWorkshopNotification({ userId: participant.customerId, workshopId: record._id, participantId: participant._id, type: "WORKSHOP_CANCELLED", title: "Workshop cancelled", message: `The workshop "${record.title}" was cancelled.` })));
    }
    const updatedStatus = await collection.findOne({ _id: record._id });
    if (!updatedStatus) return NextResponse.json({ error: "Workshop was not updated." }, { status: 404 });
    return NextResponse.json({ workshop: toSafeWorkshop(updatedStatus, user.name) });
  }
  if (record.status === "COMPLETED" || record.status === "CANCELLED") return NextResponse.json({ error: "Completed and cancelled workshops are terminal." }, { status: 400 });
  const recordStartAt = workshopDate(record.startAt);
  if (!recordStartAt) return NextResponse.json({ error: "This workshop has invalid date data and cannot be updated." }, { status: 400 });
  const parsed = workshopSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const startAt = new Date(parsed.data.startAt);
  const duration = durationMinutes(parsed.data.startAt, parsed.data.endAt);
  if (parsed.data.capacity < record.approvedParticipantCount) return NextResponse.json({ error: "Capacity cannot be lower than approved participants." }, { status: 400 });
  if (parsed.data.status && !canTransition(record.status, parsed.data.status)) return NextResponse.json({ error: `A ${record.status.toLowerCase()} workshop cannot become ${parsed.data.status.toLowerCase()}.` }, { status: 400 });
  const changedFields = [
    parsed.data.startAt !== recordStartAt.toISOString() ? "date" : null,
    parsed.data.location !== record.location ? "location" : null,
    parsed.data.format !== (record.format ?? "IN_PERSON") ? "format" : null,
    parsed.data.meetingUrl !== record.meetingUrl ? "meetingLink" : null,
  ].filter((field): field is "date" | "location" | "format" | "meetingLink" => Boolean(field));
  await collection.updateOne({ _id: record._id }, { $set: { ...parsed.data, location: parsed.data.format === "ONLINE" ? "Online" : parsed.data.location, meetingUrl: parsed.data.meetingUrl || undefined, imageUrl: parsed.data.imageUrl || undefined, startAt, durationMinutes: duration, updatedAt: new Date() } });
  if (changedFields.length) {
    const enrolled = await (await participantsCollection()).find({ workshopId: record._id, status: { $in: ["PENDING", "APPROVED"] } }).toArray();
    await Promise.all(enrolled.map((participant) => createWorkshopNotification({
      userId: participant.customerId, workshopId: record._id, participantId: participant._id, type: "WORKSHOP_UPDATED",
      title: "Workshop updated",
      message: changedFields.includes("meetingLink") ? `The workshop "${record.title}" was updated. The meeting link was updated. Open the workshop to see it.` : `The workshop "${record.title}" was updated.`,
      changedFields,
    })));
  }
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
  await collection.deleteOne({ _id: record._id });
  await (await participantsCollection()).deleteMany({ workshopId: record._id });
  return NextResponse.json({ deleted: true });
}
