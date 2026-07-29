/** SSR first-page sizes (viewport cookie). Client load-more uses API limit. */
export const SHOP_CATALOG_DESKTOP_INITIAL = 30;
export const SHOP_CATALOG_MOBILE_INITIAL = 16;
export const SHOP_CATALOG_API_LIMIT = 30;
export const SHOP_CATALOG_VISIBLE_STEP = 24;

/** Whether the server likely has more catalog rows beyond the current batch. */
export function inferCatalogHasMore(
  loadedCount: number,
  catalogTotal: number | null,
  ssrPageSize: number
): boolean {
  if (catalogTotal != null) return loadedCount < catalogTotal;
  return loadedCount > 0 && loadedCount >= ssrPageSize;
}

/**
 * Offset/page for the next catalog fetch when SSR batch ≠ API page size.
 * Mobile SSR may load 16 while API pages are 30 — never use loadedPage+1 alone
 * or items 17–30 are skipped permanently on non-cursor sorts.
 */
export function nextCatalogPageFromLoadedCount(
  loadedCount: number,
  apiPageSize: number = SHOP_CATALOG_API_LIMIT
): number {
  const size = apiPageSize > 0 ? apiPageSize : SHOP_CATALOG_API_LIMIT;
  if (loadedCount < 1) return 1;
  return Math.floor(loadedCount / size) + 1;
}
