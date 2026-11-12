"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { enableBrowserNotifications, getBrowserPushConfiguration } from "@/lib/notifications/browser-push";

type PromptState =
  | { kind: "checking" }
  | { kind: "enabled" }
  | { kind: "needs-setup"; publicKey: string }
  | { kind: "blocked" }
  | { kind: "unavailable"; message: string };

export function NotificationSetupPrompt({ userId }: { userId: string }) {
  const [prompt, setPrompt] = useState<PromptState>({ kind: "checking" });
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem(`servicehub_notification_prompt_dismissed:${userId}`) === "true";
    } catch (error) {
      console.warn("Unable to read browser notification prompt state:", error);
      return false;
    }
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setPrompt({ kind: "unavailable", message: "This browser does not support desktop notifications." });
      return;
    }
    if (Notification.permission === "denied") {
      setPrompt({ kind: "blocked" });
      return;
    }
    try {
      const configuration = await getBrowserPushConfiguration();
      setPrompt(configuration.subscribed
        ? { kind: "enabled" }
        : { kind: "needs-setup", publicKey: configuration.publicKey });
    } catch (reason) {
      setPrompt({
        kind: "unavailable",
        message: reason instanceof Error ? reason.message : "Unable to check browser notification settings.",
      });
    }
  }, []);

  useEffect(() => {
    const refreshTimeout = window.setTimeout(() => void refresh(), 0);
    const handleSubscriptionChange = () => void refresh();
    window.addEventListener("servicehub:push-subscription-changed", handleSubscriptionChange);
    return () => {
      window.clearTimeout(refreshTimeout);
      window.removeEventListener("servicehub:push-subscription-changed", handleSubscriptionChange);
    };
  }, [refresh]);

  function dismiss() {
    try {
      sessionStorage.setItem(`servicehub_notification_prompt_dismissed:${userId}`, "true");
    } catch (error) {
      console.warn("Unable to save browser notification prompt state:", error);
    }
    setDismissed(true);
  }

  async function enable() {
    if (prompt.kind !== "needs-setup") return;
    setBusy(true);
    setError("");
    try {
      await enableBrowserNotifications(prompt.publicKey);
      setPrompt({ kind: "enabled" });
      dismiss();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to enable browser notifications.");
      if (Notification.permission === "denied") setPrompt({ kind: "blocked" });
    } finally {
      setBusy(false);
    }
  }

  if (dismissed || prompt.kind === "checking" || prompt.kind === "enabled") return null;

  const message = prompt.kind === "needs-setup"
    ? "Get updates about bookings, supplier orders, and workshop signups on this device."
    : prompt.kind === "blocked"
      ? "Notifications are blocked for this site. Allow them in your browser or device settings to receive updates."
      : prompt.message;

  return (
    <aside aria-label="Browser notification setup" className="fixed inset-x-0 bottom-4 z-50 px-4" role="region">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-xl sm:p-5">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Turn on notifications?</h2>
          <p className="mt-1 text-sm text-text-muted">{error || message}</p>
        </div>
        <div className="flex items-center gap-2">
          {prompt.kind === "needs-setup" ? (
            <Button disabled={busy} onClick={() => void enable()} size="sm">
              {busy ? "Enabling…" : "Enable"}
            </Button>
          ) : null}
          <Button onClick={dismiss} size="sm" variant="ghost">Not now</Button>
        </div>
      </div>
    </aside>
  );
}
