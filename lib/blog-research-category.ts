/** Heuristic: category represents research-backed editorial content. */
export function isResearchCategory(
  cat: { name: string; slug: string } | null | undefined
): boolean {
  if (!cat) return false;
  const slug = cat.slug.toLowerCase().replace(/_/g, "-");
  const name = cat.name.toLowerCase();
  return (
    slug === "research" ||
    slug.includes("research") ||
    name.includes("research") ||
    name.includes("งานวิจัย") ||
    name.includes("วิจัย")
  );
}
