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
