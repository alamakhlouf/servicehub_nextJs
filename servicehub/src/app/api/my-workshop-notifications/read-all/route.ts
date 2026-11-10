import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { notificationsCollection } from "@/lib/workshops/notifications";

export async function POST() {
  const user = await apiUser(["CUSTOMER"]);
  if (isApiError(user)) return user;
  await (await notificationsCollection()).updateMany({ userId: new ObjectId(user.id), readAt: null }, { $set: { readAt: new Date() } });
  return NextResponse.json({ read: true }, { headers: { "Cache-Control": "no-store" } });
}
