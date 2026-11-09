import { ListingForm } from "@/components/suppliers/listing-form";
import { requireRole } from "@/lib/auth/guards";
export default async function NewListingPage() { await requireRole("SUPPLIER"); return <main className="flex min-h-screen items-start justify-center bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><ListingForm /></main>; }
