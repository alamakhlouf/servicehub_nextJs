"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Input, Textarea, Badge, Skeleton } from "@/components/ui";
import type { SafeWorkshop, SafeWorkshopParticipant } from "@/types/workshop";
import { listWorkshopParticipationDrafts, saveWorkshopParticipationDraft, syncWorkshopParticipationDraft, type WorkshopParticipationDraft } from "@/lib/pwa/workshop-participation";

function statusTone(status: string) { return status === "PUBLISHED" || status === "APPROVED" || status === "ATTENDED" ? "success" : status === "PENDING" || status === "DRAFT" ? "warning" : status === "CANCELLED" || status === "REJECTED" || status === "ABSENT" ? "error" : "neutral"; }
function dateLabel(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function workshopCard(workshop: SafeWorkshop) {
  return <Card className="p-5" key={workshop.id}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-300">{workshop.category}</p><h2 className="mt-1 font-display text-xl font-bold">{workshop.title}</h2></div><Badge tone={statusTone(workshop.status)}>{workshop.status}</Badge></div><p className="mt-3 line-clamp-2 text-sm text-text-muted">{workshop.description}</p><dl className="mt-4 grid gap-2 text-sm text-text-muted sm:grid-cols-2"><div><dt className="text-xs text-text-subtle">When</dt><dd>{dateLabel(workshop.startAt)} · {workshop.durationMinutes} min</dd></div><div><dt className="text-xs text-text-subtle">Capacity</dt><dd>{workshop.approvedParticipantCount} of {workshop.capacity} approved</dd></div><div className="sm:col-span-2"><dt className="text-xs text-text-subtle">Location</dt><dd>{workshop.location}</dd></div></dl><Link className="mt-5 inline-flex text-sm font-semibold text-blue-300 hover:text-blue-200" href={`/workshops/${workshop.id}`}>View workshop <span aria-hidden="true" className="ml-1">→</span></Link></Card>;
}

export function WorkshopCatalogue() {
  const [workshops, setWorkshops] = useState<SafeWorkshop[]>([]); const [q, setQ] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const response = await fetch(`/api/workshops${q ? `?q=${encodeURIComponent(q)}` : ""}`); if (!response.ok) throw new Error(); setWorkshops(((await response.json()) as { workshops: SafeWorkshop[] }).workshops); } catch { setError("We couldn't load workshops. Check your connection and try again."); } finally { setLoading(false); } }, [q]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  return <div><div className="max-w-xl"><Input label="Search workshops" name="q" onChange={(event) => setQ(event.target.value)} placeholder="Search by title or location" value={q} /></div>{error ? <p className="mt-5 rounded-md border border-error/50 bg-error/10 p-3 text-sm text-red-100" role="alert">{error}</p> : null}{loading ? <div className="mt-6 grid gap-4 md:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div> : workshops.length ? <div className="mt-6 grid gap-4 md:grid-cols-2">{workshops.map(workshopCard)}</div> : <div className="mt-6 rounded-lg border border-dashed border-border-strong px-5 py-12 text-center"><h2 className="font-display text-lg font-bold">No upcoming workshops</h2><p className="mt-2 text-sm text-text-muted">Check back soon for local provider workshops.</p></div>}</div>;
}

export function WorkshopDetail({ id }: { id: string }) {
  const [workshop, setWorkshop] = useState<SafeWorkshop | null>(null); const [note, setNote] = useState(""); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false); const [syncing, setSyncing] = useState(false);
  useEffect(() => { void fetch(`/api/workshops/${id}`).then(async (response) => { if (!response.ok) throw new Error(); setWorkshop(((await response.json()) as { workshop: SafeWorkshop }).workshop); }).catch(() => setError("This workshop is unavailable." )).finally(() => setLoading(false)); }, [id]);
  useEffect(() => {
    async function sync() {
      const drafts = (await listWorkshopParticipationDrafts()).filter((draft) => draft.workshopId === id && draft.state === "PENDING_SYNC");
      for (const draft of drafts) {
        try {
          const result = await syncWorkshopParticipationDraft(draft);
          await saveWorkshopParticipationDraft({ ...draft, state: result.state, participant: result.participant, error: undefined, updatedAt: new Date().toISOString() });
          setMessage("Submitted — server confirmed your participation request.");
        } catch (reason) {
          await saveWorkshopParticipationDraft({ ...draft, state: "FAILED", error: reason instanceof Error ? reason.message : "Synchronization failed.", updatedAt: new Date().toISOString() });
          setMessage("Sync failed — retry when you are ready.");
        }
      }
    }
    const onOnline = () => void sync();
    window.addEventListener("online", onOnline); void sync();
    return () => window.removeEventListener("online", onOnline);
  }, [id]);
  async function retryDraft() {
    const draft = (await listWorkshopParticipationDrafts()).find((item) => item.workshopId === id && (item.state === "FAILED" || item.state === "PENDING_SYNC"));
    if (!draft) return;
    setSyncing(true);
    try {
      const result = await syncWorkshopParticipationDraft(draft);
      await saveWorkshopParticipationDraft({ ...draft, state: result.state, participant: result.participant, error: undefined, updatedAt: new Date().toISOString() });
      setMessage("Submitted — server confirmed your participation request.");
    } catch (reason) {
      await saveWorkshopParticipationDraft({ ...draft, state: "FAILED", error: reason instanceof Error ? reason.message : "Synchronization failed.", updatedAt: new Date().toISOString() });
      setError(reason instanceof Error ? reason.message : "Synchronization failed."); setMessage("Sync failed — retry when you are ready.");
    } finally { setSyncing(false); }
  }
  async function participate() {
    setSubmitting(true); setError(""); setMessage("");
    const clientRequestId = crypto.randomUUID();
    try {
      const response = await fetch(`/api/workshops/${id}/participants`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note, clientRequestId }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to submit participation request.");
      setMessage("Participation request submitted. The organizer will review it."); setNote("");
    } catch (reason) {
      if (!navigator.onLine) {
        await saveWorkshopParticipationDraft({ id: clientRequestId, workshopId: id, note, clientRequestId, state: "PENDING_SYNC", updatedAt: new Date().toISOString() });
        setMessage("Pending sync — not confirmed"); setNote("");
      } else setError(reason instanceof Error ? reason.message : "Unable to submit participation request.");
    } finally { setSubmitting(false); }
  }
  if (loading) return <Skeleton className="h-96" />; if (error || !workshop) return <p className="rounded-md border border-error/50 bg-error/10 p-4 text-sm text-red-100" role="alert">{error || "Workshop not found."}</p>;
  const full = workshop.approvedParticipantCount >= workshop.capacity;
  return <div className="grid gap-8 lg:grid-cols-[1fr_360px]"><article><p className="text-xs font-semibold uppercase tracking-wide text-blue-300">{workshop.category}</p><h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{workshop.title}</h1><p className="mt-4 max-w-3xl whitespace-pre-wrap text-text-muted">{workshop.description}</p><dl className="mt-8 grid gap-4 rounded-lg border border-border bg-surface p-5 sm:grid-cols-2"><div><dt className="text-xs text-text-subtle">When</dt><dd className="mt-1 text-sm">{dateLabel(workshop.startAt)} · {workshop.durationMinutes} minutes</dd></div><div><dt className="text-xs text-text-subtle">Location</dt><dd className="mt-1 text-sm">{workshop.location}</dd></div><div><dt className="text-xs text-text-subtle">Organizer</dt><dd className="mt-1 text-sm">{workshop.organizerName ?? "ServiceHub provider"}</dd></div><div><dt className="text-xs text-text-subtle">Capacity</dt><dd className="mt-1 text-sm">{workshop.approvedParticipantCount} of {workshop.capacity} approved</dd></div></dl></article><Card className="h-fit p-5"><h2 className="font-display text-lg font-bold">Request participation</h2><p className="mt-2 text-sm text-text-muted">Providers can request a place. The organizer must approve it.</p>{full ? <p className="mt-5 rounded-md border border-tertiary/40 bg-tertiary/10 p-3 text-sm text-amber-100">This workshop is full.</p> : <><Textarea className="mt-5" label="Note (optional)" name="note" maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="Tell the organizer what you bring" value={note} /><Button className="mt-4 w-full" disabled={submitting} loading={submitting} onClick={() => void participate()}>Request participation</Button></>}{message ? <div className="mt-4 space-y-3"><p className="text-sm text-emerald-300" role="status">{message}</p>{message === "Pending sync — not confirmed" ? <Button disabled={syncing} loading={syncing} onClick={() => void retryDraft()} size="sm" variant="outline">Retry sync</Button> : null}</div> : null}{error ? <p className="mt-4 text-sm text-red-200" role="alert">{error}</p> : null}</Card></div>;
}

export function WorkshopForm({ initial }: { initial?: SafeWorkshop }) {
  const [form, setForm] = useState({ title: initial?.title ?? "", description: initial?.description ?? "", category: initial?.category ?? "General", location: initial?.location ?? "", startAt: initial ? new Date(initial.startAt).toISOString().slice(0, 16) : "", endAt: initial ? new Date(new Date(initial.startAt).getTime() + initial.durationMinutes * 60000).toISOString().slice(0, 16) : "", capacity: String(initial?.capacity ?? 10), imageUrl: initial?.imageUrl ?? "" }); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  function change(name: string, value: string) { setForm((current) => ({ ...current, [name]: value })); }
  async function save(status: "DRAFT" | "PUBLISHED") { setSaving(true); setError(""); try { const start = new Date(form.startAt); const end = new Date(form.endAt); if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error("Choose a start and end time."); const body = { ...form, capacity: Number(form.capacity), startAt: start.toISOString(), endAt: end.toISOString(), status }; const response = await fetch(initial ? `/api/workshops/${initial.id}` : "/api/workshops", { method: initial ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const data = await response.json() as { error?: string; workshop?: SafeWorkshop }; if (!response.ok) throw new Error(data.error ?? "Unable to save workshop."); window.location.href = `/dashboard/my-workshops`; } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save workshop."); } finally { setSaving(false); } }
  return <div className="max-w-2xl"><div className="grid gap-5"><Input label="Title" name="title" onChange={(event) => change("title", event.target.value)} value={form.title} /><Textarea label="Description" name="description" onChange={(event) => change("description", event.target.value)} value={form.description} /><div className="grid gap-5 sm:grid-cols-2"><Input label="Category" name="category" onChange={(event) => change("category", event.target.value)} value={form.category} /><Input label="Location" name="location" onChange={(event) => change("location", event.target.value)} value={form.location} /><Input label="Start" name="startAt" onChange={(event) => change("startAt", event.target.value)} type="datetime-local" value={form.startAt} /><Input label="End" name="endAt" onChange={(event) => change("endAt", event.target.value)} type="datetime-local" value={form.endAt} /><Input label="Maximum participants" min="1" name="capacity" onChange={(event) => change("capacity", event.target.value)} type="number" value={form.capacity} /><Input label="Image URL (optional)" name="imageUrl" onChange={(event) => change("imageUrl", event.target.value)} type="url" value={form.imageUrl} /></div></div>{error ? <p className="mt-5 rounded-md border border-error/50 bg-error/10 p-3 text-sm text-red-100" role="alert">{error}</p> : null}<div className="mt-6 flex flex-wrap gap-3"><Button disabled={saving} loading={saving} onClick={() => void save("DRAFT")} type="button" variant="outline">Save draft</Button><Button disabled={saving} loading={saving} onClick={() => void save("PUBLISHED")} type="button">Publish workshop</Button></div></div>;
}

export function WorkshopManager({ initial }: { initial: SafeWorkshop[] }) {
  const [workshops, setWorkshops] = useState(initial); const [error, setError] = useState("");
  async function close(workshop: SafeWorkshop) { if (!window.confirm(`Cancel ${workshop.title}?`)) return; const response = await fetch(`/api/workshops/${workshop.id}`, { method: "DELETE" }); if (!response.ok) { setError("Unable to cancel this workshop."); return; } setWorkshops((items) => items.map((item) => item.id === workshop.id ? { ...item, status: "CANCELLED" } : item)); }
  async function complete(workshop: SafeWorkshop) { const response = await fetch(`/api/workshops/${workshop.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "COMPLETED" }) }); if (!response.ok) { setError("A workshop can only be completed after it has been published."); return; } setWorkshops((items) => items.map((item) => item.id === workshop.id ? { ...item, status: "COMPLETED" } : item)); }
  return <div><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-300">Organizer workspace</p><h1 className="mt-2 font-display text-3xl font-bold">My workshops</h1></div><Link href="/dashboard/my-workshops/new"><Button>Create workshop</Button></Link></div>{error ? <p className="mt-5 text-sm text-red-200" role="alert">{error}</p> : null}<div className="mt-8 grid gap-4 md:grid-cols-2">{workshops.length ? workshops.map((workshop) => <Card className="p-5" key={workshop.id}>{workshopCard(workshop)}<div className="mt-4 flex flex-wrap gap-2">{workshop.status === "PUBLISHED" ? <Button onClick={() => void complete(workshop)} size="sm" type="button" variant="secondary">Mark completed</Button> : null}{workshop.status !== "CANCELLED" && workshop.status !== "COMPLETED" ? <Button onClick={() => void close(workshop)} size="sm" type="button" variant="danger">Cancel</Button> : null}<Link href={`/dashboard/my-workshops/${workshop.id}/participants`}><Button size="sm" type="button" variant="outline">Participants</Button></Link><Link href={`/dashboard/my-workshops/${workshop.id}/edit`}><Button size="sm" type="button" variant="ghost">Edit</Button></Link></div></Card>) : <p className="rounded-lg border border-dashed border-border-strong p-10 text-center text-sm text-text-muted">You have not created any workshops yet.</p>}</div></div>;
}

export function ParticipationHistory() {
  const [items, setItems] = useState<{ participant: SafeWorkshopParticipant; workshop: SafeWorkshop }[]>([]); const [drafts, setDrafts] = useState<Array<{ draft: WorkshopParticipationDraft; workshop: SafeWorkshop }>>([]); const [error, setError] = useState(""); const [syncingId, setSyncingId] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/my-workshop-participation");
    if (!response.ok) throw new Error("Unable to load your workshop participation.");
    const serverItems = ((await response.json()) as { participation: { participant: SafeWorkshopParticipant; workshop: SafeWorkshop }[] }).participation;
    const localDrafts = await listWorkshopParticipationDrafts();
    const serverRequestIds = new Set(serverItems.map((item) => item.participant.clientRequestId).filter(Boolean));
    const visibleDrafts = localDrafts.filter((draft) => !serverRequestIds.has(draft.clientRequestId));
    const localItems = await Promise.all(visibleDrafts.map(async (draft) => {
      const workshopResponse = await fetch(`/api/workshops/${draft.workshopId}`);
      if (!workshopResponse.ok) return null;
      return { draft, workshop: ((await workshopResponse.json()) as { workshop: SafeWorkshop }).workshop };
    }));
    setItems(serverItems); setDrafts(localItems.filter((item): item is { draft: WorkshopParticipationDraft; workshop: SafeWorkshop } => item !== null));
  }, []);
  async function syncOne(draft: WorkshopParticipationDraft) {
    setSyncingId(draft.id); setError("");
    try {
      const result = await syncWorkshopParticipationDraft(draft);
      await saveWorkshopParticipationDraft({ ...draft, state: result.state, participant: result.participant, error: undefined, updatedAt: new Date().toISOString() });
      await load();
    } catch (reason) {
      await saveWorkshopParticipationDraft({ ...draft, state: "FAILED", error: reason instanceof Error ? reason.message : "Synchronization failed.", updatedAt: new Date().toISOString() });
      await load();
    } finally { setSyncingId(""); }
  }
  async function syncAll() { const pending = (await listWorkshopParticipationDrafts()).filter((draft) => draft.state === "PENDING_SYNC"); await Promise.all(pending.map(syncOne)); }
  useEffect(() => { const timer = window.setTimeout(() => void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load your workshop participation.")), 0); const online = () => void syncAll(); window.addEventListener("online", online); return () => { window.clearTimeout(timer); window.removeEventListener("online", online); }; }, [load]);
  const hasContent = items.length > 0 || drafts.length > 0;
  return <div><h1 className="font-display text-3xl font-bold">My participation</h1>{error ? <p className="mt-5 text-sm text-red-200" role="alert">{error}</p> : null}<div className="mt-8 grid gap-4 md:grid-cols-2">{drafts.map(({ draft, workshop }) => <Card className={draft.state === "SUBMITTED" ? "border-success/40 p-5" : "border-tertiary/40 p-5"} key={draft.id}><div className="flex justify-between gap-3"><h2 className="font-display text-lg font-bold">{workshop.title}</h2><Badge tone={draft.state === "FAILED" ? "error" : draft.state === "SUBMITTED" ? "success" : "warning"}>{draft.state === "PENDING_SYNC" ? "PENDING SYNC" : draft.state}</Badge></div><p className="mt-3 text-sm text-text-muted">{dateLabel(workshop.startAt)} · {workshop.location}</p><p className={draft.state === "SUBMITTED" ? "mt-3 text-sm font-semibold text-emerald-300" : "mt-3 text-sm font-semibold text-amber-200"}>{draft.state === "SUBMITTED" ? "Submitted — server confirmed" : "Pending sync — not confirmed"}</p>{draft.error ? <p className="mt-2 text-sm text-red-200">{draft.error}</p> : null}{draft.state !== "SUBMITTED" ? <Button className="mt-4" disabled={syncingId === draft.id} loading={syncingId === draft.id} onClick={() => void syncOne(draft)} size="sm" variant="outline">Retry sync</Button> : null}</Card>)}{items.map(({ participant, workshop }) => <Card className="p-5" key={participant.id}><div className="flex justify-between gap-3"><h2 className="font-display text-lg font-bold">{workshop.title}</h2><Badge tone={statusTone(participant.status)}>{participant.status}</Badge></div><p className="mt-3 text-sm text-text-muted">{dateLabel(workshop.startAt)} · {workshop.location}</p><p className="mt-3 text-sm text-text-muted">Attendance: <span className="text-text">{participant.attendance.replace("_", " ")}</span></p></Card>)}{!hasContent ? <p className="rounded-lg border border-dashed border-border-strong p-10 text-center text-sm text-text-muted">You have no workshop participation yet.</p> : null}</div></div>;
}

export function ParticipantManager({ workshopId, completed }: { workshopId: string; completed: boolean }) {
  const [participants, setParticipants] = useState<SafeWorkshopParticipant[]>([]); const [error, setError] = useState("");
  const load = useCallback(async () => { const response = await fetch(`/api/workshops/${workshopId}/participants`); if (!response.ok) throw new Error(); setParticipants(((await response.json()) as { participants: SafeWorkshopParticipant[] }).participants); }, [workshopId]);
  useEffect(() => { const timer = window.setTimeout(() => void load().catch(() => setError("Unable to load participants.")), 0); return () => window.clearTimeout(timer); }, [load]);
  async function update(id: string, body: Record<string, string>) { const response = await fetch(`/api/workshops/${workshopId}/participants/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (!response.ok) { const data = await response.json() as { error?: string }; setError(data.error ?? "Unable to update participation."); return; } await load(); }
  return <div><h1 className="font-display text-3xl font-bold">Participants</h1>{error ? <p className="mt-5 text-sm text-red-200" role="alert">{error}</p> : null}<div className="mt-8 space-y-3">{participants.length ? participants.map((participant) => <Card className="flex flex-wrap items-center justify-between gap-4 p-4" key={participant.id}><div><p className="font-semibold">{participant.providerName ?? "Provider"}</p><p className="mt-1 text-sm text-text-muted">{participant.note || "No note provided."}</p><div className="mt-2 flex gap-2"><Badge tone={statusTone(participant.status)}>{participant.status}</Badge><Badge tone={statusTone(participant.attendance)}>{participant.attendance}</Badge></div></div><div className="flex flex-wrap gap-2">{participant.status === "PENDING" ? <><Button onClick={() => void update(participant.id, { status: "APPROVED" })} size="sm">Approve</Button><Button onClick={() => void update(participant.id, { status: "REJECTED" })} size="sm" variant="outline">Reject</Button></> : null}{participant.status === "APPROVED" ? <Button onClick={() => void update(participant.id, { status: "CANCELLED" })} size="sm" variant="danger">Cancel</Button> : null}{completed && participant.status === "APPROVED" ? <><Button onClick={() => void update(participant.id, { attendance: "ATTENDED" })} size="sm" variant="secondary">Attended</Button><Button onClick={() => void update(participant.id, { attendance: "ABSENT" })} size="sm" variant="outline">Absent</Button></> : null}</div></Card>) : <p className="rounded-lg border border-dashed border-border-strong p-10 text-center text-sm text-text-muted">No participation requests yet.</p>}</div></div>;
}
