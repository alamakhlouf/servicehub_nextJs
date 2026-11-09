export type ReviewDraftState = "DRAFT" | "PENDING_SYNC" | "FAILED";
export type ReviewDraft = { id: string; bookingId: string; serviceId: string; serviceTitle: string; rating: number; comment: string; clientRequestId: string; state: ReviewDraftState; error?: string; updatedAt: string };
const databaseName = "servicehub-reviews-pwa";
const storeName = "review-drafts";
const version = 4;

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, version);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName, { keyPath: "id" }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open review drafts"));
  });
}
async function request<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDatabase();
  const result = await new Promise<T>((resolve, reject) => { const operation = action(db.transaction(storeName, mode).objectStore(storeName)); operation.onsuccess = () => resolve(operation.result); operation.onerror = () => reject(operation.error ?? new Error("Review draft operation failed")); });
  db.close(); return result;
}
export const saveReviewDraft = (draft: ReviewDraft) => request("readwrite", (store) => store.put(draft));
export const getReviewDraft = (id: string) => request<ReviewDraft | undefined>("readonly", (store) => store.get(id));
export const listReviewDrafts = () => request<ReviewDraft[]>("readonly", (store) => store.getAll());
export const deleteReviewDraft = (id: string) => request<undefined>("readwrite", (store) => store.delete(id));

export async function syncReviewDraft(draft: ReviewDraft) {
  try {
    const response = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId: draft.bookingId, rating: draft.rating, comment: draft.comment, clientRequestId: draft.clientRequestId }) });
    const data = (await response.json()) as { review?: unknown; error?: string };
    if (!response.ok || !data.review) throw new Error(data.error ?? "Review synchronization failed.");
    await deleteReviewDraft(draft.id);
    return data.review;
  } catch (error) {
    await saveReviewDraft({ ...draft, state: "FAILED", error: error instanceof Error ? error.message : "Review synchronization failed.", updatedAt: new Date().toISOString() });
    throw error;
  }
}
