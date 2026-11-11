import { MongoServerError, ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/database";
import { sendBrowserNotification } from "@/lib/notifications/push";

export type NotificationKind = "BOOKING_REQUEST" | "SUPPLIER_ORDER" | "WORKSHOP_PARTICIPATION";

export type NotificationDocument = {
  _id: ObjectId;
  recipientId: ObjectId;
  eventKey: string;
  kind: NotificationKind;
  title: string;
  message: string;
  href: string;
  createdAt: Date;
  readAt?: Date;
};

export type SafeNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  href: string;
  createdAt: string;
  readAt?: string;
};

export async function notificationsCollection() {
  const collection = (await getDatabase()).collection<NotificationDocument>("notifications");
  await Promise.all([
    collection.createIndex({ recipientId: 1, createdAt: -1 }),
    collection.createIndex({ recipientId: 1, eventKey: 1 }, { unique: true }),
  ]);
  return collection;
}

export async function createNotification(notification: Omit<NotificationDocument, "_id" | "createdAt" | "readAt">) {
  const now = new Date();
  const collection = await notificationsCollection();
  const filter = { recipientId: notification.recipientId, eventKey: notification.eventKey };
  try {
    const result = await collection.updateOne(
      filter,
      { $setOnInsert: { ...notification, _id: new ObjectId(), createdAt: now } },
      { upsert: true },
    );
    if (result.upsertedCount) {
      const saved = await collection.findOne(filter);
      if (saved) {
        try {
          await sendBrowserNotification(saved);
        } catch (error) {
          console.error("Unable to send browser notification.", error);
        }
      }
    }
  } catch (error) {
    if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
    if (!(await collection.findOne(filter, { projection: { _id: 1 } }))) throw error;
  }
}

export function toSafeNotification(notification: NotificationDocument): SafeNotification {
  return {
    id: notification._id.toString(),
    kind: notification.kind,
    title: notification.title,
    message: notification.message,
    href: notification.href,
    createdAt: notification.createdAt.toISOString(),
    ...(notification.readAt ? { readAt: notification.readAt.toISOString() } : {}),
  };
}
