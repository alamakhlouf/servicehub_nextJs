import { describe, expect, it } from "vitest";
import { reviewCreateSchema } from "./validation";

describe("review validation", () => {
  it("accepts a simple rating and optional comment", () => {
    expect(reviewCreateSchema.safeParse({ bookingId: "507f1f77bcf86cd799439011", rating: 5, comment: "" }).success).toBe(true);
  });

  it("rejects ratings outside the supported range", () => {
    expect(reviewCreateSchema.safeParse({ bookingId: "507f1f77bcf86cd799439011", rating: 6 }).success).toBe(false);
    expect(reviewCreateSchema.safeParse({ bookingId: "507f1f77bcf86cd799439011", rating: 2.5 }).success).toBe(false);
  });
});
