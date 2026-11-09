import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { participantsCollection, toSafeParticipant } from "@/lib/workshops/participants";
import { workshopsCollection } from "@/lib/workshops/workshops";
import { participantUpdateSchema } from "@/lib/workshops/validation";

type Context = { params: Promise<{ id: string; participantId: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id, participantId } = await context.params;
  const user = await apiUser(["PROVIDER", "ADMIN"]);
  if (isApiError(user)) return user;
  if (!ObjectId.isValid(id) || !ObjectId.isValid(participantId)) return NextResponse.json({ error: "Participation not found." }, { status: 404 });
  const workshops = await workshopsCollection();
  const workshop = await workshops.findOne({ _id: new ObjectId(id), ...(user.role === "ADMIN" ? {} : { organizerId: new ObjectId(user.id) }) });
  if (!workshop) return NextResponse.json({ error: "Workshop not found." }, { status: 404 });
  const parsed = participantUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (!parsed.data.status && !parsed.data.attendance)) return NextResponse.json({ error: "Choose a participation or attendance update." }, { status: 400 });
  const collection = await participantsCollection();
  const participant = await collection.findOne({ _id: new ObjectId(participantId), workshopId: workshop._id });
  if (!participant) return NextResponse.json({ error: "Participation not found." }, { status: 404 });
  if (parsed.data.status === "APPROVED") {
    if (participant.status !== "PENDING") return NextResponse.json({ error: "Only pending requests can be approved." }, { status: 400 });
    const reserved = await workshops.findOneAndUpdate({ _id: workshop._id, status: "PUBLISHED", approvedParticipantCount: { $lt: workshop.capacity } }, { $inc: { approvedParticipantCount: 1 }, $set: { updatedAt: new Date() } });
    if (!reserved) return NextResponse.json({ error: "This workshop has reached capacity." }, { status: 409 });
  }
  if (parsed.data.attendance && (participant.status !== "APPROVED" || workshop.status !== "COMPLETED")) return NextResponse.json({ error: "Attendance can be recorded only for approved participants after completion." }, { status: 400 });
  if (parsed.data.status === "CANCELLED" && participant.status === "APPROVED") await workshops.updateOne({ _id: workshop._id, approvedParticipantCount: { $gt: 0 } }, { $inc: { approvedParticipantCount: -1 }, $set: { updatedAt: new Date() } });
  await collection.updateOne({ _id: participant._id }, { $set: { ...parsed.data, updatedAt: new Date() } });
  const updated = await collection.findOne({ _id: participant._id });
  return NextResponse.json({ participant: toSafeParticipant(updated!) });
}
