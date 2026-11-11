import { ObjectId } from "mongodb";
import { NotificationList } from "@/components/notifications/notification-list";
import { requireUser } from "@/lib/auth/guards";
import { notificationsCollection, toSafeNotification } from "@/lib/notifications/notifications";

export default async function NotificationsPage() {
  const user = await requireUser();
  const records = await (await notificationsCollection())
    .find({ recipientId: new ObjectId(user.id) })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <NotificationList initialNotifications={records.map(toSafeNotification)} />
    </main>
  );
}
