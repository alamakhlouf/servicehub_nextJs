"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import type { SafeService } from "@/types/service";
import type { SafeBooking } from "@/types/booking";
import { saveQueuedBooking } from "@/lib/pwa/booking-queue";

export function BookingForm({ service }: { service: SafeService }) {
  const [values, setValues] = useState({ requestedDate: "", requestedTime: "", addressOrArea: "", note: "" });
  const [state, setState] = useState<"idle" | "loading" | "success" | "offline" | "error">("idle");
  const [message, setMessage] = useState("");
  function update(field: keyof typeof values, value: string) { setValues((current) => ({ ...current, [field]: value })); }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setState("loading"); setMessage("");
    const clientRequestId = crypto.randomUUID();
    const payload = { ...values, serviceId: service.id, clientRequestId };
    if (!navigator.onLine) {
      await saveQueuedBooking({ ...payload, serviceTitle: service.title, ...(service.provider?.name ? { providerName: service.provider.name } : {}), state: "PENDING_SYNC", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      setState("offline"); setMessage("Pending Sync — saved on this device and not yet sent.");
      return;
    }
    try {
      const response = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = (await response.json()) as { booking?: SafeBooking; error?: string };
      if (!response.ok || !data.booking) throw new Error(data.error ?? "We couldn't send the booking request.");
      setState("success"); setMessage("Request sent — awaiting provider confirmation.");
    } catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "We couldn't send the booking request."); }
  }
  return <Card className="p-5 sm:p-8"><div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">Booking request</p><h1 className="mt-2 font-display text-2xl font-bold">Request {service.title}</h1><p className="mt-2 text-sm text-text-muted">{service.provider?.name ?? "Local provider"} · {service.city}</p><p className="mt-1 text-sm text-text-muted">No payment is collected. The provider will review your preferred time.</p></div>
    {message ? <p aria-live="polite" className={`mb-5 rounded-md border px-3 py-2.5 text-sm ${state === "error" ? "border-error/50 bg-error/10 text-red-100" : state === "success" ? "border-secondary/40 bg-secondary/10 text-emerald-100" : "border-tertiary/40 bg-tertiary/10 text-amber-100"}`} role={state === "error" ? "alert" : "status"}>{message}</p> : null}
    {state === "success" || state === "offline" ? <div className="flex flex-wrap gap-3"><Link className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white" href="/dashboard/bookings">View my bookings</Link>{state === "offline" ? <Button onClick={() => { setState("idle"); setMessage(""); }} variant="outline">Continue editing</Button> : null}</div> : <form className="grid gap-4" onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2"><Input label="Preferred date" min={new Date().toISOString().slice(0, 10)} name="requestedDate" onChange={(event) => update("requestedDate", event.target.value)} required type="date" value={values.requestedDate} /><Input label="Preferred time" name="requestedTime" onChange={(event) => update("requestedTime", event.target.value)} required type="time" value={values.requestedTime} /></div><Input label="Service address or area" name="addressOrArea" onChange={(event) => update("addressOrArea", event.target.value)} required value={values.addressOrArea} /><Textarea hint="Optional · 500 characters maximum" label="Note for the provider" name="note" onChange={(event) => update("note", event.target.value)} value={values.note} /><Button loading={state === "loading"} type="submit">Send booking request</Button></form>}
  </Card>;
}
