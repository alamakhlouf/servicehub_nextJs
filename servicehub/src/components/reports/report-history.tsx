"use client";
import { useEffect, useState } from "react";
import { Badge, Card } from "@/components/ui";
import type { SafeReport } from "@/types/report";
import { listReportDrafts, syncReportDraft } from "@/lib/pwa/report-drafts";

const tones = { PENDING: "warning", UNDER_REVIEW: "primary", RESOLVED: "success", DISMISSED: "neutral" } as const;
export function ReportHistory() {
  const [reports, setReports] = useState<SafeReport[]>([]); const [error, setError] = useState("");
  useEffect(() => {
    const load = async () => {
      if (navigator.onLine) { const drafts = await listReportDrafts(); await Promise.all(drafts.filter((draft) => draft.state === "PENDING_SYNC").map((draft) => syncReportDraft(draft).catch(() => undefined))); }
      const response = await fetch("/api/my-reports"); const data = (await response.json()) as { reports?: SafeReport[]; error?: string }; if (!data.reports) setError(data.error ?? "We couldn't load your reports."); else setReports(data.reports);
    };
    void load().catch(() => setError("We couldn't load your reports."));
    const online = () => { void load().catch(() => setError("We couldn't load your reports.")); };
    window.addEventListener("online", online); return () => window.removeEventListener("online", online);
  }, []);
  return <div className="mx-auto w-full max-w-4xl"><div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">Account</p><h1 className="mt-2 font-display text-3xl font-bold">My reports</h1><p className="mt-2 text-text-muted">Track reports you have submitted to ServiceHub.</p></div>{error ? <p className="mb-5 rounded-md border border-error/50 bg-error/10 px-3 py-2 text-sm text-red-100" role="alert">{error}</p> : null}{reports.length ? <div className="grid gap-4">{reports.map((report) => <Card className="p-5" key={report.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-lg font-bold">{report.targetLabel ?? report.targetType.replace("_", " ")}</h2><p className="mt-1 text-sm text-text-muted">{report.reason} · {new Date(report.createdAt).toLocaleDateString()}</p></div><Badge tone={tones[report.status]}>{report.status.replace("_", " ")}</Badge></div>{report.note ? <p className="mt-4 text-sm text-text-muted">{report.note}</p> : null}</Card>)}</div> : <Card className="border-dashed p-10 text-center"><h2 className="font-display text-lg font-bold">No reports submitted</h2><p className="mt-2 text-sm text-text-muted">Reports you submit will appear here with their moderation status.</p></Card>}</div>;
}
