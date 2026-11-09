import Link from "next/link";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth/users";
import { listingsCollection, toSafeListing } from "@/lib/suppliers/listings";
import { findUserById, toSafeUser } from "@/lib/auth/users";
import { Badge, Card } from "@/components/ui";
import { formatUnitPrice } from "@/components/suppliers/listing-card";
import { OrderForm } from "@/components/suppliers/order-form";
import { OfflineNotice } from "@/components/pwa/offline-notice";

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; if (!ObjectId.isValid(id)) notFound();
  const user = await getCurrentUser();
  const listing = await (await listingsCollection()).findOne({ _id: new ObjectId(id), ...(user?.role === "SUPPLIER" ? { $or: [{ available: true, stock: { $gt: 0 } }, { supplierId: new ObjectId(user.id) }] } : { available: true, stock: { $gt: 0 } }) });
  if (!listing) notFound();
  const supplier = await findUserById(listing.supplierId.toString());
  const safe = toSafeListing(listing, supplier ? toSafeUser(supplier) : undefined);
  const canOrder = user?.role === "CUSTOMER" || user?.role === "PROVIDER";
  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="mx-auto w-full max-w-5xl"><Link className="text-sm font-semibold text-blue-300 hover:text-white" href="/suppliers">← Back to products</Link><div className="mt-4"><OfflineNotice /></div><div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]"><Card className="p-5 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">{safe.category}</p><h1 className="mt-2 font-display text-3xl font-bold">{safe.name}</h1></div><Badge tone={safe.available ? "success" : "neutral"}>{safe.available ? `${safe.stock} available` : "Unavailable"}</Badge></div><p className="mt-6 text-lg font-semibold">{formatUnitPrice(safe.unitPrice, safe.unitLabel)}</p><div className="mt-7 border-t border-border pt-6"><h2 className="font-display text-lg font-bold">About this product</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-text-muted">{safe.description}</p></div><div className="mt-7 border-t border-border pt-6"><h2 className="font-display text-lg font-bold">Supplier</h2><p className="mt-2 text-sm">{safe.supplier?.name ?? "Local supplier"}{safe.supplier?.city ? ` · ${safe.supplier.city}` : ""}</p></div></Card>{canOrder && safe.available ? <OrderForm listing={safe} /> : <Card className="h-fit p-5"><h2 className="font-display text-lg font-bold">{safe.available ? "Sign in to order" : "Currently unavailable"}</h2><p className="mt-2 text-sm leading-6 text-text-muted">{safe.available ? "Customers and providers can submit a simple order request." : "This supplier is not accepting orders for this product right now."}</p></Card>}</div></div></main>;
}
