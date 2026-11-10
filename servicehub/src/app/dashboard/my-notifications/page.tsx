import { requireRole } from "@/lib/auth/guards";
import { NotificationList } from "@/components/workshops/notification-list";

export default async function MyNotificationsPage() {
  await requireRole("CUSTOMER");
  return <NotificationList />;
}
