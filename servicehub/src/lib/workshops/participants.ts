import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/database";
import type { AttendanceStatus, ParticipationStatus, SafeWorkshopParticipant } from "@/types/workshop";

export type ParticipantDocument = {
  _id: ObjectId; workshopId: ObjectId; customerId: ObjectId; note?: string; clientRequestId?: string;
  status: ParticipationStatus; attendance: AttendanceStatus; createdAt: Date; updatedAt: Date;
};

export async function participantsCollection() {
  const collection = (await getDatabase()).collection<ParticipantDocument>("workshopParticipants");
  await Promise.all([
    collection.createIndex({ workshopId: 1, customerId: 1 }, { unique: true }),
    collection.createIndex({ customerId: 1, createdAt: -1 }),
    collection.createIndex({ workshopId: 1, status: 1 }),
    collection.createIndex({ customerId: 1, clientRequestId: 1 }, { unique: true, sparse: true }),
  ]);
  return collection;
}

export function toSafeParticipant(participant: ParticipantDocument, customerName?: string): SafeWorkshopParticipant {
  return { id: participant._id.toString(), workshopId: participant.workshopId.toString(), customerId: participant.customerId.toString(), ...(customerName ? { customerName } : {}), ...(participant.note ? { note: participant.note } : {}), ...(participant.clientRequestId ? { clientRequestId: participant.clientRequestId } : {}), status: participant.status, attendance: participant.attendance, createdAt: participant.createdAt.toISOString(), updatedAt: participant.updatedAt.toISOString() };
}
