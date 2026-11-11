import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { notificationsCollection } from "@/lib/workshops/notifications";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await apiUser(["CUSTOMER"]);
  if (isApiError(user)) return user;
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Notification not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const result = await (await notificationsCollection()).updateOne({ _id: new ObjectId(id), userId: new ObjectId(user.id) }, { $set: { readAt: new Date() } });
  if (!result.matchedCount) return NextResponse.json({ error: "Notification not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ read: true }, { headers: { "Cache-Control": "no-store" } });
}
