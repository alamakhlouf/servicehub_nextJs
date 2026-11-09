import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { findUserById, toSafeUser } from "@/lib/auth/users";
import { servicesCollection, toSafeService } from "@/lib/services/services";
import { serviceQuerySchema, serviceSchema } from "@/lib/services/validation";

export async function GET(request: Request) {
  const parsed = serviceQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid catalogue filters." }, { status: 400 });
  const { category, q } = parsed.data;
  const query: Record<string, unknown> = { status: "PUBLISHED" };
  if (category) query.category = category;
  if (q) query.$or = [{ title: { $regex: q, $options: "i" } }, { description: { $regex: q, $options: "i" } }, { city: { $regex: q, $options: "i" } }];
  const services = await (await servicesCollection()).find(query).sort({ updatedAt: -1 }).limit(50).toArray();
  const result = await Promise.all(services.map(async (service) => {
    const provider = await findUserById(service.providerId.toString());
    return toSafeService(service, provider ? toSafeUser(provider) : undefined);
  }));
  return NextResponse.json({ services: result });
}

export async function POST(request: Request) {
  const currentUser = await apiUser(["PROVIDER"]);
  if (isApiError(currentUser)) return currentUser;
  const body = await request.json().catch(() => null);
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const now = new Date();
  const service = { _id: new ObjectId(), providerId: new ObjectId(currentUser.id), ...parsed.data, status: parsed.data.status ?? "DRAFT", createdAt: now, updatedAt: now };
  await (await servicesCollection()).insertOne(service);
  return NextResponse.json({ service: toSafeService(service, currentUser) }, { status: 201 });
}
