export type SupplierListingDraft = {
  id: string;
  name: string;
  category: string;
  description: string;
  unitPrice: string;
  unitLabel: string;
  stock: string;
  available: boolean;
  imageUrl: string;
  updatedAt: string;
};

const databaseName = "servicehub-pwa";
const storeName = "supplier-listing-drafts";
const version = 3;

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, version);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("booking-request-queue")) {
        request.result.createObjectStore("booking-request-queue", { keyPath: "clientRequestId" });
      }
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error ?? new Error("Unable to open draft storage"));
  });
}

export async function saveSupplierListingDraft(draft: SupplierListingDraft) {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(storeName, "readwrite").objectStore(storeName).put(draft);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("Unable to save draft"));
    });
  } finally {
    database.close();
  }
}

export async function getSupplierListingDraft(id: string) {
  const database = await openDatabase();
  try {
    return await new Promise<SupplierListingDraft | undefined>((resolve, reject) => {
      const request = database.transaction(storeName, "readonly").objectStore(storeName).get(id);
      request.onsuccess = () => resolve(request.result as SupplierListingDraft | undefined);
      request.onerror = () => reject(request.error ?? new Error("Unable to read draft"));
    });
  } finally {
    database.close();
  }
}

export async function deleteSupplierListingDraft(id: string) {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(storeName, "readwrite").objectStore(storeName).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("Unable to delete draft"));
    });
  } finally {
    database.close();
  }
}
