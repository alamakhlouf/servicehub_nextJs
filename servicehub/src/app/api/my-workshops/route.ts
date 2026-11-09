import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { toSafeWorkshop, workshopsCollection } from "@/lib/workshops/workshops";

export async function GET() {
  const user = await apiUser(["PROVIDER", "ADMIN"]);
  if (isApiError(user)) return user;
  const records = await (await workshopsCollection()).find({ ...(user.role === "ADMIN" ? {} : { organizerId: new ObjectId(user.id) }) }).sort({ startAt: 1 }).toArray();
  return NextResponse.json({ workshops: records.map((record) => toSafeWorkshop(record, user.name)) });
}
