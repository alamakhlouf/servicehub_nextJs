import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/database";
import { consumePasswordResetToken, ensurePasswordResetIndexes } from "@/lib/auth/password-reset";
import { resetPasswordSchema } from "@/lib/auth/validation";

export async function POST(request: Request) {
  const parsed = resetPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a password with at least 8 characters.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  try {
    await ensurePasswordResetIndexes();
    const userId = await consumePasswordResetToken(parsed.data.token);
    if (!userId) return NextResponse.json({ error: "This password reset link is invalid or expired." }, { status: 400 });
    const result = await (await getDatabase()).collection("users").updateOne({ _id: userId }, { $set: { passwordHash: await bcrypt.hash(parsed.data.password, 12), updatedAt: new Date() } });
    if (result.matchedCount !== 1) return NextResponse.json({ error: "This password reset link is invalid or expired." }, { status: 400 });
    return NextResponse.json({ message: "Your password was reset. You can now sign in." });
  } catch (error) {
    console.error("Password reset failed:", error);
    return NextResponse.json({ error: "Unable to reset your password." }, { status: 503 });
  }
}
