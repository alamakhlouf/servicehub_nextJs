import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, resetPasswordSchema, signupSchema } from "./validation";

describe("signup validation", () => {
  const account = { name: "Ala Eddine Makhlouf", email: "ala@example.com", password: "password123" };

  it("accepts canonical public role values", () => {
    expect(signupSchema.safeParse({ ...account, role: "PROVIDER" }).success).toBe(true);
  });

  it("rejects presentation-case role values", () => {
    expect(signupSchema.safeParse({ ...account, role: "provider" }).success).toBe(false);
  });

  it("validates password reset requests and passwords", () => {
    expect(forgotPasswordSchema.safeParse({ email: "person@example.com" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ token: "token", password: "password123" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ token: "token", password: "short" }).success).toBe(false);
  });
});
