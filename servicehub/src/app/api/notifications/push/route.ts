import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { getVapidPublicKey, pushSubscriptionsCollection, removePushSubscription, savePushSubscription } from "@/lib/notifications/push";
import { isAllowedPushEndpoint } from "@/lib/notifications/push-endpoint";

export async function GET(request: Request) {
  const user = await apiUser();
  if (isApiError(user)) return user;
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json({ error: "Browser notifications are not configured on this server yet." }, { status: 503 });
  }
  const endpoint = new URL(request.url).searchParams.get("endpoint");
  if (endpoint && !isAllowedPushEndpoint(endpoint)) {
    return NextResponse.json({ error: "A valid browser push endpoint is required." }, { status: 400 });
  }
  const subscription = await (await pushSubscriptionsCollection()).findOne(
    { recipientId: new ObjectId(user.id), ...(endpoint ? { endpoint } : {}) },
    { projection: { _id: 1 } },
  );
  return NextResponse.json({ publicKey, subscribed: Boolean(subscription) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await apiUser();
  if (isApiError(user)) return user;
  if (!getVapidPublicKey()) {
    return NextResponse.json({ error: "Browser notifications are not configured on this server yet." }, { status: 503 });
  }
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "A valid browser push subscription is required." }, { status: 400 });
  }
  const value = body as { endpoint?: unknown; expirationTime?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  if (!isAllowedPushEndpoint(value.endpoint) ||
      typeof value.keys?.p256dh !== "string" ||
      typeof value.keys.auth !== "string" ||
      value.keys.p256dh.length > 256 ||
      value.keys.auth.length > 256 ||
      (value.expirationTime !== null && value.expirationTime !== undefined && typeof value.expirationTime !== "number")) {
    return NextResponse.json({ error: "The browser push subscription is invalid." }, { status: 400 });
  }
  await savePushSubscription(new ObjectId(user.id), {
    endpoint: value.endpoint,
    expirationTime: value.expirationTime ?? null,
    keys: { p256dh: value.keys.p256dh, auth: value.keys.auth },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await apiUser();
  if (isApiError(user)) return user;
  const body: unknown = await request.json().catch(() => null);
  const endpoint = body && typeof body === "object" ? (body as { endpoint?: unknown }).endpoint : null;
  if (!isAllowedPushEndpoint(endpoint)) {
    return NextResponse.json({ error: "A valid browser push endpoint is required." }, { status: 400 });
  }
  await removePushSubscription(new ObjectId(user.id), endpoint);
  return NextResponse.json({ ok: true });
}
