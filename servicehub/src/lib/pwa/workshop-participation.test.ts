import { describe, expect, it } from "vitest";
import { syncAndPersistWorkshopParticipationDraft, syncWorkshopParticipationDraft, type WorkshopParticipationDraft } from "./workshop-participation";

const draft: WorkshopParticipationDraft = { id: "local-1", workshopId: "workshop-1", note: "I can help.", clientRequestId: "request-1", state: "PENDING_SYNC", updatedAt: "2026-01-01T00:00:00.000Z" };
const participant = { id: "participant-1", workshopId: "workshop-1", providerId: "provider-1", status: "PENDING", attendance: "NOT_MARKED", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" } as const;
const response = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("workshop participation synchronization", () => {
  it("persists network failures as FAILED", async () => {
    let saved: WorkshopParticipationDraft | undefined;
    const result = await syncAndPersistWorkshopParticipationDraft(draft, async () => { throw new Error("offline"); }, async (value) => { saved = value; });
    expect(result.state).toBe("FAILED");
    expect(result.error).toBe("offline");
    expect(saved?.state).toBe("FAILED");
  });

  it("preserves capacity conflicts instead of treating them as success", async () => {
    await expect(syncWorkshopParticipationDraft(draft, async () => response(409, { error: "The workshop is full." }))).rejects.toThrow("The workshop is full.");
  });

  it("accepts only a verified idempotent duplicate as a successful retry", async () => {
    const result = await syncWorkshopParticipationDraft(draft, async () => response(409, { duplicate: true, participant }));
    expect(result).toEqual({ state: "SUBMITTED", participant, duplicate: true });
  });

  it("persists successful synchronization as SUBMITTED", async () => {
    let saved: WorkshopParticipationDraft | undefined;
    const result = await syncAndPersistWorkshopParticipationDraft(draft, async () => response(201, { participant }), async (value) => { saved = value; });
    expect(result.state).toBe("SUBMITTED");
    expect(saved?.participant?.id).toBe("participant-1");
  });

  it("supports manual retry through the same persistence path", async () => {
    let attempts = 0;
    let saved: WorkshopParticipationDraft | undefined;
    const result = await syncAndPersistWorkshopParticipationDraft({ ...draft, state: "FAILED", error: "offline" }, async () => {
      attempts += 1;
      return response(201, { participant });
    }, async (value) => { saved = value; });
    expect(attempts).toBe(1);
    expect(result.state).toBe("SUBMITTED");
    expect(saved?.error).toBeUndefined();
  });

  it("keeps the failed record available to a later history load", async () => {
    const records = new Map<string, WorkshopParticipationDraft>();
    await syncAndPersistWorkshopParticipationDraft(draft, async () => { throw new Error("validation failed"); }, async (value) => { records.set(value.id, value); });
    const reloaded = records.get(draft.id);
    expect(reloaded?.state).toBe("FAILED");
    expect(reloaded?.error).toBe("validation failed");
  });
});
