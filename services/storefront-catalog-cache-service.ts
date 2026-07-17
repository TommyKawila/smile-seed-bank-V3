import { unstable_cache } from "next/cache";
import { bigintToJson } from "@/lib/bigint-json";
import { logger } from "@/lib/logger";
import {
  getActiveProducts,
  hasStorefrontClearanceProducts,
} from "@/services/product-service";
import type { ProductListItem } from "@/services/storefront-product-service";

export const STOREFRONT_CATALOG_CACHE_TAG = "storefront-catalog";

export type DefaultCatalogBundle = {
  products: ProductListItem[];
  catalogTotalCount: number | null;
  catalogUseCursor: boolean;
  catalogNextCursor: number | null;
  showClearanceFilter: boolean;
  error: string | null;
};

async function fetchDefaultCatalogBundle(limit: number): Promise<DefaultCatalogBundle> {
  const [catalog, showClearanceFilter] = await Promise.all([
    getActiveProducts({
      limit,
      page: 1,
      access: "service_role",
    }).catch((err) => {
      logger.error("storefront-catalog-cache getActiveProducts failed", { cause: err });
      return {
        data: [] as ProductListItem[],
        error: "catalog_fetch_failed",
        catalogHasMore: false,
        catalogTotalCount: null as number | null,
        catalogUseCursor: false,
        catalogNextCursor: null as number | null,
      };
    }),
    hasStorefrontClearanceProducts().catch(() => false),
  ]);

  if (catalog.error) {
    return {
      products: [],
      catalogTotalCount: null,
      catalogUseCursor: false,
      catalogNextCursor: null,
      showClearanceFilter,
      error: catalog.error,
    };
  }

  const products = bigintToJson(catalog.data ?? []) as ProductListItem[];
  const catalogUseCursor = catalog.catalogUseCursor === true;
  const lastRow = products[products.length - 1];
  const catalogNextCursor =
    catalogUseCursor && lastRow?.id != null ? Number(lastRow.id) : null;

  return {
    products,
    catalogTotalCount:
      typeof catalog.catalogTotalCount === "number" ? catalog.catalogTotalCount : null,
    catalogUseCursor,
    catalogNextCursor: Number.isFinite(catalogNextCursor ?? NaN)
      ? catalogNextCursor
      : null,
    showClearanceFilter,
    error: null,
  };
}

/**
 * Cached default `/seeds` / `/shop` first page (no filters).
 * Uses service-role (no cookies) so `unstable_cache` is valid.
 * Empty results are not cached — falls through to a live fetch.
 */
export async function getCachedDefaultCatalogBundle(
  limit: number
): Promise<DefaultCatalogBundle> {
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));

  try {
    const cached = await unstable_cache(
      async () => {
        const bundle = await fetchDefaultCatalogBundle(safeLimit);
        if (bundle.products.length === 0) {
          // Throw so Next does not persist an empty catalog in Data Cache.
          throw new Error("storefront_catalog_empty_skip_cache");
        }
        return bundle;
      },
      ["storefront-catalog-default-v2", String(safeLimit)],
      { revalidate: 120, tags: [STOREFRONT_CATALOG_CACHE_TAG] }
    )();
    return cached;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg !== "storefront_catalog_empty_skip_cache") {
      logger.error("storefront-catalog-cache unstable_cache miss/error", { cause: err });
    } else {
      logger.error(
        `storefront-catalog-cache empty result; uncached retry limit=${safeLimit}`
      );
    }
    return fetchDefaultCatalogBundle(safeLimit);
  }
}

/** True when URL has no catalog filters — safe to serve the default cached bundle. */
export function isDefaultCatalogRequest(opts: {
  breederId?: number;
  category?: string;
  search?: string;
  catalogFt?: string;
  quick?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  seedsParam?: string | null;
  geneticsParam?: string | null;
  difficultyParam?: string | null;
  thcParam?: string | null;
  cbdParam?: string | null;
  sexParam?: string | null;
  yieldParam?: string | null;
}): boolean {
  if (opts.breederId != null) return false;
  if (opts.category?.trim()) return false;
  if (opts.search?.trim()) return false;
  if (opts.catalogFt?.trim()) return false;
  if (opts.quick?.trim()) return false;
  if (opts.sort?.trim()) return false;
  if (opts.minPrice != null && Number.isFinite(opts.minPrice)) return false;
  if (opts.maxPrice != null && Number.isFinite(opts.maxPrice)) return false;
  if (opts.seedsParam?.trim()) return false;
  if (opts.geneticsParam?.trim()) return false;
  if (opts.difficultyParam?.trim()) return false;
  if (opts.thcParam?.trim()) return false;
  if (opts.cbdParam?.trim()) return false;
  if (opts.sexParam?.trim()) return false;
  if (opts.yieldParam?.trim()) return false;
  return true;
}
