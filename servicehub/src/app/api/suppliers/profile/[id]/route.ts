import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { findUserById, toSafeUser } from "@/lib/auth/users";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  void request;
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Supplier not found." }, { status: 404 });
  const user = await findUserById(id);
  if (!user || user.role !== "SUPPLIER") return NextResponse.json({ error: "Supplier not found." }, { status: 404 });
  const safe = toSafeUser(user);
  return NextResponse.json({ supplier: { id: safe.id, name: safe.name, ...(safe.city ? { city: safe.city } : {}), ...(safe.bio ? { bio: safe.bio } : {}) } });
}
