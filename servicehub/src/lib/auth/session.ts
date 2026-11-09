import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role, SafeUser } from "@/types/auth";

export const SESSION_COOKIE = "servicehub_session";
const ttl = 60 * 60 * 24 * 7;
function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("Missing AUTH_SECRET environment variable");
  if (value.length < 32) throw new Error("AUTH_SECRET must be at least 32 characters long");
  return new TextEncoder().encode(value);
}
export async function createSessionToken(user: Pick<SafeUser, "id" | "role">) {
  return new SignJWT({ role: user.role }).setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime(`${ttl}s`).sign(secret());
}
export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || typeof payload.role !== "string") return null;
    return { userId: payload.sub, role: payload.role as Role };
  } catch { return null; }
}
export function sessionCookieOptions() {
  return { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: ttl };
}
