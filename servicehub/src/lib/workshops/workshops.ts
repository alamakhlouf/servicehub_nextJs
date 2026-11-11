import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/database";
import type { SafeWorkshop, SkillLevel, WorkshopFormat, WorkshopStatus } from "@/types/workshop";

export type WorkshopDocument = {
  _id: ObjectId; organizerId: ObjectId; title: string; description: string; category: string;
  location: string; startAt: Date; durationMinutes: number; capacity: number; approvedParticipantCount: number;
  imageUrl?: string; skillLevel?: SkillLevel; learningPoints?: string[]; requirements?: string[];
  format?: WorkshopFormat; meetingUrl?: string; status: WorkshopStatus; createdAt: Date; updatedAt: Date;
};

export async function workshopsCollection() {
  const collection = (await getDatabase()).collection<WorkshopDocument>("workshops");
  await Promise.all([
    collection.createIndex({ organizerId: 1, updatedAt: -1 }),
    collection.createIndex({ status: 1, startAt: 1 }),
    collection.createIndex({ category: 1, status: 1, startAt: 1 }),
  ]);
  return collection;
}

export function toSafeWorkshop(workshop: WorkshopDocument, organizerName?: string, approvedParticipantCount = workshop.approvedParticipantCount ?? 0, includePrivate = false): SafeWorkshop {
  return { id: workshop._id.toString(), organizerId: workshop.organizerId.toString(), ...(organizerName ? { organizerName } : {}), title: workshop.title, description: workshop.description, category: workshop.category, location: workshop.location, startAt: workshop.startAt.toISOString(), durationMinutes: workshop.durationMinutes, capacity: workshop.capacity, approvedParticipantCount, ...(workshop.imageUrl ? { imageUrl: workshop.imageUrl } : {}), skillLevel: workshop.skillLevel ?? "ALL_LEVELS", learningPoints: workshop.learningPoints ?? [], requirements: workshop.requirements ?? [], format: workshop.format ?? "IN_PERSON", ...(includePrivate && workshop.meetingUrl ? { meetingUrl: workshop.meetingUrl } : {}), status: workshop.status, createdAt: workshop.createdAt.toISOString(), updatedAt: workshop.updatedAt.toISOString() };
}

export function canTransition(from: WorkshopStatus, to: WorkshopStatus) {
  return (from === "DRAFT" && ["PUBLISHED", "CANCELLED"].includes(to)) || (from === "PUBLISHED" && ["CANCELLED", "COMPLETED"].includes(to)) || from === to;
}
