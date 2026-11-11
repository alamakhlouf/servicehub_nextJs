import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/database";

export type WorkshopNotificationType = "ENROLLMENT_APPROVED" | "ENROLLMENT_REJECTED" | "WORKSHOP_CANCELLED" | "WORKSHOP_UPDATED";
export type ChangedWorkshopField = "date" | "location" | "format" | "meetingLink";
export type WorkshopNotificationDocument = {
  _id: ObjectId; userId: ObjectId; type: WorkshopNotificationType; workshopId: ObjectId;
  participantId?: ObjectId; title: string; message: string; changedFields?: ChangedWorkshopField[];
  readAt: Date | null; createdAt: Date;
};

export async function notificationsCollection() {
  const collection = (await getDatabase()).collection<WorkshopNotificationDocument>("workshopNotifications");
  await Promise.all([
    collection.createIndex({ userId: 1, createdAt: -1 }),
    collection.createIndex({ userId: 1, readAt: 1 }),
  ]);
  return collection;
}

export async function createWorkshopNotification(notification: Omit<WorkshopNotificationDocument, "_id" | "createdAt" | "readAt">) {
  try {
    await (await notificationsCollection()).insertOne({ ...notification, _id: new ObjectId(), readAt: null, createdAt: new Date() });
  } catch (error) {
    console.error("Failed to create workshop notification", error);
  }
}

export function notificationToSafe(value: WorkshopNotificationDocument) {
  return {
    id: value._id.toString(), workshopId: value.workshopId.toString(), participantId: value.participantId?.toString(),
    type: value.type, title: value.title, message: value.message, changedFields: value.changedFields,
    readAt: value.readAt?.toISOString() ?? null, createdAt: value.createdAt.toISOString(),
  };
}
