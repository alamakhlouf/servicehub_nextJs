import { describe, expect, it } from "vitest";
import { bookingStatusSchema, canTransition, isPastDateTime } from "./validation";

describe("booking lifecycle", () => {
  it("allows the requested customer and provider transitions", () => {
    expect(canTransition("PENDING", "CANCELLED", "CUSTOMER")).toBe(true);
    expect(canTransition("PENDING", "ACCEPTED", "PROVIDER")).toBe(true);
    expect(canTransition("ACCEPTED", "IN_PROGRESS", "PROVIDER")).toBe(true);
    expect(canTransition("IN_PROGRESS", "COMPLETED", "PROVIDER")).toBe(true);
  });

  it("rejects reopening terminal bookings and unauthorized transitions", () => {
    expect(canTransition("COMPLETED", "PENDING", "PROVIDER")).toBe(false);
    expect(canTransition("PENDING", "COMPLETED", "CUSTOMER")).toBe(false);
    expect(canTransition("ACCEPTED", "CANCELLED", "CUSTOMER")).toBe(false);
  });

  it("detects past local date-times", () => {
    expect(isPastDateTime("2000-01-01", "09:00")).toBe(true);
  });

  it("requires an agreed date and time together", () => {
    expect(bookingStatusSchema.safeParse({ status: "ACCEPTED", agreedDate: "2099-01-01" }).success).toBe(false);
    expect(bookingStatusSchema.safeParse({ status: "ACCEPTED", agreedDate: "2099-01-01", agreedTime: "09:00" }).success).toBe(true);
  });
});
