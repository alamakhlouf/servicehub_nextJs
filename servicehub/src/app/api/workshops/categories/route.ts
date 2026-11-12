import { NextResponse } from "next/server";
import { normalizeWorkshopCategories } from "@/lib/workshops/categories";
import { workshopsCollection } from "@/lib/workshops/workshops";

export async function GET() {
  const rows = await (await workshopsCollection()).aggregate<{ _id: string; count: number }>([
    { $match: { status: "PUBLISHED", startAt: { $gte: new Date() } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
  ]).toArray();
  return NextResponse.json({
    categories: normalizeWorkshopCategories(rows.map(({ _id, count }) => ({ category: _id, count }))),
  }, { headers: { "X-ServiceHub-Public": "1" } });
}
