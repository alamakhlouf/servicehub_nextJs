import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { findUserById } from "@/lib/auth/users";
import { participantsCollection, toSafeParticipant } from "@/lib/workshops/participants";
import { workshopsCollection } from "@/lib/workshops/workshops";
import { participationSchema } from "@/lib/workshops/validation";
import { createNotification } from "@/lib/notifications/notifications";

type Context = { params: Promise<{ id: string }> };

async function notifyOrganizer(workshopId: ObjectId, participantId: ObjectId, providerName: string) {
  const workshop = await (await workshopsCollection()).findOne({ _id: workshopId });
  if (!workshop) return;
  await createNotification({
    recipientId: workshop.organizerId,
    eventKey: `workshop-participation:${participantId.toString()}`,
    kind: "WORKSHOP_PARTICIPATION",
    title: "New workshop signup",
    message: `${providerName} requested to join ${workshop.title}.`,
    href: `/dashboard/my-workshops/${workshop._id.toString()}/participants`,
  });
}

export async function GET(request: Request, context: Context) {
  const { id } = await context.params;
  const user = await apiUser(["PROVIDER", "ADMIN"]);
  if (isApiError(user) || !ObjectId.isValid(id)) return isApiError(user) ? user : NextResponse.json({ error: "Workshop not found." }, { status: 404 });
  const workshop = await (await workshopsCollection()).findOne({ _id: new ObjectId(id), ...(user.role === "ADMIN" ? {} : { organizerId: new ObjectId(user.id) }) });
  if (!workshop) return NextResponse.json({ error: "Workshop not found." }, { status: 404 });
  const records = await (await participantsCollection()).find({ workshopId: workshop._id }).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({ participants: await Promise.all(records.map(async (record) => toSafeParticipant(record, (await findUserById(record.providerId.toString()))?.name))) });
}

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const user = await apiUser(["PROVIDER"]);
  if (isApiError(user)) return user;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Workshop not found." }, { status: 404 });
  const parsed = participationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the participation note." }, { status: 400 });
  const collection = await participantsCollection();
  if (parsed.data.clientRequestId) {
    const idempotent = await collection.findOne({ workshopId: new ObjectId(id), providerId: new ObjectId(user.id), clientRequestId: parsed.data.clientRequestId });
    if (idempotent) {
      await notifyOrganizer(idempotent.workshopId, idempotent._id, user.name);
      return NextResponse.json({ participant: toSafeParticipant(idempotent, user.name), duplicate: true });
    }
  }
  const workshop = await (await workshopsCollection()).findOne({ _id: new ObjectId(id), status: "PUBLISHED" });
  if (!workshop) return NextResponse.json({ error: "This workshop is not accepting participation requests." }, { status: 400 });
  if (workshop.organizerId.toString() === user.id) return NextResponse.json({ error: "You cannot join your own workshop." }, { status: 400 });
  const existing = await collection.findOne({ workshopId: workshop._id, providerId: new ObjectId(user.id) });
  if (existing) return NextResponse.json({ error: `Your participation is already ${existing.status.toLowerCase()}.`, participant: toSafeParticipant(existing, user.name) }, { status: 409 });
  const now = new Date();
  const participant = { _id: new ObjectId(), workshopId: workshop._id, providerId: new ObjectId(user.id), note: parsed.data.note || undefined, clientRequestId: parsed.data.clientRequestId, status: "PENDING" as const, attendance: "NOT_MARKED" as const, createdAt: now, updatedAt: now };
  try { await collection.insertOne(participant); } catch {
    if (parsed.data.clientRequestId) {
      const duplicate = await collection.findOne({ workshopId: workshop._id, providerId: new ObjectId(user.id), clientRequestId: parsed.data.clientRequestId });
      if (duplicate) {
        await notifyOrganizer(duplicate.workshopId, duplicate._id, user.name);
        return NextResponse.json({ participant: toSafeParticipant(duplicate, user.name), duplicate: true });
      }
    }
    return NextResponse.json({ error: "A participation request already exists." }, { status: 409 });
  }
  await notifyOrganizer(workshop._id, participant._id, user.name);
  return NextResponse.json({ participant: toSafeParticipant(participant, user.name) }, { status: 201 });
}
