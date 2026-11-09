"use client";

import { useEffect, useState } from "react";

export function OfflineNotice({ children = "Offline copy — may be outdated" }: { children?: string }) {
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return offline ? <p aria-live="polite" className="rounded-md border border-tertiary/40 bg-tertiary/10 px-3 py-2 text-sm text-amber-100">{children}</p> : null;
}
