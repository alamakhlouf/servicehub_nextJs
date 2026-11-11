import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { notificationsCollection, toSafeNotification } from "@/lib/notifications/notifications";

export async function GET() {
  const user = await apiUser();
  if (isApiError(user)) return user;
  const collection = await notificationsCollection();
  const recipientId = new ObjectId(user.id);
  const [records, unreadCount] = await Promise.all([
    collection.find({ recipientId }).sort({ createdAt: -1 }).limit(100).toArray(),
    collection.countDocuments({ recipientId, readAt: { $exists: false } }),
  ]);
  return NextResponse.json({ notifications: records.map(toSafeNotification), unreadCount });
}

export async function PATCH(request: Request) {
  const user = await apiUser();
  if (isApiError(user)) return user;
  const body = await request.json().catch(() => null) as { id?: unknown; markAll?: unknown } | null;
  if (!body || (body.markAll !== true && (typeof body.id !== "string" || !ObjectId.isValid(body.id)))) {
    return NextResponse.json({ error: "Choose a valid notification to mark as read." }, { status: 400 });
  }
  const filter = { recipientId: new ObjectId(user.id), readAt: { $exists: false }, ...(body.markAll ? {} : { _id: new ObjectId(body.id as string) }) };
  await (await notificationsCollection()).updateMany(filter, { $set: { readAt: new Date() } });
  return NextResponse.json({ ok: true });
}
