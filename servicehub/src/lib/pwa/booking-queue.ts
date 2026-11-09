export type QueuedBooking = {
  clientRequestId: string; serviceId: string; serviceTitle: string; providerName?: string;
  requestedDate: string; requestedTime: string; addressOrArea: string; note?: string;
  state: "PENDING_SYNC" | "SYNC_FAILED"; error?: string; createdAt: string; updatedAt: string;
};

const databaseName = "servicehub-pwa";
const storeName = "booking-request-queue";
const version = 2;

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, version);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName, { keyPath: "clientRequestId" });
    };
    request.onsuccess = () => resolve(request.result);
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
