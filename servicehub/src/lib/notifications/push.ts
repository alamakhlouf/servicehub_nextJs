import { ObjectId } from "mongodb";
import { sendNotification, setVapidDetails } from "web-push";
import { getDatabase } from "@/lib/db/database";
import type { NotificationDocument } from "@/lib/notifications/notifications";

type PushSubscriptionDocument = {
  _id: ObjectId;
  recipientId: ObjectId;
  endpoint: string;
  expirationTime: number | null;
  keys: { p256dh: string; auth: string };
  createdAt: Date;
};

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

export function getVapidPublicKey() {
  return vapidPublicKey && vapidPrivateKey && vapidSubject ? vapidPublicKey : null;
}

export async function pushSubscriptionsCollection() {
  const collection = (await getDatabase()).collection<PushSubscriptionDocument>("pushSubscriptions");
  await Promise.all([
    collection.createIndex({ recipientId: 1 }),
    collection.createIndex({ endpoint: 1 }, { unique: true }),
  ]);
  return collection;
}

export async function savePushSubscription(recipientId: ObjectId, subscription: Omit<PushSubscriptionDocument, "_id" | "recipientId" | "createdAt">) {
  const collection = await pushSubscriptionsCollection();
  await collection.updateOne(
    { endpoint: subscription.endpoint },
    { $set: { ...subscription, recipientId }, $setOnInsert: { _id: new ObjectId(), createdAt: new Date() } },
    { upsert: true },
  );
}

export async function removePushSubscription(recipientId: ObjectId, endpoint: string) {
  await (await pushSubscriptionsCollection()).deleteOne({ recipientId, endpoint });
}

export async function sendBrowserNotification(notification: NotificationDocument) {
  const publicKey = getVapidPublicKey();
  if (!publicKey || !vapidPrivateKey || !vapidSubject) return;

  setVapidDetails(vapidSubject, publicKey, vapidPrivateKey);
  const collection = await pushSubscriptionsCollection();
  const subscriptions = await collection.find({ recipientId: notification.recipientId }).toArray();
  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await sendNotification(
        { endpoint: subscription.endpoint, expirationTime: subscription.expirationTime, keys: subscription.keys },
        JSON.stringify({
          id: notification._id.toString(),
          title: notification.title,
          body: notification.message,
          href: notification.href,
        }),
      );
    } catch (error) {
      const statusCode = error && typeof error === "object" && "statusCode" in error
        ? error.statusCode
        : undefined;
      if (statusCode === 404 || statusCode === 410) {
        await collection.deleteOne({ _id: subscription._id });
        return;
      }
      console.error("Unable to deliver a browser notification.", { statusCode });
    }
  }));
}
