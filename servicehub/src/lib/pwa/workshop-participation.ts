import type { SafeWorkshopParticipant } from "@/types/workshop";

export type WorkshopParticipationState = "PENDING_SYNC" | "FAILED" | "SUBMITTED";
export type WorkshopParticipationDraft = {
  id: string;
  workshopId: string;
  note: string;
  clientRequestId: string;
  state: WorkshopParticipationState;
  error?: string;
  participant?: SafeWorkshopParticipant;
  updatedAt: string;
};

export type WorkshopParticipationSyncResult = {
  state: "SUBMITTED";
  participant?: SafeWorkshopParticipant;
  duplicate: boolean;
};

const databaseName = "servicehub-workshops-pwa";
const storeName = "participation-drafts";
const version = 2;

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, version);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open workshop drafts"));
  });
}

async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(database.transaction(storeName, mode).objectStore(storeName));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Workshop draft operation failed"));
    });
  } finally {
    database.close();
  }
}

export const saveWorkshopParticipationDraft = (draft: WorkshopParticipationDraft) => transaction("readwrite", (store) => store.put(draft));
export const deleteWorkshopParticipationDraft = (id: string) => transaction("readwrite", (store) => store.delete(id));
export async function listWorkshopParticipationDrafts() { return (await transaction<WorkshopParticipationDraft[]>("readonly", (store) => store.getAll())) as WorkshopParticipationDraft[]; }

export async function syncWorkshopParticipationDraft(
  draft: WorkshopParticipationDraft,
  request: typeof fetch = fetch,
): Promise<WorkshopParticipationSyncResult> {
  let response: Response;
  try {
    response = await request(`/api/workshops/${draft.workshopId}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: draft.note, clientRequestId: draft.clientRequestId }),
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Network synchronization failed.");
  }

  const data = await response.json().catch(() => ({})) as { participant?: SafeWorkshopParticipant; duplicate?: boolean; error?: string };
  if (response.ok && data.participant) return { state: "SUBMITTED", participant: data.participant, duplicate: false };
  if (response.status === 409 && data.duplicate === true && data.participant) return { state: "SUBMITTED", participant: data.participant, duplicate: true };
  throw new Error(data.error ?? `Synchronization failed with status ${response.status}.`);
}

export async function syncAndPersistWorkshopParticipationDraft(
  draft: WorkshopParticipationDraft,
  request: typeof fetch = fetch,
  persist: (draft: WorkshopParticipationDraft) => Promise<unknown> = saveWorkshopParticipationDraft,
) {
  try {
    const result = await syncWorkshopParticipationDraft(draft, request);
    const updated = { ...draft, state: result.state, participant: result.participant, error: undefined, updatedAt: new Date().toISOString() };
    await persist(updated);
    return updated;
  } catch (reason) {
    const updated = { ...draft, state: "FAILED" as const, error: reason instanceof Error ? reason.message : "Synchronization failed.", updatedAt: new Date().toISOString() };
    await persist(updated);
    return updated;
  }
}
