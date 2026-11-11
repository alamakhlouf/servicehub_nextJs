"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [previous, setPrevious] = useState(0);
  const [toast, setToast] = useState("");
  async function refresh() {
    try {
      const response = await fetch("/api/my-workshop-notifications?limit=1&unreadOnly=true", { cache: "no-store" });
      if (!response.ok) return;
      const next = (await response.json() as { unreadCount: number }).unreadCount;
      if (next > previous && previous !== 0) setToast("You have new workshop updates.");
      setPrevious(next);
      setCount(next);
      window.setTimeout(() => setToast(""), 3000);
    } catch { /* Offline keeps the last known count. */ }
  }
  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 60000);
    const onFocus = () => void refresh();
    const onOnline = () => void refresh();
    window.addEventListener("focus", onFocus); window.addEventListener("online", onOnline);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); window.removeEventListener("focus", onFocus); window.removeEventListener("online", onOnline); };
  }, []);
  return <><Link aria-label={`Notifications, ${count} unread`} className="relative inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-border text-sm hover:bg-surface" href="/dashboard/my-notifications">🔔{count > 0 ? <span className="absolute -right-1 -top-1 rounded-full bg-error px-1.5 text-xs text-white">{count > 9 ? "9+" : count}</span> : null}</Link><span aria-live="polite" className="sr-only">{toast}</span></>;
}
