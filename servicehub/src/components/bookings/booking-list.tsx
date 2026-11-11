"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import type { SafeBooking, BookingStatus } from "@/types/booking";
import { listQueuedBookings, syncQueuedBookings, type QueuedBooking } from "@/lib/pwa/booking-queue";
import Link from "next/link";

const tone: Record<string, "neutral" | "success" | "warning" | "error"> = { PENDING: "warning", ACCEPTED: "success", IN_PROGRESS: "neutral", COMPLETED: "success", REJECTED: "error", CANCELLED: "neutral", PENDING_SYNC: "warning", SYNC_FAILED: "error" };

export function BookingList({ initialBookings, provider = false }: { initialBookings: SafeBooking[]; provider?: boolean }) {
  const [bookings, setBookings] = useState(initialBookings);
  const [queued, setQueued] = useState<QueuedBooking[]>([]);
  const [error, setError] = useState("");
  const refreshBookings = useCallback(async () => {
    const response = await fetch("/api/bookings");
    if (response.ok) setBookings(((await response.json()) as { bookings: SafeBooking[] }).bookings);
  }, []);
  const sync = useCallback(async (item?: QueuedBooking) => {
    await syncQueuedBookings(item ? [item.clientRequestId] : undefined);
    setQueued(await listQueuedBookings());
    await refreshBookings();
  }, [refreshBookings]);
  useEffect(() => {
    let active = true;
    const load = async () => {
      const items = await listQueuedBookings();
      if (active) setQueued(items);
      if (navigator.onLine) await sync();
    };
    const online = () => void sync();
    const onSynced = () => {
      void Promise.all([listQueuedBookings().then(setQueued), refreshBookings()]);
    };
    void load();
    window.addEventListener("online", online);
    window.addEventListener("servicehub:booking-synced", onSynced);
    return () => {
      active = false;
      window.removeEventListener("online", online);
      window.removeEventListener("servicehub:booking-synced", onSynced);
    };
  }, [refreshBookings, sync]);
  async function update(id: string, status: BookingStatus, agreedDate?: string, agreedTime?: string) { setError(""); const response = await fetch(`/api/bookings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, ...(agreedDate ? { agreedDate } : {}), ...(agreedTime ? { agreedTime } : {}) }) }); const data = (await response.json()) as { booking?: SafeBooking; error?: string }; if (!response.ok || !data.booking) { setError(data.error ?? "We couldn't update that booking."); return; } setBookings((current) => current.map((booking) => booking.id === id ? data.booking! : booking)); }
  return <div className="w-full max-w-5xl"><div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">{provider ? "Provider workspace" : "Customer workspace"}</p><h1 className="mt-2 font-display text-3xl font-bold">{provider ? "Booking requests" : "My bookings"}</h1><p className="mt-2 text-text-muted">{provider ? "Review requests and keep your availability clear." : "Track requests, confirmations, and completed services."}</p></div>{error ? <p className="mb-5 rounded-md border border-error/50 bg-error/10 px-3 py-2.5 text-sm text-red-100" role="alert">{error}</p> : null}{queued.map((item) => <Card className="mb-4 border-tertiary/40 p-5" key={item.clientRequestId}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-lg font-bold">{item.serviceTitle}</h2><p className="mt-1 text-sm text-text-muted">{item.requestedDate} at {item.requestedTime} · {item.addressOrArea}</p></div><Badge tone={tone[item.state]}> {item.state === "PENDING_SYNC" ? "Pending Sync" : "Sync failed"} </Badge></div>{item.error ? <p className="mt-3 text-sm text-red-200">{item.error}</p> : null}<Button className="mt-4" onClick={() => void sync(item)} size="sm" variant="outline">Retry sync</Button></Card>)}{bookings.length ? <div className="grid gap-4">{bookings.map((booking) => <Card className="p-5" key={booking.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-lg font-bold">{booking.serviceTitle}</h2><p className="mt-1 text-sm text-text-muted">Requested: {booking.requestedDate} at {booking.requestedTime} · {booking.providerName ?? "Provider"}</p>{booking.agreedDate && booking.agreedTime ? <p className="mt-1 text-sm text-emerald-300">Agreed: {booking.agreedDate} at {booking.agreedTime}</p> : null}</div><Badge tone={tone[booking.status]}>{booking.status.replace("_", " ")}</Badge></div><p className="mt-4 text-sm text-text-muted">{booking.addressOrArea}</p>  <div className="mt-5 flex flex-wrap gap-2">{!provider && booking.status === "COMPLETED" ? <Link className="inline-flex min-h-9 items-center rounded-md bg-primary px-3 text-sm font-semibold text-white" href={`/dashboard/reviews/new/${booking.id}`}>Leave a review</Link> : null}{provider && booking.status === "PENDING" ? <><Button onClick={() => void update(booking.id, "ACCEPTED", booking.requestedDate, booking.requestedTime)} size="sm">Accept</Button><Button onClick={() => void update(booking.id, "REJECTED")} size="sm" variant="danger">Reject</Button></> : null}{provider && booking.status === "ACCEPTED" ? <Button onClick={() => void update(booking.id, "IN_PROGRESS")} size="sm">Start work</Button> : null}{provider && booking.status === "IN_PROGRESS" ? <Button onClick={() => void update(booking.id, "COMPLETED")} size="sm">Mark completed</Button> : null}{!provider && booking.status === "PENDING" ? <Button onClick={() => void update(booking.id, "CANCELLED")} size="sm" variant="outline">Cancel request</Button> : null}{provider && booking.status === "ACCEPTED" ? <Button onClick={() => void update(booking.id, "CANCELLED")} size="sm" variant="outline">Cancel booking</Button> : null}</div></Card>)}</div> : queued.length === 0 ? <Card className="border-dashed p-10 text-center"><h2 className="font-display text-lg font-bold">No bookings yet</h2><p className="mt-2 text-sm text-text-muted">{provider ? "Requests for your published services will appear here." : "Browse services to send your first booking request."}</p></Card> : null}</div>;
}
