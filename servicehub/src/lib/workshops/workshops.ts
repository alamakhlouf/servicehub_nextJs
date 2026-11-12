import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/database";
import type { SafeWorkshop, SkillLevel, WorkshopFormat, WorkshopStatus } from "@/types/workshop";

export type WorkshopDocument = {
  _id: ObjectId; organizerId: ObjectId; title: string; description: string; category: string;
  location: string; startAt: Date | string; durationMinutes: number; capacity: number; approvedParticipantCount: number;
  imageUrl?: string; skillLevel?: SkillLevel; learningPoints?: string[]; requirements?: string[];
  format?: WorkshopFormat; meetingUrl?: string; status: WorkshopStatus; createdAt: Date | string; updatedAt: Date | string;
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

export function workshopDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toSafeWorkshop(workshop: WorkshopDocument, organizerName?: string, approvedParticipantCount = workshop.approvedParticipantCount ?? 0, includePrivate = false): SafeWorkshop {
  const startAt = workshopDate(workshop.startAt);
  const createdAt = workshopDate(workshop.createdAt);
  const updatedAt = workshopDate(workshop.updatedAt);
  if (!startAt || !createdAt || !updatedAt) throw new Error("Workshop contains invalid date data.");
  return { id: workshop._id.toString(), organizerId: workshop.organizerId.toString(), ...(organizerName ? { organizerName } : {}), title: workshop.title, description: workshop.description, category: workshop.category, location: workshop.location, startAt: startAt.toISOString(), durationMinutes: workshop.durationMinutes, capacity: workshop.capacity, approvedParticipantCount, ...(workshop.imageUrl ? { imageUrl: workshop.imageUrl } : {}), skillLevel: workshop.skillLevel ?? "ALL_LEVELS", learningPoints: workshop.learningPoints ?? [], requirements: workshop.requirements ?? [], format: workshop.format ?? "IN_PERSON", ...(includePrivate && workshop.meetingUrl ? { meetingUrl: workshop.meetingUrl } : {}), status: workshop.status, createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() };
}

export function canTransition(from: WorkshopStatus, to: WorkshopStatus) {
  return (from === "DRAFT" && ["PUBLISHED", "CANCELLED"].includes(to)) || (from === "PUBLISHED" && ["CANCELLED", "COMPLETED"].includes(to)) || from === to;
}
