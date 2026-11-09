"use client";
import { useCallback, useEffect, useState } from "react";
import { Input, Select, Button, Skeleton } from "@/components/ui";
import { ServiceCard } from "./service-card";
import type { SafeService } from "@/types/service";
import { serviceCategories } from "@/lib/catalog/categories";

export function Catalogue() {
  const [services, setServices] = useState<SafeService[]>([]);
  const [q, setQ] = useState(""); const [category, setCategory] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [offline, setOffline] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError(""); setOffline(false);
    const query = `/api/services?${new URLSearchParams({ ...(q ? { q } : {}), ...(category ? { category } : {}) })}`;
    try { const response = await fetch(query); if (!response.ok) throw new Error(); const data = (await response.json()) as { services: SafeService[] }; setServices(data.services); setOffline(response.headers.get("X-ServiceHub-Cache") === "stale"); sessionStorage.setItem(`servicehub_services_cache:${query}`, JSON.stringify(data.services)); }
    catch { const cached = sessionStorage.getItem(`servicehub_services_cache:${query}`); if (cached) { setServices(JSON.parse(cached) as SafeService[]); setOffline(true); } else setError("We couldn't load services. Check your connection and try again."); }
    finally { setLoading(false); }
  }, [category, q]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 150); return () => window.clearTimeout(timer); }, [load]);
  return <div><div className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-[1fr_220px_auto]"><Input label="Search services" name="q" onChange={(event) => setQ(event.target.value)} placeholder="Try plumbing or tutoring" value={q} /><Select label="Category" name="category" onChange={(event) => setCategory(event.target.value)} value={category}><option value="">All categories</option>{serviceCategories.map((item) => <option key={item} value={item}>{item}</option>)}</Select><Button className="self-end" onClick={() => { setQ(""); setCategory(""); }} type="button" variant="ghost">Clear</Button></div>{offline ? <p aria-live="polite" className="mt-4 rounded-md border border-tertiary/40 bg-tertiary/10 px-3 py-2 text-sm text-amber-100">Offline copy — may be outdated</p> : null}{error ? <p className="mt-6 rounded-md border border-error/50 bg-error/10 px-3 py-3 text-sm text-red-100" role="alert">{error}</p> : null}{loading ? <div className="mt-6 grid gap-4 md:grid-cols-2"><Skeleton className="h-56" /><Skeleton className="h-56" /></div> : services.length ? <div className="mt-6 grid gap-4 md:grid-cols-2">{services.map((service) => <ServiceCard key={service.id} service={service} />)}</div> : <div className="mt-6 rounded-lg border border-dashed border-border-strong px-5 py-12 text-center"><h2 className="font-display text-lg font-bold">{q || category ? "No services match these filters" : "No published services yet"}</h2><p className="mt-2 text-sm text-text-muted">{q || category ? "Try a different search or clear the filters." : "Check back soon for local providers."}</p></div>}</div>;
}
