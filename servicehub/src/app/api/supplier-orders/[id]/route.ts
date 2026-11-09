import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { listingsCollection, toSafeListing } from "@/lib/suppliers/listings";
import { canTransitionOrder, ordersCollection, toSafeOrder } from "@/lib/suppliers/orders";
import { supplierOrderStatusSchema } from "@/lib/suppliers/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const user = await apiUser(["CUSTOMER", "PROVIDER", "SUPPLIER"]);
  if (isApiError(user) || !ObjectId.isValid(id)) return isApiError(user) ? user : NextResponse.json({ error: "Order not found." }, { status: 404 });
  const order = await (await ordersCollection()).findOne({ _id: new ObjectId(id), $or: [{ customerId: new ObjectId(user.id) }, { supplierId: new ObjectId(user.id) }] });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const listing = await (await listingsCollection()).findOne({ _id: order.listingId });
  return NextResponse.json({ order: toSafeOrder(order, listing ? toSafeListing(listing) : undefined) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const user = await apiUser(["CUSTOMER", "PROVIDER", "SUPPLIER"]);
  if (isApiError(user) || !ObjectId.isValid(id)) return isApiError(user) ? user : NextResponse.json({ error: "Order not found." }, { status: 404 });
  const order = await (await ordersCollection()).findOne({ _id: new ObjectId(id) });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const actor = order.supplierId.toString() === user.id && user.role === "SUPPLIER" ? "SUPPLIER" : order.customerId.toString() === user.id && ["CUSTOMER", "PROVIDER"].includes(user.role) ? "BUYER" : null;
  if (!actor) return NextResponse.json({ error: "You do not have permission for this order." }, { status: 403 });
  const parsed = supplierOrderStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !canTransitionOrder(order.status, parsed.data.status, actor)) return NextResponse.json({ error: "That order status change is not allowed." }, { status: 400 });
  const orders = await ordersCollection();
  if (actor === "SUPPLIER" && parsed.data.status === "ACCEPTED") {
    const updatedStock = await (await listingsCollection()).updateOne({ _id: order.listingId, supplierId: order.supplierId, available: true, stock: { $gte: order.quantity } }, { $inc: { stock: -order.quantity }, $set: { updatedAt: new Date() } });
    if (updatedStock.modifiedCount !== 1) return NextResponse.json({ error: "There is not enough stock to accept this order." }, { status: 409 });
  }
  await orders.updateOne({ _id: order._id }, { $set: { status: parsed.data.status, updatedAt: new Date() } });
  const updated = await orders.findOne({ _id: order._id });
  const listing = await (await listingsCollection()).findOne({ _id: order.listingId });
  return NextResponse.json({ order: toSafeOrder(updated!, listing ? toSafeListing(listing) : undefined) });
}
