import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { findUserById } from "@/lib/auth/users";
import { participantsCollection, toSafeParticipant } from "@/lib/workshops/participants";
import { workshopsCollection } from "@/lib/workshops/workshops";
import { participationSchema } from "@/lib/workshops/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const { id } = await context.params;
  const user = await apiUser(["PROVIDER", "ADMIN"]);
  if (isApiError(user) || !ObjectId.isValid(id)) return isApiError(user) ? user : NextResponse.json({ error: "Workshop not found." }, { status: 404 });
  const workshop = await (await workshopsCollection()).findOne({ _id: new ObjectId(id), ...(user.role === "ADMIN" ? {} : { organizerId: new ObjectId(user.id) }) });
  if (!workshop) return NextResponse.json({ error: "Workshop not found." }, { status: 404 });
  const records = await (await participantsCollection()).find({ workshopId: workshop._id }).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({ participants: await Promise.all(records.map(async (record) => toSafeParticipant(record, (await findUserById(record.customerId.toString()))?.name))) });
}

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const user = await apiUser(["CUSTOMER"], "Only customers can enroll in workshops.");
  if (isApiError(user)) return user;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Workshop not found." }, { status: 404 });
  const parsed = participationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the enrollment note." }, { status: 400 });
  const collection = await participantsCollection();
  if (parsed.data.clientRequestId) {
    const idempotent = await collection.findOne({ workshopId: new ObjectId(id), customerId: new ObjectId(user.id), clientRequestId: parsed.data.clientRequestId });
    if (idempotent) return NextResponse.json({ participant: toSafeParticipant(idempotent, user.name), duplicate: true });
  }
  const workshop = await (await workshopsCollection()).findOne({ _id: new ObjectId(id), status: "PUBLISHED", startAt: { $gt: new Date() } });
  if (!workshop) return NextResponse.json({ error: "This workshop is not accepting enrollment requests." }, { status: 400 });
  const existing = await collection.findOne({ workshopId: workshop._id, customerId: new ObjectId(user.id) });
  if (existing) return NextResponse.json({ error: `Your enrollment is already ${existing.status.toLowerCase()}.`, participant: toSafeParticipant(existing, user.name) }, { status: 409 });
  const now = new Date();
  const participant = { _id: new ObjectId(), workshopId: workshop._id, customerId: new ObjectId(user.id), note: parsed.data.note || undefined, clientRequestId: parsed.data.clientRequestId, status: "PENDING" as const, attendance: "NOT_MARKED" as const, createdAt: now, updatedAt: now };
  try { await collection.insertOne(participant); } catch {
    if (parsed.data.clientRequestId) {
      const duplicate = await collection.findOne({ workshopId: workshop._id, customerId: new ObjectId(user.id), clientRequestId: parsed.data.clientRequestId });
      if (duplicate) return NextResponse.json({ participant: toSafeParticipant(duplicate, user.name), duplicate: true });
    }
    return NextResponse.json({ error: "An enrollment request already exists." }, { status: 409 });
  }
  return NextResponse.json({ participant: toSafeParticipant(participant, user.name) }, { status: 201 });
}
