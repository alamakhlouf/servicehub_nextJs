"use client";

import { useEffect, useState } from "react";
import { Badge, Card } from "@/components/ui";
import type { SafeReview } from "@/types/review";

export function ReviewsSection({ serviceId }: { serviceId: string }) {
  const [reviews, setReviews] = useState<SafeReview[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { void fetch(`/api/reviews?serviceId=${serviceId}`).then((response) => response.json()).then((data: { reviews?: SafeReview[] }) => { setReviews(data.reviews ?? []); setLoaded(true); }).catch(() => setLoaded(true)); }, [serviceId]);
  if (!loaded) return <p className="mt-8 text-sm text-text-muted">Loading reviews…</p>;
  const average = reviews.length ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : null;
  return <section className="mt-8" aria-labelledby="reviews-heading"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-lg font-bold" id="reviews-heading">Reviews</h2><p className="mt-1 text-sm text-text-muted">{average ? `${average} out of 5 · ${reviews.length} review${reviews.length === 1 ? "" : "s"}` : "No reviews yet"}</p></div>{average ? <Badge tone="success">{average} / 5</Badge> : null}</div>{reviews.length ? <div className="mt-4 grid gap-3">{reviews.map((review) => <Card className="p-4" key={review.id}><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold">{review.rating} out of 5</p><p className="text-xs text-text-subtle">{new Date(review.createdAt).toLocaleDateString()}</p></div>{review.comment ? <p className="mt-3 text-sm leading-6 text-text-muted">{review.comment}</p> : null}<p className="mt-3 text-xs text-text-subtle">{review.customerName ?? "ServiceHub customer"}</p></Card>)}</div> : null}</section>;
}
