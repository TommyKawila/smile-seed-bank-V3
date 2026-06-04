import { createClient } from "@/lib/supabase/server";
import { PRODUCT_SELECT_FILTER_COUNT } from "@/lib/supabase/types";
import { buildProductCatalogSearchOrFilter } from "@/lib/product-catalog-search";
import {
  calculateFilterCounts,
  defaultFilterOptionCounts,
  type ShopFilterCountProduct,
  type ShopFilterOptionCounts,
} from "@/lib/shop-attribute-filters";
import {
  normalizeCatalogFtUrlParam,
  productMatchesCatalogFtParam,
} from "@/lib/seed-type-filter";
import { withTimeout } from "@/lib/timeout";
import { getBreederIdFromShopParam } from "@/services/product-service";

const FILTER_COUNT_CAP = 2000;
const FILTER_COUNT_CHUNK = 200;
const FILTER_COUNTS_TIMEOUT_MS = 8000;
const FILTER_COUNTS_CACHE_TTL_MS = 60_000;

const filterCountsCache = new Map<
  string,
  { counts: ShopFilterOptionCounts; at: number }
>();

export type ShopCatalogFilterCountsOpts = {
  breeder_id?: number;
  breeder_shop_param?: string;
  category?: string;
  search?: string;
  catalog_ft?: string;
};

async function fetchShopCatalogFilterCountsInner(
  opts: ShopCatalogFilterCountsOpts
): Promise<ShopFilterOptionCounts> {
  const supabase = await createClient();
  let breederId = opts.breeder_id;
  if (opts.breeder_shop_param?.trim()) {
    const id = await getBreederIdFromShopParam(opts.breeder_shop_param);
    if (id == null) return defaultFilterOptionCounts();
    breederId = id;
  }

  const ftOriginal = opts.catalog_ft?.trim() ?? "";
  const catalogFtKey = normalizeCatalogFtUrlParam(ftOriginal);
  const categoryNorm = opts.category?.trim().toLowerCase() ?? "";

  const applyScope = () => {
    let qb = supabase
      .from("products")
      .select(PRODUCT_SELECT_FILTER_COUNT)
      .eq("is_active", true);
    const searchRaw = opts.search?.trim();
    const catalogOr = searchRaw ? buildProductCatalogSearchOrFilter(searchRaw) : null;
    if (catalogOr) qb = qb.or(catalogOr);
    if (breederId != null) qb = qb.eq("breeder_id", breederId);
    switch (catalogFtKey) {
      case "auto":
        qb = qb.eq("flowering_type", "autoflower");
        break;
      case "photo-3n":
        qb = qb.eq("flowering_type", "photo_3n");
        break;
      default:
        break;
    }
    return qb;
  };

  const scoped: ShopFilterCountProduct[] = [];
  let offset = 0;

  while (scoped.length < FILTER_COUNT_CAP) {
    const { data, error } = await applyScope()
      .order("id", { ascending: false })
      .range(offset, offset + FILTER_COUNT_CHUNK - 1);
    if (error) return defaultFilterOptionCounts();
    const chunk = (data ?? []) as ShopFilterCountProduct[];
    if (!chunk.length) break;

    for (const row of chunk) {
      if (
        ftOriginal &&
        !productMatchesCatalogFtParam(
          {
            flowering_type: row.flowering_type ?? null,
            category: row.category ?? null,
            product_categories: row.product_categories ?? null,
          },
          ftOriginal
        )
      ) {
        continue;
      }
      if (categoryNorm) {
        const cat = (row as { category?: string | null }).category;
        const catName = (
          row as { product_categories?: { name?: string | null } | null }
        ).product_categories?.name;
        const catMatch =
          cat?.trim().toLowerCase() === categoryNorm ||
          catName?.trim().toLowerCase() === categoryNorm;
        if (!catMatch) continue;
      }
      scoped.push(row);
      if (scoped.length >= FILTER_COUNT_CAP) break;
    }

    if (chunk.length < FILTER_COUNT_CHUNK) break;
    offset += FILTER_COUNT_CHUNK;
  }

  return calculateFilterCounts(scoped);
}

function filterCountsCacheKey(opts: ShopCatalogFilterCountsOpts): string {
  return JSON.stringify({
    breeder_id: opts.breeder_id ?? null,
    breeder_shop_param: opts.breeder_shop_param?.trim() ?? null,
    category: opts.category?.trim() ?? null,
    search: opts.search?.trim() ?? null,
    catalog_ft: opts.catalog_ft?.trim() ?? null,
  });
}

export function getShopCatalogFilterCounts(
  opts: ShopCatalogFilterCountsOpts
): Promise<ShopFilterOptionCounts> {
  const key = filterCountsCacheKey(opts);
  const hit = filterCountsCache.get(key);
  const now = Date.now();
  if (hit && now - hit.at < FILTER_COUNTS_CACHE_TTL_MS) {
    return Promise.resolve(hit.counts);
  }

  return withTimeout(
    fetchShopCatalogFilterCountsInner(opts)
      .then((counts) => {
        filterCountsCache.set(key, { counts, at: Date.now() });
        return counts;
      })
      .catch(() => defaultFilterOptionCounts()),
    FILTER_COUNTS_TIMEOUT_MS,
    defaultFilterOptionCounts()
  );
}
