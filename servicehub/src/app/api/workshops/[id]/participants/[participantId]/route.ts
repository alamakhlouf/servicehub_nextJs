import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { participantsCollection, toSafeParticipant } from "@/lib/workshops/participants";
import { workshopsCollection } from "@/lib/workshops/workshops";
import { participantUpdateSchema } from "@/lib/workshops/validation";
import { createWorkshopNotification } from "@/lib/workshops/notifications";

type Context = { params: Promise<{ id: string; participantId?: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id, participantId } = await context.params;
  const user = await apiUser();
  if (isApiError(user)) return user;
  if (!ObjectId.isValid(id) || (participantId && !ObjectId.isValid(participantId))) return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
  const participantObjectId = new ObjectId(participantId ?? id);
  const workshops = await workshopsCollection();
  const collection = await participantsCollection();
  const initialParticipant = await collection.findOne({ _id: participantObjectId });
  const workshopId = participantId ? new ObjectId(id) : initialParticipant?.workshopId;
  if (!workshopId) return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
  const workshop = await workshops.findOne({ _id: workshopId });
  if (!workshop) return NextResponse.json({ error: "Workshop not found." }, { status: 404 });
  if (user.role !== "ADMIN" && (user.role !== "PROVIDER" || workshop.organizerId.toString() !== user.id)) {
    if (user.role !== "CUSTOMER") return NextResponse.json({ error: "Only the workshop owner or the enrolling customer may update this enrollment." }, { status: 403 });
  }
  const participant = await collection.findOne({ _id: participantObjectId, workshopId });
  if (!participant) return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
  const parsed = participantUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (!parsed.data.status && !parsed.data.attendance)) return NextResponse.json({ error: "Choose an enrollment status or attendance update." }, { status: 400 });
  const isOwner = user.role === "ADMIN" || (user.role === "PROVIDER" && workshop.organizerId.toString() === user.id);
  if (!isOwner) {
    if (user.role !== "CUSTOMER" || participant.customerId.toString() !== user.id || parsed.data.status !== "CANCELLED" || parsed.data.attendance) {
      return NextResponse.json({ error: "Customers may only cancel their own enrollment." }, { status: 403 });
    }
    if (workshop.startAt <= new Date() || !["PENDING", "APPROVED"].includes(participant.status)) {
      return NextResponse.json({ error: "This enrollment can no longer be cancelled." }, { status: 400 });
    }
  }
  if (parsed.data.status) {
    const allowed = participant.status === "PENDING" && ["APPROVED", "REJECTED", "CANCELLED"].includes(parsed.data.status)
      || participant.status === "APPROVED" && parsed.data.status === "CANCELLED";
    if (!allowed) return NextResponse.json({ error: `Cannot change ${participant.status.toLowerCase()} enrollment to ${parsed.data.status.toLowerCase()}.` }, { status: 400 });
  }
  if (parsed.data.attendance && (participant.status !== "APPROVED" || (workshop.startAt > new Date() && workshop.status !== "COMPLETED"))) {
    return NextResponse.json({ error: "Attendance is available only for approved enrollments after the workshop starts or when completed." }, { status: 400 });
  }
  if (parsed.data.status === "APPROVED") {
    const reserved = await workshops.findOneAndUpdate(
      { _id: workshopId, status: "PUBLISHED", startAt: { $gt: new Date() }, approvedParticipantCount: { $lt: workshop.capacity } },
      { $inc: { approvedParticipantCount: 1 }, $set: { updatedAt: new Date() } },
    );
    if (!reserved) return NextResponse.json({ error: "This workshop has reached capacity or is no longer available." }, { status: 409 });
  }
  if (parsed.data.status === "CANCELLED" && participant.status === "APPROVED") {
    await workshops.updateOne({ _id: workshopId, approvedParticipantCount: { $gt: 0 } }, { $inc: { approvedParticipantCount: -1 }, $set: { updatedAt: new Date() } });
  }
  await collection.updateOne({ _id: participantObjectId }, { $set: { ...parsed.data, updatedAt: new Date() } });
  if (parsed.data.status === "APPROVED" || parsed.data.status === "REJECTED") {
    await createWorkshopNotification({
      userId: participant.customerId, workshopId: workshop._id, participantId: participant._id,
      type: parsed.data.status === "APPROVED" ? "ENROLLMENT_APPROVED" : "ENROLLMENT_REJECTED",
      title: parsed.data.status === "APPROVED" ? "Enrollment approved" : "Enrollment rejected",
      message: `Your enrollment for "${workshop.title}" was ${parsed.data.status.toLowerCase()}.`,
    });
  }
  const updated = await collection.findOne({ _id: participantObjectId });
  return NextResponse.json({ participant: toSafeParticipant(updated!) });
}
