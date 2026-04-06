/** Plain text from HTML for meta descriptions. */
export function plainTextFromHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function truncateMetaDescription(text: string, max = 160): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

export function articleMetaDescription(
  excerpt: string | null,
  contentHtml: string
): string {
  if (excerpt?.trim()) return truncateMetaDescription(excerpt.trim());
  return truncateMetaDescription(plainTextFromHtml(contentHtml));
}

export function resolveAbsoluteUrl(siteUrl: string, pathOrUrl: string): string {
  const base = siteUrl.replace(/\/$/, "");
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  return `${base}/${pathOrUrl.replace(/^\//, "")}`;
}

export function defaultOgImageUrl(siteUrl: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE?.trim();
  if (fromEnv) return fromEnv;
  return resolveAbsoluteUrl(siteUrl, "/og-default.png");
}
