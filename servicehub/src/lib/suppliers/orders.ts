import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/database";
import type { SafeSupplierListing, SafeSupplierOrder, SupplierOrderStatus } from "@/types/supplier";

export type SupplierOrderDocument = {
  _id: ObjectId;
  listingId: ObjectId;
  supplierId: ObjectId;
  customerId: ObjectId;
  quantity: number;
  unitPriceSnapshot: number;
  totalSnapshot: number;
  contactName: string;
  contactPhone: string;
  note?: string;
  status: SupplierOrderStatus;
  createdAt: Date;
  updatedAt: Date;
};

export async function ordersCollection() {
  const collection = (await getDatabase()).collection<SupplierOrderDocument>("supplierOrders");
  await Promise.all([
    collection.createIndex({ customerId: 1, createdAt: -1 }),
    collection.createIndex({ supplierId: 1, status: 1, createdAt: -1 }),
    collection.createIndex({ listingId: 1, createdAt: -1 }),
  ]);
  return collection;
}

export function toSafeOrder(order: SupplierOrderDocument, listing?: SafeSupplierListing): SafeSupplierOrder {
  return {
    id: order._id.toString(),
    listingId: order.listingId.toString(),
    supplierId: order.supplierId.toString(),
    customerId: order.customerId.toString(),
    quantity: order.quantity,
    unitPriceSnapshot: order.unitPriceSnapshot,
    totalSnapshot: order.totalSnapshot,
    contactName: order.contactName,
    contactPhone: order.contactPhone,
    ...(order.note ? { note: order.note } : {}),
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    ...(listing ? { listing: { id: listing.id, name: listing.name, unitLabel: listing.unitLabel } } : {}),
  };
}

export function canTransitionOrder(from: SupplierOrderStatus, to: SupplierOrderStatus, actor: "BUYER" | "SUPPLIER") {
  if (actor === "BUYER") return from === "PENDING" && to === "CANCELLED";
  return (from === "PENDING" && (to === "ACCEPTED" || to === "REJECTED")) || (from === "ACCEPTED" && to === "COMPLETED");
}
