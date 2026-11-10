import { NextResponse } from "next/server";
import { workshopsCollection } from "@/lib/workshops/workshops";

export async function GET() {
  const rows = await (await workshopsCollection()).aggregate<{ _id: string; count: number; display: string }>([
    { $match: { status: "PUBLISHED", startAt: { $gte: new Date() } } },
    { $project: { category: 1, normalized: { $toLower: { $trim: { input: { $regexReplace: { input: "$category", regex: "\\s+", replacement: " " } } } } } } },
    { $group: { _id: "$normalized", count: { $sum: 1 }, display: { $first: "$category" } } },
    { $sort: { count: -1, display: 1 } },
    { $limit: 12 },
  ]).toArray();
  return NextResponse.json({ categories: rows.map((row) => ({ name: row.display, count: row.count })) }, { headers: { "X-ServiceHub-Public": "1" } });
}
