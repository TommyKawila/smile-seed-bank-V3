/** Catalog lives at `/shop` (legacy) and `/seeds` (journal routes). */

export function parseSeedsBreederSlugFromPathname(pathname: string | null): string | null {
  if (!pathname) return null;
  const m = pathname.match(/^\/seeds\/([^/?]+)\/?$/);
  return m?.[1] ?? null;
}

export function isSeedsIndexPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/seeds" || pathname === "/seeds/";
}
