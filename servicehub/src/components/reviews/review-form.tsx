"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Card, Textarea } from "@/components/ui";
import { deleteReviewDraft, getReviewDraft, saveReviewDraft, syncReviewDraft, type ReviewDraft } from "@/lib/pwa/review-drafts";
import type { SafeReview } from "@/types/review";

export function ReviewForm({ bookingId, serviceId, serviceTitle, existing }: { bookingId: string; serviceId: string; serviceTitle: string; existing?: SafeReview }) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error" | "draft" | "pending">("idle");
  const [clientRequestId, setClientRequestId] = useState(() => crypto.randomUUID());
  useEffect(() => {
    if (existing) return;
    const restore = async () => { const draft = await getReviewDraft(bookingId); if (draft) { setRating(draft.rating); setComment(draft.comment); setClientRequestId(draft.clientRequestId); setState(draft.state === "PENDING_SYNC" ? "pending" : draft.state === "FAILED" ? "error" : "draft"); setMessage(draft.state === "FAILED" ? `FAILED — ${draft.error ?? "Retry synchronization."}` : draft.state === "PENDING_SYNC" ? "PENDING_SYNC — waiting for connectivity." : "DRAFT — not submitted."); } };
    void restore().catch(() => undefined);
    const sync = async () => { const draft = await getReviewDraft(bookingId); if (draft?.state === "PENDING_SYNC") { try { await syncReviewDraft(draft); setState("success"); setMessage("SUBMITTED — review synchronized."); } catch (error) { const failed = { ...draft, state: "FAILED" as const, error: error instanceof Error ? error.message : "Synchronization failed.", updatedAt: new Date().toISOString() }; await saveReviewDraft(failed); setState("error"); setMessage(`FAILED — ${failed.error}`); } } };
    window.addEventListener("online", sync); return () => window.removeEventListener("online", sync);
  }, [bookingId, existing]);
  function saveDraft(nextRating: number, nextComment: string, nextState: ReviewDraft["state"] = "DRAFT") { void saveReviewDraft({ id: bookingId, bookingId, serviceId, serviceTitle, rating: nextRating, comment: nextComment, clientRequestId, state: nextState, updatedAt: new Date().toISOString() }).catch(() => undefined); }
  function updateComment(value: string) { setComment(value); setState("draft"); setMessage("DRAFT — not submitted."); saveDraft(rating, value); }
  function updateRating(value: number) { setRating(value); setState("draft"); setMessage("DRAFT — not submitted."); saveDraft(value, comment); }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setState("loading"); setMessage("");
    if (!existing && !navigator.onLine) { saveDraft(rating, comment, "PENDING_SYNC"); setState("pending"); setMessage("PENDING_SYNC — saved on this device and not submitted."); return; }
    const response = await fetch(existing ? `/api/reviews/${existing.id}` : "/api/reviews", { method: existing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(existing ? { rating, comment } : { bookingId, rating, comment, clientRequestId }) });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) { setState("error"); setMessage(`FAILED — ${data.error ?? "We couldn't save your review."}`); return; }
    await deleteReviewDraft(bookingId).catch(() => undefined); setState("success"); setMessage(existing ? "SUBMITTED — review updated." : "SUBMITTED — review sent.");
  }
  return <Card className="p-5 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">Completed service</p><h1 className="mt-2 font-display text-2xl font-bold">{existing ? "Edit your review" : "Review your service"}</h1><p className="mt-2 text-sm text-text-muted">{serviceTitle}</p>{message ? <p className={`mt-5 rounded-md border px-3 py-2.5 text-sm ${state === "error" ? "border-error/50 bg-error/10 text-red-100" : "border-secondary/40 bg-secondary/10 text-emerald-100"}`} role={state === "error" ? "alert" : "status"}>{message}</p> : null}{state === "success" ? <Link className="mt-5 inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white" href="/dashboard/my-reviews">View my reviews</Link> : <form className="mt-6 grid gap-5" onSubmit={submit}><fieldset><legend className="text-xs font-semibold text-text-muted">Rating</legend><div className="mt-2 flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map((value) => <button aria-label={`${value} out of 5`} aria-pressed={rating === value} className={`min-h-11 min-w-11 rounded-md border text-sm font-semibold ${rating === value ? "border-primary bg-primary text-white" : "border-border bg-surface text-text-muted hover:border-border-strong"}`} key={value} onClick={() => updateRating(value)} type="button">{value}</button>)}</div></fieldset><Textarea hint="Optional · 500 characters maximum" label="Comment" maxLength={500} name="comment" onChange={(event) => updateComment(event.target.value)} value={comment} /><Button disabled={rating === 0} loading={state === "loading"} type="submit">{existing ? "Save changes" : "Submit review"}</Button></form>}</Card>;
}
