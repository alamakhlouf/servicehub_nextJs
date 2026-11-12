import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { findUserById } from "@/lib/auth/users";
import { durationMinutes, workshopSchema } from "@/lib/workshops/validation";
import { toSafeWorkshop, workshopsCollection } from "@/lib/workshops/workshops";
import { participantsCollection } from "@/lib/workshops/participants";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseDateRange(search: URLSearchParams) {
  const fromValue = search.get("from");
  const toValue = search.get("to");
  if (!fromValue && !toValue) return { from: undefined, to: undefined };
  if (!fromValue || !toValue) throw new Error("Both from and to are required.");
  const from = new Date(fromValue);
  const to = new Date(toValue);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to || to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000) throw new Error("Invalid date range.");
  return { from, to };
}

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  let range: { from?: Date; to?: Date };
  try { range = parseDateRange(search); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid date range." }, { status: 400 }); }
  const now = new Date();
  const query: Record<string, unknown> = { status: "PUBLISHED", startAt: { $gte: now } };
  if (range.from || range.to) query.startAt = { $gte: new Date(Math.max(now.getTime(), range.from?.getTime() ?? now.getTime())), ...(range.to ? { $lte: range.to } : {}) };
  if (search.get("category")) query.category = { $regex: `^${escapeRegex(search.get("category")!.trim().replace(/\s+/g, " "))}$`, $options: "i" };
  const text = search.get("q")?.slice(0, 100).trim();
  const records = await (await workshopsCollection()).find(query).sort({ startAt: 1 }).limit(text ? 500 : 51).toArray();
  const participantCounts = await (await participantsCollection()).aggregate<{ _id: ObjectId; count: number }>([
    { $match: { status: "APPROVED", workshopId: { $in: records.map((record) => record._id) } } },
    { $group: { _id: "$workshopId", count: { $sum: 1 } } },
  ]).toArray();
  const counts = new Map(participantCounts.map((item) => [item._id.toString(), item.count]));
  const withOrganizers = await Promise.all(records.map(async (record) => {
    const organizer = await findUserById(record.organizerId.toString());
    return { record, organizerName: organizer?.name };
  }));
  const filtered = withOrganizers.filter(({ record, organizerName }) => {
    const hasSpots = !search.get("hasSpots") || search.get("hasSpots") !== "true" || (counts.get(record._id.toString()) ?? 0) < record.capacity;
    const matcher = text ? new RegExp(escapeRegex(text), "i") : null;
    const matchesText = !matcher || matcher.test(record.title) || matcher.test(record.description) || matcher.test(record.location) || matcher.test(record.category) || matcher.test(organizerName ?? "");
    return hasSpots && matchesText;
  });
  const limited = filtered.slice(0, 50);
  return NextResponse.json({ workshops: limited.map(({ record, organizerName }) => toSafeWorkshop(record, organizerName, counts.get(record._id.toString()) ?? 0)), total: limited.length, capped: filtered.length > 50 }, { headers: { "X-ServiceHub-Public": "1" } });
}

export async function POST(request: Request) {
  const user = await apiUser(["PROVIDER"], "Only providers can create workshops.");
  if (isApiError(user)) return user;
  const parsed = workshopSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const duration = durationMinutes(parsed.data.startAt, parsed.data.endAt);
  const now = new Date();
  const record = { _id: new ObjectId(), organizerId: new ObjectId(user.id), title: parsed.data.title, description: parsed.data.description, category: parsed.data.category, location: parsed.data.format === "ONLINE" ? "Online" : parsed.data.location, imageUrl: parsed.data.imageUrl || undefined, skillLevel: parsed.data.skillLevel, learningPoints: parsed.data.learningPoints, requirements: parsed.data.requirements, format: parsed.data.format, meetingUrl: parsed.data.meetingUrl || undefined, durationMinutes: duration, capacity: parsed.data.capacity, approvedParticipantCount: 0, status: parsed.data.status ?? "DRAFT", startAt: new Date(parsed.data.startAt), createdAt: now, updatedAt: now };
  await (await workshopsCollection()).insertOne(record);
  return NextResponse.json({ workshop: toSafeWorkshop(record, user.name) }, { status: 201 });
}
