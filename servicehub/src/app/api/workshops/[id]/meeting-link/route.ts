import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { participantsCollection } from "@/lib/workshops/participants";
import { workshopsCollection } from "@/lib/workshops/workshops";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const user = await apiUser();
  if (isApiError(user)) return user;
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Workshop not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const workshop = await (await workshopsCollection()).findOne({ _id: new ObjectId(id) });
  if (!workshop || workshop.status === "CANCELLED" || !workshop.meetingUrl) return NextResponse.json({ error: "Meeting link unavailable." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const owner = user.role === "ADMIN" || (user.role === "PROVIDER" && workshop.organizerId.toString() === user.id);
  const approved = user.role === "CUSTOMER" && await (await participantsCollection()).findOne({ workshopId: workshop._id, customerId: new ObjectId(user.id), status: "APPROVED" });
  if (!owner && !approved) return NextResponse.json({ error: "Only approved customers or the workshop owner can access this link." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ meetingUrl: workshop.meetingUrl }, { headers: { "Cache-Control": "no-store" } });
}
