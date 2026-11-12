import { NextResponse } from "next/server";
import { createPasswordResetToken, ensurePasswordResetIndexes } from "@/lib/auth/password-reset";
import { findUserByEmail } from "@/lib/auth/users";
import { forgotPasswordSchema } from "@/lib/auth/validation";

const genericResponse = { message: "If an account exists for that email, we sent password reset instructions." };

export async function POST(request: Request) {
  const parsed = forgotPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  try {
    await ensurePasswordResetIndexes();
    const user = await findUserByEmail(parsed.data.email);
    if (!user) return NextResponse.json(genericResponse);
    const token = await createPasswordResetToken(user._id);
    const resetUrl = new URL("/reset-password", request.url);
    resetUrl.searchParams.set("token", token);
    if (process.env.NODE_ENV !== "production") return NextResponse.json({ ...genericResponse, resetUrl: resetUrl.toString() });
    return NextResponse.json(genericResponse);
  } catch (error) {
    console.error("Password reset request failed:", error);
    return NextResponse.json({ error: "Unable to process the password reset request." }, { status: 503 });
  }
}
