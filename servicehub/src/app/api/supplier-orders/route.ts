import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { listingsCollection, toSafeListing } from "@/lib/suppliers/listings";
import { ordersCollection, toSafeOrder } from "@/lib/suppliers/orders";
import { supplierOrderSchema } from "@/lib/suppliers/validation";

export async function POST(request: Request) {
  const user = await apiUser(["CUSTOMER", "PROVIDER"]);
  if (isApiError(user)) return user;
  const parsed = supplierOrderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const listing = await (await listingsCollection()).findOne({ _id: new ObjectId(parsed.data.listingId), available: true, stock: { $gte: parsed.data.quantity } });
  if (!listing) return NextResponse.json({ error: "This product is unavailable or does not have enough stock." }, { status: 409 });
  const now = new Date();
  const order = { _id: new ObjectId(), listingId: listing._id, supplierId: listing.supplierId, customerId: new ObjectId(user.id), quantity: parsed.data.quantity, unitPriceSnapshot: listing.unitPrice, totalSnapshot: listing.unitPrice * parsed.data.quantity, contactName: parsed.data.contactName, contactPhone: parsed.data.contactPhone, ...(parsed.data.note ? { note: parsed.data.note } : {}), status: "PENDING" as const, createdAt: now, updatedAt: now };
  await (await ordersCollection()).insertOne(order);
  return NextResponse.json({ order: toSafeOrder(order, toSafeListing(listing)) }, { status: 201 });
}

export async function GET() {
  const user = await apiUser(["CUSTOMER", "PROVIDER", "SUPPLIER"]);
  if (isApiError(user)) return user;
  const query = user.role === "SUPPLIER" ? { supplierId: new ObjectId(user.id) } : { customerId: new ObjectId(user.id) };
  const orders = await (await ordersCollection()).find(query).sort({ createdAt: -1 }).limit(100).toArray();
  const result = await Promise.all(orders.map(async (order) => {
    const listing = await (await listingsCollection()).findOne({ _id: order.listingId });
    return toSafeOrder(order, listing ? toSafeListing(listing) : undefined);
  }));
  return NextResponse.json({ orders: result });
}
