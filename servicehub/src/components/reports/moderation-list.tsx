"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, Loading } from "@/components/ui";
import type { SafeReport } from "@/types/report";

export function ModerationList() {
  const [reports, setReports] = useState<SafeReport[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/admin/reports")
      .then((response) => response.json())
      .then((data: { reports?: SafeReport[]; error?: string }) => {
        if (!data.reports) setError(data.error ?? "We couldn't load reports.");
        else setReports(data.reports);
      })
      .catch(() => setError("We couldn't load reports."))
      .finally(() => setLoading(false));
  }, []);

  async function moderate(report: SafeReport, payload: { status?: "UNDER_REVIEW" | "RESOLVED" | "DISMISSED"; action?: "BLOCK_USER" | "DELETE_TARGET" }) {
    const adminNote = window.prompt("Optional moderation note") ?? "";
    const response = await fetch(`/api/admin/reports/${report.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, adminNote }),
    });
    if (!response.ok) {
      setError("That report was updated elsewhere or could not be changed.");
      return;
    }
    const data = (await response.json()) as { report?: SafeReport };
    if (data.report) setReports((current) => current.map((item) => item.id === report.id ? data.report! : item));
  }

  return <div className="mx-auto w-full max-w-5xl">
    <div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">Moderator workspace</p><h1 className="mt-2 font-display text-3xl font-bold">Reports</h1><p className="mt-2 text-text-muted">Review reports and record a clear moderation decision.</p></div>
    {error ? <p className="mb-5 rounded-md border border-error/50 bg-error/10 px-3 py-2 text-sm text-red-100" role="alert">{error}</p> : null}
    {loading ? <Card className="p-10"><Loading label="Loading reports…" /></Card> : reports.length ? <div className="grid gap-4">{reports.map((report) => <Card className="p-5" key={report.id}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-lg font-bold">{report.targetLabel ?? report.targetType.replace("_", " ")}</h2><p className="mt-1 text-sm text-text-muted">{report.reason} · reported {new Date(report.createdAt).toLocaleDateString()}</p></div><Badge tone="warning">{report.status.replace("_", " ")}</Badge></div>
      {report.targetDetails ? <div className="mt-4 grid gap-1 rounded-md bg-surface-elevated p-3 text-sm text-text-muted"><p>{report.targetDetails.description}</p>{report.targetDetails.category ? <p>Category: {report.targetDetails.category}</p> : null}{report.targetDetails.city ? <p>Location: {report.targetDetails.city}</p> : null}{report.targetDetails.price !== undefined ? <p>Price: {report.targetDetails.price} ({report.targetDetails.priceUnit})</p> : null}{report.targetDetails.unitPrice !== undefined ? <p>Price: {report.targetDetails.unitPrice} / {report.targetDetails.unitLabel}</p> : null}{report.targetDetails.stock !== undefined ? <p>Stock: {report.targetDetails.stock}</p> : null}{report.targetDetails.email ? <p>Email: {report.targetDetails.email}</p> : null}</div> : null}
      {report.note ? <p className="mt-4 rounded-md bg-surface-elevated p-3 text-sm text-text-muted">{report.note}</p> : null}
      {report.status === "PENDING" || report.status === "UNDER_REVIEW" ? <div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => void moderate(report, { status: "UNDER_REVIEW" })} size="sm" variant="outline">Mark under review</Button>{report.targetDetails?.kind === "USER" && !report.targetDetails.blocked ? <Button onClick={() => void moderate(report, { action: "BLOCK_USER" })} size="sm" variant="danger">Block user</Button> : null}{["SERVICE", "SUPPLIER_LISTING"].includes(report.targetType) ? <Button onClick={() => void moderate(report, { action: "DELETE_TARGET" })} size="sm" variant="danger">Delete {report.targetType === "SERVICE" ? "service" : "supply"}</Button> : null}<Button onClick={() => void moderate(report, { status: "RESOLVED" })} size="sm">Resolve</Button><Button onClick={() => void moderate(report, { status: "DISMISSED" })} size="sm" variant="danger">Dismiss</Button></div> : null}
    </Card>)}</div> : <Card className="border-dashed p-10 text-center"><h2 className="font-display text-lg font-bold">No reports</h2><p className="mt-2 text-sm text-text-muted">No reports have been submitted yet.</p></Card>}
  </div>;
}
