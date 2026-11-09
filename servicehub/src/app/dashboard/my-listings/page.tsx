import { requireRole } from "@/lib/auth/guards";
import { listingsCollection, toSafeListing } from "@/lib/suppliers/listings";
import { ObjectId } from "mongodb";
import { ListingCard } from "@/components/suppliers/listing-card";
import Link from "next/link";
import { Button, Card } from "@/components/ui";

export default async function MyListingsPage() {
  const user = await requireRole("SUPPLIER"); const listings = await (await listingsCollection()).find({ supplierId: new ObjectId(user.id) }).sort({ updatedAt: -1 }).toArray();
  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="mx-auto w-full max-w-5xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">Supplier workspace</p><h1 className="mt-2 font-display text-3xl font-bold">My listings</h1><p className="mt-2 text-text-muted">Manage the products customers can order from you.</p></div><Button><Link href="/dashboard/my-listings/new">Add product</Link></Button></div>{listings.length ? <div className="mt-8 grid gap-4 md:grid-cols-2">{listings.map((listing) => <ListingCard key={listing._id.toString()} listing={toSafeListing(listing, user)} manage />)}</div> : <Card className="mt-8 border-dashed p-10 text-center"><h2 className="font-display text-lg font-bold">Add your first product</h2><p className="mt-2 text-sm text-text-muted">List materials with clear units, prices, and stock.</p><Link className="mt-5 inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white" href="/dashboard/my-listings/new">Add product</Link></Card>}</div></main>;
}
