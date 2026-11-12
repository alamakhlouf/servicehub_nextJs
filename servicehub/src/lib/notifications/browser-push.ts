"use client";

export type BrowserPushConfiguration = {
  publicKey: string;
  subscribed: boolean;
};

function decodeApplicationServerKey(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

async function pushSubscriptionResponse(method: "POST" | "DELETE", subscription: PushSubscription) {
  const response = await fetch("/api/notifications/push", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(method === "POST" ? subscription.toJSON() : { endpoint: subscription.endpoint }),
  });
  const data = await response.json() as { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Unable to update browser notifications.");
}

export async function getBrowserPushConfiguration(): Promise<BrowserPushConfiguration> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  const endpoint = subscription ? `?endpoint=${encodeURIComponent(subscription.endpoint)}` : "";
  const response = await fetch(`/api/notifications/push${endpoint}`, { cache: "no-store" });
  const data = await response.json() as BrowserPushConfiguration & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Unable to load browser notification settings.");
  return data;
}

export async function enableBrowserNotifications(publicKey: string) {
  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error(permission === "denied"
        ? "Notifications are blocked for this site. Allow them in your browser's site settings."
        : "Notification permission was not granted.");
    }
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const currentKey = subscription.options.applicationServerKey;
    if (currentKey && Array.from(new Uint8Array(currentKey)).join(",") !==
      Array.from(decodeApplicationServerKey(publicKey)).join(",")) {
      await subscription.unsubscribe();
      subscription = null;
    }
  }
  subscription ??= await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeApplicationServerKey(publicKey),
  });
  await pushSubscriptionResponse("POST", subscription);
  window.dispatchEvent(new Event("servicehub:push-subscription-changed"));
}

export async function disableBrowserNotifications() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  await pushSubscriptionResponse("DELETE", subscription);
  await subscription.unsubscribe();
  window.dispatchEvent(new Event("servicehub:push-subscription-changed"));
}
