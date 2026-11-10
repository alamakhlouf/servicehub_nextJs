import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { findUserById } from "@/lib/auth/users";
import { durationMinutes, workshopSchema } from "@/lib/workshops/validation";
import { toSafeWorkshop, workshopsCollection } from "@/lib/workshops/workshops";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const query: Record<string, unknown> = { status: "PUBLISHED", startAt: { $gte: new Date() } };
  if (search.get("category")) query.category = search.get("category");
  if (search.get("q")) query.$or = [{ title: { $regex: search.get("q"), $options: "i" } }, { description: { $regex: search.get("q"), $options: "i" } }, { location: { $regex: search.get("q"), $options: "i" } }];
  const records = await (await workshopsCollection()).find(query).sort({ startAt: 1 }).limit(50).toArray();
  return NextResponse.json({ workshops: await Promise.all(records.map(async (record) => {
    const organizer = await findUserById(record.organizerId.toString());
    return toSafeWorkshop(record, organizer?.name);
  })) }, { headers: { "X-ServiceHub-Public": "1" } });
}

export async function POST(request: Request) {
  const user = await apiUser(["PROVIDER"], "Only providers can create workshops.");
  if (isApiError(user)) return user;
  const parsed = workshopSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const duration = durationMinutes(parsed.data.startAt, parsed.data.endAt);
  if (duration < 15 || duration > 1440 || new Date(parsed.data.startAt) <= new Date()) return NextResponse.json({ error: "Choose a future start time and a duration between 15 minutes and 24 hours." }, { status: 400 });
  if (parsed.data.status === "PUBLISHED" && new Date(parsed.data.startAt) <= new Date()) return NextResponse.json({ error: "A workshop must start in the future." }, { status: 400 });
  const now = new Date();
  const record = { _id: new ObjectId(), organizerId: new ObjectId(user.id), title: parsed.data.title, description: parsed.data.description, category: parsed.data.category, location: parsed.data.location, imageUrl: parsed.data.imageUrl || undefined, durationMinutes: duration, capacity: parsed.data.capacity, approvedParticipantCount: 0, status: parsed.data.status ?? "DRAFT", startAt: new Date(parsed.data.startAt), createdAt: now, updatedAt: now };
  await (await workshopsCollection()).insertOne(record);
  return NextResponse.json({ workshop: toSafeWorkshop(record, user.name) }, { status: 201 });
}
