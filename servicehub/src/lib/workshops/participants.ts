import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/database";
import type { AttendanceStatus, ParticipationStatus, SafeWorkshopParticipant } from "@/types/workshop";

export type ParticipantDocument = {
  _id: ObjectId; workshopId: ObjectId; providerId: ObjectId; note?: string; clientRequestId?: string;
  status: ParticipationStatus; attendance: AttendanceStatus; createdAt: Date; updatedAt: Date;
};

export async function participantsCollection() {
  const collection = (await getDatabase()).collection<ParticipantDocument>("workshopParticipants");
  await Promise.all([
    collection.createIndex({ workshopId: 1, providerId: 1 }, { unique: true }),
    collection.createIndex({ providerId: 1, createdAt: -1 }),
    collection.createIndex({ providerId: 1, clientRequestId: 1 }, { unique: true, sparse: true }),
  ]);
  return collection;
}

export function toSafeParticipant(participant: ParticipantDocument, providerName?: string): SafeWorkshopParticipant {
  return { id: participant._id.toString(), workshopId: participant.workshopId.toString(), providerId: participant.providerId.toString(), ...(providerName ? { providerName } : {}), ...(participant.note ? { note: participant.note } : {}), ...(participant.clientRequestId ? { clientRequestId: participant.clientRequestId } : {}), status: participant.status, attendance: participant.attendance, createdAt: participant.createdAt.toISOString(), updatedAt: participant.updatedAt.toISOString() };
}
