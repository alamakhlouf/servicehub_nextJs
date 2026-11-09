"use client";
import { useCallback, useEffect, useState } from "react";
import { Button, Input, Select, Skeleton } from "@/components/ui";
import type { SafeSupplierListing } from "@/types/supplier";
import { ListingCard } from "./listing-card";
import { OfflineNotice } from "@/components/pwa/offline-notice";
import { supplierCategories } from "@/lib/catalog/categories";

export function SupplierCatalogue() {
  const [listings, setListings] = useState<SafeSupplierListing[]>([]); const [q, setQ] = useState(""); const [category, setCategory] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); const query = `/api/suppliers?${new URLSearchParams({ ...(q ? { q } : {}), ...(category ? { category } : {}) })}`; try { const response = await fetch(query); if (!response.ok) throw new Error(); const data = (await response.json()) as { listings: SafeSupplierListing[] }; setListings(data.listings); } catch { setError("We couldn't load supplier products. Check your connection and try again."); } finally { setLoading(false); } }, [category, q]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 200); return () => window.clearTimeout(timer); }, [load]);
  return <div><div className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-[1fr_220px_auto]"><Input label="Search products" name="q" onChange={(event) => setQ(event.target.value)} placeholder="Try timber or soil" value={q} /><Select label="Category" name="category" onChange={(event) => setCategory(event.target.value)} value={category}><option value="">All categories</option>{supplierCategories.map((item) => <option key={item} value={item}>{item}</option>)}</Select><Button className="self-end" onClick={() => { setQ(""); setCategory(""); }} type="button" variant="ghost">Clear</Button></div><div className="mt-4"><OfflineNotice /></div>{error ? <p className="mt-5 rounded-md border border-error/50 bg-error/10 px-3 py-3 text-sm text-red-100" role="alert">{error}</p> : null}{loading ? <div className="mt-6 grid gap-4 md:grid-cols-2"><Skeleton className="h-56" /><Skeleton className="h-56" /></div> : listings.length ? <div className="mt-6 grid gap-4 md:grid-cols-2">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div> : <div className="mt-6 rounded-lg border border-dashed border-border-strong px-5 py-12 text-center"><h2 className="font-display text-lg font-bold">{q || category ? "No products match these filters" : "No available products yet"}</h2><p className="mt-2 text-sm text-text-muted">Try another search or check back soon.</p></div>}</div>;
}
