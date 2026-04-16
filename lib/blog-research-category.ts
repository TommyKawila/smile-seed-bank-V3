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

/** Knowledge / editorial category — show structured REF# id on cards. */
export function isKnowledgeCategory(
  cat: { name: string; slug: string } | null | undefined
): boolean {
  if (!cat) return false;
  const slug = cat.slug.toLowerCase().replace(/_/g, "-");
  const name = cat.name.toLowerCase();
  return (
    slug.includes("knowledge") ||
    slug.includes("ความรู้") ||
    name.includes("knowledge") ||
    name.includes("ความรู้") ||
    name.includes("องค์ความรู้")
  );
}

export function formatResearchRefId(
  postId: number,
  publishedAt: string | null
): string {
  const y = publishedAt
    ? new Date(publishedAt).getFullYear()
    : new Date().getFullYear();
  return `REF#SSB-${y}-${String(postId).padStart(4, "0")}`;
}

