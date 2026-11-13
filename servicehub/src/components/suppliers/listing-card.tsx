import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import type { SafeSupplierListing } from "@/types/supplier";

export function ListingCard({ listing, manage = false }: { listing: SafeSupplierListing; manage?: boolean }) {
  return <Card className="flex h-full flex-col overflow-hidden p-0">{listing.imageUrl ? <img alt="" className="h-44 w-full object-cover" src={listing.imageUrl} /> : <div aria-hidden="true" className="h-44 w-full bg-gradient-to-br from-emerald-950 via-surface to-slate-900" />}<div className="flex flex-1 flex-col p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">{listing.category}</p><h2 className="mt-2 font-display text-lg font-bold">{listing.name}</h2></div><Badge tone={listing.available ? "success" : "neutral"}>{listing.available ? `${listing.stock} available` : "Unavailable"}</Badge></div><p className="mt-3 line-clamp-3 text-sm leading-6 text-text-muted">{listing.description}</p><p className="mt-5 text-sm text-text-subtle">{formatUnitPrice(listing.unitPrice, listing.unitLabel)}{listing.supplier ? ` · By ${listing.supplier.name}` : ""}</p><Link className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-blue-300 hover:text-white" href={manage ? `/dashboard/my-listings/${listing.id}/edit` : `/suppliers/${listing.id}`}>{manage ? "Manage listing" : "View product"} <span className="ml-1" aria-hidden="true">→</span></Link></div></Card>;
}

export function formatUnitPrice(price: number, unitLabel: string) {
  return `${new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(price)} / ${unitLabel}`;
}
