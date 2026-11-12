type WorkshopCategoryCount = {
  category: string;
  count: number;
};

export function normalizeWorkshopCategories(rows: WorkshopCategoryCount[]) {
  const categories = new Map<string, WorkshopCategoryCount & { displayCount: number }>();

  for (const row of rows) {
    const display = row.category.trim().replace(/\s+/g, " ");
    if (!display) continue;

    const key = display.toLowerCase();
    const existing = categories.get(key);
    if (existing) {
      existing.count += row.count;
      if (row.count > existing.displayCount) {
        existing.category = display;
        existing.displayCount = row.count;
      }
    } else {
      categories.set(key, { category: display, count: row.count, displayCount: row.count });
    }
  }

  return [...categories.values()]
    .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category))
    .slice(0, 12)
    .map(({ category, count }) => ({ name: category, count }));
}
