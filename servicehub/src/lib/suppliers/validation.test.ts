import { describe, expect, it } from "vitest";
import { supplierListingSchema, supplierOrderSchema } from "./validation";

describe("supplier validation", () => {
  it("rejects negative stock and prices", () => {
    const result = supplierListingSchema.safeParse({
      name: "Timber",
      category: "Materials",
      description: "Construction timber",
      unitPrice: -1,
      unitLabel: "piece",
      stock: -2,
      available: true,
    });
    expect(result.success).toBe(false);
  });

  it("requires a positive whole-number order quantity", () => {
    const result = supplierOrderSchema.safeParse({
      listingId: "507f1f77bcf86cd799439011",
      quantity: 1.5,
      contactName: "A Customer",
      contactPhone: "555-0100",
    });
    expect(result.success).toBe(false);
  });
});
