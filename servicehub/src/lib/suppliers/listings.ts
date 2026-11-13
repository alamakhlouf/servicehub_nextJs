import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/database";
import type { SafeUser } from "@/types/auth";
import type { SafeSupplierListing } from "@/types/supplier";

export type SupplierListingDocument = {
  _id: ObjectId;
  supplierId: ObjectId;
  name: string;
  description: string;
  category: string;
  unitPrice: number;
  unitLabel: string;
  stock: number;
  available: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function listingsCollection() {
  const collection = (await getDatabase()).collection<SupplierListingDocument>("supplierListings");
  await Promise.all([
    collection.createIndex({ supplierId: 1, updatedAt: -1 }),
    collection.createIndex({ available: 1, category: 1, updatedAt: -1 }),
  ]);
  return collection;
}

export function toSafeListing(listing: SupplierListingDocument, supplier?: SafeUser): SafeSupplierListing {
  return {
    id: listing._id.toString(),
    supplierId: listing.supplierId.toString(),
    name: listing.name,
    description: listing.description,
    category: listing.category,
    unitPrice: listing.unitPrice,
    unitLabel: listing.unitLabel,
    stock: listing.stock,
    available: listing.available,
    ...(listing.imageUrl ? { imageUrl: listing.imageUrl } : {}),
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    ...(supplier ? { supplier: { id: supplier.id, name: supplier.name, ...(supplier.city ? { city: supplier.city } : {}), ...(supplier.bio ? { bio: supplier.bio } : {}) } } : {}),
  };
}
