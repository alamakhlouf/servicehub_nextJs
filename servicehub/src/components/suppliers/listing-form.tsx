"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import type { SafeSupplierListing } from "@/types/supplier";
import { deleteSupplierListingDraft, getSupplierListingDraft, saveSupplierListingDraft, type SupplierListingDraft } from "@/lib/pwa/supplier-drafts";
import { supplierCategories } from "@/lib/catalog/categories";

type ListingValues = Omit<SupplierListingDraft, "id" | "updatedAt">;

const emptyValues: ListingValues = {
  name: "",
  category: "",
  description: "",
  unitPrice: "",
  unitLabel: "piece",
  stock: "0",
  available: true,
};

export function ListingForm({ listing }: { listing?: SafeSupplierListing }) {
  const router = useRouter();
  const draftId = listing?.id ?? "new";
  const [values, setValues] = useState<ListingValues>(() => listing ? {
    name: listing.name,
    category: listing.category,
    description: listing.description,
    unitPrice: listing.unitPrice.toString(),
    unitLabel: listing.unitLabel,
    stock: listing.stock.toString(),
    available: listing.available,
  } : emptyValues);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [restored, setRestored] = useState(false);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (listing) return;
    let active = true;
    void getSupplierListingDraft(draftId).then((draft) => {
      if (active && draft) {
        setValues({
          name: draft.name,
          category: draft.category,
          description: draft.description,
          unitPrice: draft.unitPrice,
          unitLabel: draft.unitLabel,
          stock: draft.stock,
          available: draft.available,
        });
        setRestored(true);
      }
    }).catch(() => undefined);
    return () => {
      active = false;
    };
  }, [draftId, listing]);

  useEffect(() => {
    if (listing || !hasDraftValues(values)) return;
    const timer = window.setTimeout(() => {
      void saveSupplierListingDraft({ ...values, id: draftId, updatedAt: new Date().toISOString() }).then(() => setSaved(true)).catch(() => undefined);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [draftId, listing, values]);

  const draftLabel = useMemo(() => restored ? "Draft restored — not published" : "Draft — not published", [restored]);

  function update(field: keyof ListingValues, value: string | boolean) {
    setValues((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!navigator.onLine) {
      setError("Reconnect to submit this listing. Your draft is saved on this device.");
      return;
    }
    setLoading(true);
    setError("");
    setErrors({});
    try {
      const response = await fetch(listing ? `/api/suppliers/${listing.id}` : "/api/suppliers", {
        method: listing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, unitPrice: Number(values.unitPrice), stock: Number(values.stock) }),
      });
      const data = (await response.json()) as { error?: string; fieldErrors?: Record<string, string[]> };
      if (!response.ok) {
        setError(data.error ?? "We couldn't save this listing.");
        setErrors(Object.fromEntries(Object.entries(data.fieldErrors ?? {}).map(([key, messages]) => [key, messages[0] ?? ""])));
        return;
      }
      if (!listing) await deleteSupplierListingDraft(draftId);
      router.replace("/dashboard/my-listings");
      router.refresh();
    } catch {
      setError("We couldn't reach ServiceHub. Your draft is still saved.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl p-5 sm:p-7">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">Supplier listing</p>
        <h1 className="mt-2 font-display text-2xl font-bold">{listing ? "Edit product" : "Add a product"}</h1>
        <p className="mt-2 text-sm text-text-muted">Give customers the practical details they need to order.</p>
      </div>
      {!listing ? <p aria-live="polite" className="mb-5 rounded-md border border-tertiary/40 bg-tertiary/10 px-3 py-2.5 text-sm text-amber-100">{draftLabel}</p> : null}
      {!online ? <p aria-live="polite" className="mb-5 rounded-md border border-tertiary/40 bg-tertiary/10 px-3 py-2.5 text-sm text-amber-100">Offline mode — this listing is not published. Reconnect to submit.</p> : null}
      {saved && !listing ? <p className="mb-5 text-xs text-text-subtle">Saved privately on this device.</p> : null}
      {error ? <p className="mb-5 rounded-md border border-error/50 bg-error/10 px-3 py-2.5 text-sm text-red-100" role="alert">{error}</p> : null}
      <form className="grid gap-4" onSubmit={submit}>
        <Input error={errors.name} label="Product name" name="name" onChange={(event) => update("name", event.target.value)} value={values.name} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select error={errors.category} label="Category" name="category" onChange={(event) => update("category", event.target.value)} value={values.category}><option disabled value="">Choose a category</option>{supplierCategories.map((item) => <option key={item} value={item}>{item}</option>)}</Select>
          <Input error={errors.unitLabel} label="Unit label" hint="piece, kg, pack, etc." name="unitLabel" onChange={(event) => update("unitLabel", event.target.value)} value={values.unitLabel} />
        </div>
        <Textarea error={errors.description} label="Description" name="description" onChange={(event) => update("description", event.target.value)} value={values.description} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input error={errors.unitPrice} label="Unit price" min="0" name="unitPrice" onChange={(event) => update("unitPrice", event.target.value)} step="0.01" type="number" value={values.unitPrice} />
          <Input error={errors.stock} label="Available stock" min="0" name="stock" onChange={(event) => update("stock", event.target.value)} step="1" type="number" value={values.stock} />
        </div>
        <Select label="Availability" name="available" onChange={(event) => update("available", event.target.value === "true")} value={String(values.available)}>
          <option value="true">Available to order</option>
          <option value="false">Unavailable</option>
        </Select>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={() => router.back()} type="button" variant="ghost">Cancel</Button>
          <Button disabled={loading} loading={loading} type="submit">{online ? "Submit listing" : "Reconnect to submit"}</Button>
        </div>
      </form>
    </Card>
  );
}

function hasDraftValues(values: ListingValues) {
  return Boolean(values.name || values.category || values.description || values.unitPrice || values.unitLabel || values.stock !== "0");
}
