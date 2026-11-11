import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { notificationToSafe, notificationsCollection } from "@/lib/workshops/notifications";

export async function GET(request: Request) {
  const user = await apiUser(["CUSTOMER"], "Only customers can view workshop notifications.");
  if (isApiError(user)) return user;
  const params = new URL(request.url).searchParams;
  const limit = Math.min(Math.max(Number(params.get("limit") ?? 20) || 20, 1), 50);
  const unreadOnly = params.get("unreadOnly") === "true";
  const collection = await notificationsCollection();
  const filter = { userId: new (await import("mongodb")).ObjectId(user.id), ...(unreadOnly ? { readAt: null } : {}) };
  const [items, unreadCount] = await Promise.all([
    collection.find(filter).sort({ createdAt: -1 }).limit(limit).toArray(),
    collection.countDocuments({ userId: filter.userId, readAt: null }),
  ]);
  return NextResponse.json({ items: items.map(notificationToSafe), unreadCount }, { headers: { "Cache-Control": "no-store" } });
}
