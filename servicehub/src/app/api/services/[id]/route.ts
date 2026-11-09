import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { apiUser, isApiError } from "@/lib/auth/api-guards";
import { getSession } from "@/lib/auth/session";
import { findUserById, toSafeUser } from "@/lib/auth/users";
import { canTransition, servicesCollection, toSafeService } from "@/lib/services/services";
import { serviceUpdateSchema } from "@/lib/services/validation";

type RouteContext = { params: Promise<{ id: string }> };

async function findOwned(id: string, providerId: string) {
  if (!ObjectId.isValid(id)) return null;
  return (await servicesCollection()).findOne({ _id: new ObjectId(id), providerId: new ObjectId(providerId) });
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Service not found." }, { status: 404 });
  const session = await getSession();
  const currentUserRecord = session ? await findUserById(session.userId) : null;
  const currentUser = currentUserRecord ? toSafeUser(currentUserRecord) : null;
  const service = await (await servicesCollection()).findOne({
    _id: new ObjectId(id),
    ...(currentUser && currentUser.role === "PROVIDER" ? { $or: [{ status: "PUBLISHED" }, { providerId: new ObjectId(currentUser.id) }] } : { status: "PUBLISHED" }),
  });
  if (!service) return NextResponse.json({ error: "Service not found." }, { status: 404 });
  const provider = await findUserById(service.providerId.toString());
  return NextResponse.json({ service: toSafeService(service, provider ? toSafeUser(provider) : undefined) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const user = await apiUser(["PROVIDER"]);
  if (isApiError(user)) return user;
  const service = await findOwned(id, user.id);
  if (!service) return NextResponse.json({ error: "Service not found." }, { status: 404 });
  const parsed = serviceUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (parsed.data.status && !canTransition(service.status, parsed.data.status)) return NextResponse.json({ error: `A ${service.status.toLowerCase()} service cannot become ${parsed.data.status.toLowerCase()}.` }, { status: 400 });
  const update = { ...parsed.data, updatedAt: new Date() };
  await (await servicesCollection()).updateOne({ _id: service._id }, { $set: update });
  const updated = await (await servicesCollection()).findOne({ _id: service._id });
  return NextResponse.json({ service: toSafeService(updated!, user) });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const user = await apiUser(["PROVIDER"]);
  if (isApiError(user)) return user;
  const service = await findOwned(id, user.id);
  if (!service) return NextResponse.json({ error: "Service not found." }, { status: 404 });
  await (await servicesCollection()).updateOne({ _id: service._id }, { $set: { status: "ARCHIVED", updatedAt: new Date() } });
  return NextResponse.json({ archived: true });
}
