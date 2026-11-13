import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { findUserByEmail, toSafeUser } from "@/lib/auth/users";
import { loginSchema } from "@/lib/auth/validation";
export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter your email and password.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const user = await findUserByEmail(parsed.data.email);
  if (!user || user.blockedAt || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return NextResponse.json({ error: "We couldn't sign you in with those details." }, { status: 401 });
  const safeUser = toSafeUser(user); const response = NextResponse.json({ user: safeUser });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(safeUser), sessionCookieOptions()); return response;
}
