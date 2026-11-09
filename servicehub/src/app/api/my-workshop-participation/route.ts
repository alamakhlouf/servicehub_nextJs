import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { findUserById } from "@/lib/auth/users";
import { participantsCollection, toSafeParticipant } from "@/lib/workshops/participants";
import { workshopsCollection, toSafeWorkshop } from "@/lib/workshops/workshops";

export async function GET() {
  const user = await apiUser(["PROVIDER"]);
  if (isApiError(user)) return user;
  const records = await (await participantsCollection()).find({ providerId: new ObjectId(user.id) }).sort({ createdAt: -1 }).toArray();
  const workshops = await Promise.all(records.map(async (participant) => {
    const workshop = await (await workshopsCollection()).findOne({ _id: participant.workshopId });
    if (!workshop) return null;
    const organizer = await findUserById(workshop.organizerId.toString());
    return { participant: toSafeParticipant(participant, user.name), workshop: toSafeWorkshop(workshop, organizer?.name) };
  }));
  return NextResponse.json({ participation: workshops.filter(Boolean) });
}
