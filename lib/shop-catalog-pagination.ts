/**
 * SSR first-page sizes (viewport cookie `ssb_vp`).
 * Shared by `/shop`, `/seeds/[breeder]`, `/brand/[slug]` via ShopPageClient —
 * never page-based load-more after mobile SSR (16) with API limit (30):
 * `(page-1)*30` skips rows 16–29 for every large breeder.
 */
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
 * Absolute offset for non-cursor catalog load-more (= rows already merged).
 * Required whenever SSR `initialPageSize` ≠ `SHOP_CATALOG_API_LIMIT` (mobile).
 */
export function catalogLoadMoreOffset(loadedCount: number): number {
  if (!Number.isFinite(loadedCount)) return 0;
  return Math.max(0, Math.floor(loadedCount));
}
