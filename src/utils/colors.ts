// Colors you can pick for a category.
export const CATEGORY_COLORS = [
  '#6366f1', // indigo
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#84cc16', // lime
  '#f59e0b', // amber
  '#f97316', // orange
  '#ef4444', // red
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#64748b', // slate
]

// Pick the next color so new categories don't all look the same.
export function nextColor(usedCount: number) {
  return CATEGORY_COLORS[usedCount % CATEGORY_COLORS.length]
}
