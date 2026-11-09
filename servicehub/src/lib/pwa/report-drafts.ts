export type ReportDraftState = "DRAFT" | "PENDING_SYNC" | "FAILED";
export type ReportDraft = { id: string; targetType: string; targetId: string; targetLabel: string; reason: string; note: string; clientRequestId: string; state: ReportDraftState; error?: string; updatedAt: string };
const databaseName = "servicehub-reports-pwa";
const storeName = "report-drafts";
const version = 4;

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, version);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName, { keyPath: "id" }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open report drafts"));
  });
}
async function request<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDatabase();
  const result = await new Promise<T>((resolve, reject) => { const operation = action(db.transaction(storeName, mode).objectStore(storeName)); operation.onsuccess = () => resolve(operation.result); operation.onerror = () => reject(operation.error ?? new Error("Report draft operation failed")); });
  db.close(); return result;
}
export const saveReportDraft = (draft: ReportDraft) => request("readwrite", (store) => store.put(draft));
export const getReportDraft = (id: string) => request<ReportDraft | undefined>("readonly", (store) => store.get(id));
export const listReportDrafts = () => request<ReportDraft[]>("readonly", (store) => store.getAll());
export const deleteReportDraft = (id: string) => request<undefined>("readwrite", (store) => store.delete(id));

export async function syncReportDraft(draft: ReportDraft) {
  try {
    const response = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType: draft.targetType, targetId: draft.targetId, reason: draft.reason, note: draft.note, clientRequestId: draft.clientRequestId }) });
    const data = (await response.json()) as { report?: unknown; error?: string };
    if (!response.ok || !data.report) throw new Error(data.error ?? "Report synchronization failed.");
    await deleteReportDraft(draft.id);
    return data.report;
  } catch (error) {
    await saveReportDraft({ ...draft, state: "FAILED", error: error instanceof Error ? error.message : "Report synchronization failed.", updatedAt: new Date().toISOString() });
    throw error;
  }
}
