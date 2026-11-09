import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/database";
import { getSession } from "@/lib/auth/session";
import { findUserById, toSafeUser } from "@/lib/auth/users";
import { profileSchema } from "@/lib/auth/validation";
export async function GET() { const session = await getSession(); if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); const user = await findUserById(session.userId); return user ? NextResponse.json({ user: toSafeUser(user) }) : NextResponse.json({ error: "Profile not found." }, { status: 404 }); }
export async function PATCH(request: Request) {
  const session = await getSession(); if (!session || !ObjectId.isValid(session.userId)) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const data = { ...parsed.data, phone: parsed.data.phone || undefined, city: parsed.data.city || undefined, bio: parsed.data.bio || undefined, updatedAt: new Date() };
  await (await getDatabase()).collection("users").updateOne({ _id: new ObjectId(session.userId) }, { $set: data });
  const user = await findUserById(session.userId); return user ? NextResponse.json({ user: toSafeUser(user) }) : NextResponse.json({ error: "Profile not found." }, { status: 404 });
}
