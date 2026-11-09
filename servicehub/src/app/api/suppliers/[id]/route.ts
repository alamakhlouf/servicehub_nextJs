import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { findUserById, toSafeUser } from "@/lib/auth/users";
import { listingsCollection, toSafeListing } from "@/lib/suppliers/listings";
import { supplierListingUpdateSchema } from "@/lib/suppliers/validation";

type RouteContext = { params: Promise<{ id: string }> };

async function findOwned(id: string, supplierId: string) {
  if (!ObjectId.isValid(id)) return null;
  return (await listingsCollection()).findOne({ _id: new ObjectId(id), supplierId: new ObjectId(supplierId) });
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  const sessionUser = await apiUser();
  const user = isApiError(sessionUser) ? null : sessionUser;
  const listing = await (await listingsCollection()).findOne({
    _id: new ObjectId(id),
    ...(user?.role === "SUPPLIER" ? { $or: [{ available: true, stock: { $gt: 0 } }, { supplierId: new ObjectId(user.id) }] } : { available: true, stock: { $gt: 0 } }),
  });
  if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  const supplier = await findUserById(listing.supplierId.toString());
  return NextResponse.json({ listing: toSafeListing(listing, supplier ? toSafeUser(supplier) : undefined) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const user = await apiUser(["SUPPLIER"]);
  if (isApiError(user)) return user;
  const listing = await findOwned(id, user.id);
  if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  const parsed = supplierListingUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  await (await listingsCollection()).updateOne({ _id: listing._id }, { $set: { ...parsed.data, updatedAt: new Date() } });
  const updated = await (await listingsCollection()).findOne({ _id: listing._id });
  return NextResponse.json({ listing: toSafeListing(updated!, user) });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const user = await apiUser(["SUPPLIER"]);
  if (isApiError(user)) return user;
  const listing = await findOwned(id, user.id);
  if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  await (await listingsCollection()).updateOne({ _id: listing._id }, { $set: { available: false, updatedAt: new Date() } });
  return NextResponse.json({ unavailable: true });
}
