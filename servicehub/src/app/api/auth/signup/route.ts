import bcrypt from "bcryptjs";
import { MongoServerError, ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/database";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { ensureUserIndexes, toSafeUser } from "@/lib/auth/users";
import { signupSchema } from "@/lib/auth/validation";
export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const { name, email, password, role } = parsed.data;
  try {
    const db = await getDatabase();
    await ensureUserIndexes();
    if (await db.collection("users").findOne({ email })) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    const user = { _id: new ObjectId(), name, email, passwordHash: await bcrypt.hash(password, 12), role, createdAt: new Date(), updatedAt: new Date() };
    try {
      await db.collection("users").insertOne(user);
      const safeUser = toSafeUser(user);
      const response = NextResponse.json({ user: safeUser }, { status: 201 });
      response.cookies.set(SESSION_COOKIE, await createSessionToken(safeUser), sessionCookieOptions());
      return response;
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      throw error;
    }
  } catch (error) {
    console.error("Signup service unavailable:", error);
    return NextResponse.json({ error: "ServiceHub cannot reach its database. Check MongoDB and your environment configuration, then try again." }, { status: 503 });
  }
}
