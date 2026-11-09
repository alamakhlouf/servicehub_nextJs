"use client";

import { useEffect, useState } from "react";

export function ServiceWorkerRegistration() {
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);
  const [updateReady, setUpdateReady] = useState(false);
  const [registrationError, setRegistrationError] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    let refreshing = false;
    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker?.addEventListener("controllerchange", handleControllerChange);

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" })
        .then((current) => {
          current.update().catch(() => undefined);
          if (current.waiting) {
            setWaitingWorker(current.waiting);
            setUpdateReady(true);
          }
          current.addEventListener("updatefound", () => {
            const worker = current.installing;
            if (!worker) return;
            worker.addEventListener("statechange", () => {
              if (worker.state === "installed" && navigator.serviceWorker.controller) {
                setWaitingWorker(worker);
                setUpdateReady(true);
              }
            });
          });
        })
        .catch(() => setRegistrationError(true));
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker?.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  function refreshForUpdate() {
    const worker = waitingWorker;
    if (worker) worker.postMessage({ type: "SKIP_WAITING" });
    else window.location.reload();
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4" aria-live="polite">
      {updateReady ? (
        <div className="flex items-center gap-3 rounded-md border border-blue-400/40 bg-surface px-4 py-3 text-sm shadow-lg">
          <span>ServiceHub has been updated.</span>
          <button className="font-semibold text-blue-300 hover:text-blue-200" onClick={refreshForUpdate} type="button">Refresh</button>
        </div>
      ) : offline ? (
        <p className="rounded-md border border-tertiary/40 bg-surface px-4 py-3 text-sm text-amber-100 shadow-lg">You are offline. Public cached content may be outdated.</p>
      ) : registrationError ? (
        <p className="rounded-md border border-error/40 bg-surface px-4 py-3 text-sm text-red-100 shadow-lg">Offline support is unavailable for this session.</p>
      ) : null}
    </div>
  );
}
