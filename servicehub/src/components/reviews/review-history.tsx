"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import type { SafeReview } from "@/types/review";
import { listReviewDrafts, syncReviewDraft } from "@/lib/pwa/review-drafts";

export function ReviewHistory() {
  const [reviews, setReviews] = useState<SafeReview[]>([]); const [error, setError] = useState("");
  useEffect(() => {
    const load = async () => {
      if (navigator.onLine) { const drafts = await listReviewDrafts(); await Promise.all(drafts.filter((draft) => draft.state === "PENDING_SYNC").map((draft) => syncReviewDraft(draft).catch(() => undefined))); }
      const response = await fetch("/api/my-reviews"); const data = (await response.json()) as { reviews?: SafeReview[]; error?: string }; if (!data.reviews) setError(data.error ?? "We couldn't load your reviews."); else setReviews(data.reviews);
    };
    void load().catch(() => setError("We couldn't load your reviews."));
    const online = () => { void load().catch(() => setError("We couldn't load your reviews.")); };
    window.addEventListener("online", online); return () => window.removeEventListener("online", online);
  }, []);
  async function remove(id: string) { if (!window.confirm("Delete this review?")) return; const response = await fetch(`/api/reviews/${id}`, { method: "DELETE" }); if (response.ok) setReviews((current) => current.filter((review) => review.id !== id)); else setError("We couldn't delete that review."); }
  return <div className="mx-auto w-full max-w-4xl"><div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">Customer workspace</p><h1 className="mt-2 font-display text-3xl font-bold">My reviews</h1><p className="mt-2 text-text-muted">Feedback you have shared about completed services.</p></div>{error ? <p className="mb-5 rounded-md border border-error/50 bg-error/10 px-3 py-2 text-sm text-red-100" role="alert">{error}</p> : null}{reviews.length ? <div className="grid gap-4">{reviews.map((review) => <Card className="p-5" key={review.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-lg font-bold">{review.serviceTitle ?? "Service"}</h2><p className="mt-1 text-sm text-text-muted">{review.rating} out of 5 · {new Date(review.createdAt).toLocaleDateString()}</p></div><Link className="text-sm font-semibold text-blue-300 hover:text-white" href={`/services/${review.serviceId}`}>View service</Link></div>{review.comment ? <p className="mt-4 text-sm leading-6 text-text-muted">{review.comment}</p> : null}<div className="mt-5 flex gap-2"><Link className="inline-flex min-h-9 items-center rounded-md border border-border px-3 text-sm font-semibold text-text-muted hover:text-text" href={`/dashboard/reviews/new/${review.bookingId}`}>Edit</Link><Button onClick={() => void remove(review.id)} size="sm" variant="danger">Delete</Button></div></Card>)}</div> : <Card className="border-dashed p-10 text-center"><h2 className="font-display text-lg font-bold">No reviews yet</h2><p className="mt-2 text-sm text-text-muted">Complete a booking to share your experience.</p></Card>}</div>;
}
