import { describe, expect, it } from "vitest";
import { serviceCategories, supplierCategories } from "./categories";

describe("catalog categories", () => {
  it("uses the same service categories for search and provider forms", () => {
    expect(serviceCategories).toEqual(["Home repair", "Cleaning", "Beauty", "Tutoring", "Wellness", "Other"]);
  });

  it("uses the same supplier categories for search and listing forms", () => {
    expect(supplierCategories).toEqual(["Materials", "Tools", "Plants", "Food", "Other"]);
  });
});
