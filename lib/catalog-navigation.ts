/** Catalog lives at `/shop` (legacy), `/seeds/[slug]`, and `/brand/[slug]` (journal breeder catalogs). */

function safeDecodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** Breeder slug from `/seeds/[slug]` or `/brand/[slug]`. */
export function parseJournalBreederSlugFromPathname(pathname: string | null): string | null {
  if (!pathname) return null;
  let m = pathname.match(/^\/seeds\/([^/?]+)\/?$/);
  if (m?.[1]) return safeDecodePathSegment(m[1]);
  m = pathname.match(/^\/brand\/([^/?]+)\/?$/);
  if (m?.[1]) return safeDecodePathSegment(m[1]);
  return null;
}

/** Router base `/seeds/slug` or `/brand/slug` (no query). */
export function journalBreederCatalogBasePath(pathname: string | null): string | null {
  const slug = parseJournalBreederSlugFromPathname(pathname);
  if (!slug) return null;
  if (pathname?.startsWith("/brand/")) return `/brand/${slug}`;
  return `/seeds/${slug}`;
}

/** @deprecated Prefer `parseJournalBreederSlugFromPathname` — this matches **only** `/seeds/[slug]`. */
export function parseSeedsBreederSlugFromPathname(pathname: string | null): string | null {
  if (!pathname) return null;
  const m = pathname.match(/^\/seeds\/([^/?]+)\/?$/);
  return m?.[1] ? safeDecodePathSegment(m[1]) : null;
}

/**
 * Effective `ft` for catalog APIs: explicit `ft` wins; else map short `filter` (brand share links).
 */
export function resolveCatalogFtFromUrl(parts: {
  ft?: string | null;
  filter?: string | null;
}): string {
  const ftRaw = parts.ft?.trim() ?? "";
  if (ftRaw) return ftRaw;
  const f = (parts.filter ?? "").trim().toLowerCase();
  if (f === "auto" || f === "autoflower") return "auto";
  if (f === "photo" || f === "photoperiod") return "photo";
  if (f === "photo-ff" || f === "photo_ff") return "photo-ff";
  if (f === "photo-3n" || f === "photo_3n") return "photo-3n";
  return "";
}

/** `filter` shorthand → `quick` (exclusive with flowering tokens in same param). */
export function resolveCatalogQuickFromFilter(
  filter: string | null | undefined
): "new" | "sale" | "clearance" | null {
  const f = (filter ?? "").trim().toLowerCase();
  if (f === "new" || f === "new_arrivals") return "new";
  if (f === "clearance") return "clearance";
  if (f === "sale") return "sale";
  return null;
}

export type CatalogQuick = "new" | "sale" | "clearance";

/** `filter` shorthand → price sort. */
export function resolveCatalogSortFromFilter(
  filter: string | null | undefined
): "price_asc" | "price_desc" | null {
  const f = (filter ?? "").trim().toLowerCase();
  if (f === "price_asc" || f === "price_low") return "price_asc";
  if (f === "price_desc" || f === "price_high") return "price_desc";
  return null;
}

export function isSeedsIndexPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/seeds" || pathname === "/seeds/";
}
