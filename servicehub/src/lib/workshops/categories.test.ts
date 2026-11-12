import { describe, expect, it } from "vitest";
import { normalizeWorkshopCategories } from "./categories";

describe("workshop category normalization", () => {
  it("combines case and whitespace variants while retaining the most common display form", () => {
    expect(normalizeWorkshopCategories([
      { category: "Gardening", count: 4 },
      { category: " home   repair ", count: 2 },
      { category: "Home Repair", count: 3 },
    ])).toEqual([
      { name: "Home Repair", count: 5 },
      { name: "Gardening", count: 4 },
    ]);
  });

  it("ignores empty categories and returns at most twelve sorted categories", () => {
    const rows = Array.from({ length: 14 }, (_, index) => ({
      category: `Category ${index}`,
      count: 14 - index,
    }));
    rows.push({ category: "   ", count: 100 });

    const categories = normalizeWorkshopCategories(rows);

    expect(categories).toHaveLength(12);
    expect(categories[0]).toEqual({ name: "Category 0", count: 14 });
    expect(categories.at(-1)).toEqual({ name: "Category 11", count: 3 });
  });
});
