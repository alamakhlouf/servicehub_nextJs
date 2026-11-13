"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { disableBrowserNotifications, enableBrowserNotifications, getBrowserPushConfiguration } from "@/lib/notifications/browser-push";
import type { SafeNotification } from "@/lib/notifications/notifications";

type PushConfiguration = { publicKey: string; subscribed: boolean };

export function NotificationList({ initialNotifications }: { initialNotifications: SafeNotification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [error, setError] = useState("");
  const [pushConfiguration, setPushConfiguration] = useState<PushConfiguration | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState("");
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  useEffect(() => {
    let active = true;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;
    void getBrowserPushConfiguration()
      .then((data) => {
        if (active) setPushConfiguration(data);
      })
      .catch((reason: unknown) => {
        if (active) setPushMessage(reason instanceof Error ? reason.message : "Unable to load browser notification settings.");
      });
    return () => {
      active = false;
    };
  }, []);

  async function toggleBrowserNotifications() {
    setPushBusy(true);
    setPushMessage("");
    try {
      if (!pushConfiguration) throw new Error("Browser notifications are not configured on this server yet.");

      if (pushConfiguration.subscribed) {
        await disableBrowserNotifications();
        setPushConfiguration({ ...pushConfiguration, subscribed: false });
        setPushMessage("Desktop notifications are turned off.");
        return;
      }

      await enableBrowserNotifications(pushConfiguration.publicKey);
      setPushConfiguration({ ...pushConfiguration, subscribed: true });
      setPushMessage("Desktop notifications are enabled for bookings, supplier orders, and workshop signups.");
    } catch (reason) {
      setPushMessage(reason instanceof Error ? reason.message : "Unable to update browser notifications.");
    } finally {
      setPushBusy(false);
    }
  }

  async function markRead(id?: string) {
    setError("");
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { markAll: true }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Unable to update notifications.");
        return false;
      }
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((notification) =>
        (!id || notification.id === id) && !notification.readAt ? { ...notification, readAt } : notification,
      ));
      window.dispatchEvent(new Event("servicehub:notifications-changed"));
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update notifications.");
      return false;
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">Your account</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Notifications</h1>
          <p className="mt-2 text-text-muted">Updates about bookings, supplier orders, and workshop signups.</p>
        </div>
        {unreadCount ? <Button onClick={() => void markRead()} variant="outline">Mark all as read</Button> : null}
      </div>
      <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="font-semibold">Desktop notifications</h2>
          <p className="mt-1 text-sm text-text-muted">
            Show browser notifications on this device, even when ServiceHub is closed.
          </p>
          {pushMessage ? <p className="mt-2 text-sm text-text-muted" role="status">{pushMessage}</p> : null}
        </div>
        {pushConfiguration ? (
          <Button disabled={pushBusy} onClick={() => void toggleBrowserNotifications()} variant={pushConfiguration.subscribed ? "outline" : "primary"}>
            {pushBusy ? "Updating…" : pushConfiguration.subscribed ? "Turn off" : "Enable"}
          </Button>
        ) : null}
      </Card>
      {error ? <p className="mb-5 rounded-md border border-error/50 bg-error/10 px-3 py-2.5 text-sm text-red-100" role="alert">{error}</p> : null}
      {notifications.length ? (
        <div className="grid gap-3">
          {notifications.map((notification) => (
            <Card className={`p-5 ${notification.readAt ? "opacity-75" : "border-primary/50"}`} key={notification.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold">{notification.title}</h2>
                    {!notification.readAt ? <Badge tone="primary">New</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm text-text-muted">{notification.message}</p>
                  <p className="mt-2 text-xs text-text-subtle">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
                <Link
                  className="shrink-0 text-sm font-semibold text-blue-300 hover:text-blue-200"
                  href={notification.href}
                  onClick={() => {
                    if (!notification.readAt) void markRead(notification.id);
                  }}
                >
                  View
                </Link>
              </div>
              {!notification.readAt ? <Button className="mt-4" onClick={() => void markRead(notification.id)} size="sm" variant="ghost">Mark as read</Button> : null}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed p-10 text-center">
          <h2 className="font-display text-lg font-bold">You&apos;re all caught up</h2>
          <p className="mt-2 text-sm text-text-muted">New booking, order, and workshop updates will appear here.</p>
        </Card>
      )}
    </div>
  );
}
