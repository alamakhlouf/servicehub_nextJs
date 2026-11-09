import { describe, expect, it } from "vitest";
import { canTransition } from "./workshops";
import { durationMinutes, participationSchema, workshopSchema } from "./validation";

describe("workshop validation", () => {
  it("accepts a simple future workshop payload", () => {
    const start = new Date(Date.now() + 86_400_000).toISOString();
    const end = new Date(Date.now() + 86_400_000 + 6_000_000).toISOString();
    expect(workshopSchema.safeParse({ title: "Repair basics", description: "Learn practical repair skills.", category: "Home", location: "Main hall", startAt: start, endAt: end, capacity: 10 }).success).toBe(true);
    expect(durationMinutes(start, end)).toBe(100);
  });

  it("rejects invalid capacity and participation notes", () => {
    expect(workshopSchema.safeParse({ title: "A", description: "Short", category: "Home", location: "Hall", startAt: new Date().toISOString(), endAt: new Date().toISOString(), capacity: 0 }).success).toBe(false);
    expect(participationSchema.safeParse({ note: "x".repeat(501) }).success).toBe(false);
  });
});

describe("workshop lifecycle", () => {
  it("allows only the intended workshop transitions", () => {
    expect(canTransition("DRAFT", "PUBLISHED")).toBe(true);
    expect(canTransition("PUBLISHED", "COMPLETED")).toBe(true);
    expect(canTransition("COMPLETED", "PUBLISHED")).toBe(false);
    expect(canTransition("CANCELLED", "COMPLETED")).toBe(false);
  });
});
