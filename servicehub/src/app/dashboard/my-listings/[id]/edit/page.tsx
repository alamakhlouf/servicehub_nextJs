import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { requireRole } from "@/lib/auth/guards";
import { listingsCollection, toSafeListing } from "@/lib/suppliers/listings";
import { ListingForm } from "@/components/suppliers/listing-form";
export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) { const user = await requireRole("SUPPLIER"); const { id } = await params; if (!ObjectId.isValid(id)) notFound(); const listing = await (await listingsCollection()).findOne({ _id: new ObjectId(id), supplierId: new ObjectId(user.id) }); if (!listing) notFound(); return <main className="flex min-h-screen items-start justify-center bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><ListingForm listing={toSafeListing(listing, user)} /></main>; }
