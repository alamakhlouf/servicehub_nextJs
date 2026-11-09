import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { findUserById, toSafeUser } from "@/lib/auth/users";
import { listingsCollection, toSafeListing } from "@/lib/suppliers/listings";
import { supplierListingSchema, supplierQuerySchema } from "@/lib/suppliers/validation";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  const parsed = supplierQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid supplier filters." }, { status: 400 });
  const query: Record<string, unknown> = { available: true, stock: { $gt: 0 } };
  if (parsed.data.category) query.category = parsed.data.category;
  if (parsed.data.q) {
    const q = escapeRegex(parsed.data.q);
    query.$or = [{ name: { $regex: q, $options: "i" } }, { description: { $regex: q, $options: "i" } }, { category: { $regex: q, $options: "i" } }];
  }
  const listings = await (await listingsCollection()).find(query).sort({ updatedAt: -1 }).limit(50).toArray();
  const result = await Promise.all(listings.map(async (listing) => {
    const supplier = await findUserById(listing.supplierId.toString());
    return toSafeListing(listing, supplier ? toSafeUser(supplier) : undefined);
  }));
  return NextResponse.json({ listings: result });
}

export async function POST(request: Request) {
  const user = await apiUser(["SUPPLIER"]);
  if (isApiError(user)) return user;
  const parsed = supplierListingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const now = new Date();
  const listing = { _id: new ObjectId(), supplierId: new ObjectId(user.id), ...parsed.data, createdAt: now, updatedAt: now };
  await (await listingsCollection()).insertOne(listing);
  return NextResponse.json({ listing: toSafeListing(listing, user) }, { status: 201 });
}
