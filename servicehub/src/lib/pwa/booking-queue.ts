export type QueuedBooking = {
  clientRequestId: string; serviceId: string; serviceTitle: string; providerName?: string;
  requestedDate: string; requestedTime: string; addressOrArea: string; note?: string;
  state: "PENDING_SYNC" | "SYNC_FAILED"; error?: string; createdAt: string; updatedAt: string;
};

const databaseName = "servicehub-pwa";
const storeName = "booking-request-queue";
const version = 3;

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, version);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName, { keyPath: "clientRequestId" });
      }
      if (!request.result.objectStoreNames.contains("supplier-listing-drafts")) {
        request.result.createObjectStore("supplier-listing-drafts", { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error ?? new Error("Unable to open booking queue"));
  });
}

async function transaction(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest) {
  const database = await openDatabase();
  const result = await new Promise<unknown>((resolve, reject) => {
    const request = action(database.transaction(storeName, mode).objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Booking queue operation failed"));
  });
  database.close();
  return result;
}

export const saveQueuedBooking = (booking: QueuedBooking) => transaction("readwrite", (store) => store.put(booking));
export const deleteQueuedBooking = (id: string) => transaction("readwrite", (store) => store.delete(id));
export async function listQueuedBookings() {
  return (await transaction("readonly", (store) => store.getAll())) as QueuedBooking[];
}

export async function syncQueuedBookings(clientRequestIds?: string[]) {
  const queued = await listQueuedBookings();
  const items = clientRequestIds
    ? queued.filter((item) => clientRequestIds.includes(item.clientRequestId))
    : queued;
  for (const item of items) {
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: item.serviceId,
          requestedDate: item.requestedDate,
          requestedTime: item.requestedTime,
          addressOrArea: item.addressOrArea,
          note: item.note,
          clientRequestId: item.clientRequestId,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        await saveQueuedBooking({
          ...item,
          state: retryable ? "PENDING_SYNC" : "SYNC_FAILED",
          error: data.error ?? "The server could not accept this booking request.",
          updatedAt: new Date().toISOString(),
        });
        continue;
      }
      await deleteQueuedBooking(item.clientRequestId);
      window.dispatchEvent(new CustomEvent("servicehub:booking-synced", { detail: { clientRequestId: item.clientRequestId } }));
    } catch (error) {
      const failed = {
        ...item,
        state: navigator.onLine ? "SYNC_FAILED" as const : "PENDING_SYNC" as const,
        ...(navigator.onLine ? { error: error instanceof Error ? error.message : "Synchronization failed." } : {}),
        updatedAt: new Date().toISOString(),
      };
      await saveQueuedBooking(failed);
    }
  }
}

export async function registerBookingBackgroundSync() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready as ServiceWorkerRegistration & {
    sync?: { register: (tag: string) => Promise<void> };
  };
  await registration.sync?.register("servicehub-bookings");
}
