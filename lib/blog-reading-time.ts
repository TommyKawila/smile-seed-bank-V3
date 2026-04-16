/** Estimate reading time when full HTML is unavailable (listing cards). */
export function estimateReadingMinutesFromExcerpt(
  title: string,
  excerpt: string | null
): number {
  const text = `${title} ${excerpt ?? ""}`.replace(/\s+/g, " ").trim();
  const words = text.split(/\s/).filter(Boolean).length;
  return Math.max(1, Math.min(45, Math.round(words / 200) || 1));
}
