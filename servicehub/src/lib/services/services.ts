import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/database";
import type { SafeUser } from "@/types/auth";
import type { SafeService, ServiceStatus } from "@/types/service";

export type ServiceDocument = {
  _id: ObjectId;
  providerId: ObjectId;
  title: string;
  description: string;
  category: string;
  price: number;
  priceUnit: "FIXED" | "PER_HOUR" | "FROM";
  city: string;
  imageUrl?: string;
  status: ServiceStatus;
  createdAt: Date;
  updatedAt: Date;
};

export async function servicesCollection() {
  const collection = (await getDatabase()).collection<ServiceDocument>("services");
  await Promise.all([
    collection.createIndex({ providerId: 1, updatedAt: -1 }),
    collection.createIndex({ status: 1, category: 1, updatedAt: -1 }),
  ]);
  return collection;
}

export function toSafeService(service: ServiceDocument, provider?: SafeUser): SafeService {
  return {
    id: service._id.toString(),
    providerId: service.providerId.toString(),
    title: service.title,
    description: service.description,
    category: service.category,
    price: service.price,
    priceUnit: service.priceUnit,
    city: service.city,
    ...(service.imageUrl ? { imageUrl: service.imageUrl } : {}),
    status: service.status,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
    ...(provider ? { provider: { id: provider.id, name: provider.name, ...(provider.city ? { city: provider.city } : {}), ...(provider.bio ? { bio: provider.bio } : {}) } } : {}),
  };
}

export function canTransition(from: ServiceStatus, to: ServiceStatus) {
  return (from === "DRAFT" && (to === "PUBLISHED" || to === "ARCHIVED")) || (from === "PUBLISHED" && to === "ARCHIVED") || from === to;
}
