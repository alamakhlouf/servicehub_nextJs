import { describe, expect, it } from "vitest";
import { canTransitionOrder } from "./orders";

describe("supplier order transitions", () => {
  it("allows suppliers to accept or reject pending orders", () => {
    expect(canTransitionOrder("PENDING", "ACCEPTED", "SUPPLIER")).toBe(true);
    expect(canTransitionOrder("PENDING", "REJECTED", "SUPPLIER")).toBe(true);
  });

  it("allows suppliers to complete accepted orders", () => {
    expect(canTransitionOrder("ACCEPTED", "COMPLETED", "SUPPLIER")).toBe(true);
  });

  it("only allows buyers to cancel pending orders", () => {
    expect(canTransitionOrder("PENDING", "CANCELLED", "BUYER")).toBe(true);
    expect(canTransitionOrder("ACCEPTED", "CANCELLED", "BUYER")).toBe(false);
  });

  it("rejects reverse and skipped transitions", () => {
    expect(canTransitionOrder("COMPLETED", "PENDING", "SUPPLIER")).toBe(false);
    expect(canTransitionOrder("PENDING", "COMPLETED", "SUPPLIER")).toBe(false);
  });
});
