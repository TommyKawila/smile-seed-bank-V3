import { Suspense } from "react";
import { cookies } from "next/headers";
import { ShopSkeleton } from "@/components/skeletons/ShopSkeleton";
import { ShopPageClient } from "@/app/(storefront)/shop/ShopPageClient";
import { CatalogLcpPreload } from "@/components/storefront/CatalogLcpPreload";
import { getActiveProducts } from "@/services/product-service";
import { resolveBreederFromShopParamCached } from "@/services/breeder-slug-resolve-service";
import {
  getCachedDefaultCatalogBundle,
  isDefaultCatalogRequest,
} from "@/services/storefront-catalog-cache-service";
import { bigintToJson } from "@/lib/bigint-json";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import { VIEWPORT_HINT_COOKIE } from "@/lib/viewport-hint-cookie";
import type { ProductListItem } from "@/services/storefront-product-service";
import { parsePriceRangeParams } from "@/lib/shop-price-filter";
import {
  resolveCatalogFtFromUrl,
  resolveCatalogQuickFromFilter,
  resolveCatalogSortFromFilter,
} from "@/lib/catalog-navigation";

const SHOP_INITIAL_PRODUCTS_DESKTOP = 30;
const SHOP_INITIAL_PRODUCTS_MOBILE = 16;

async function shopInitialProductLimit(): Promise<number> {
  const cookieStore = await cookies();
  const vp = cookieStore.get(VIEWPORT_HINT_COOKIE)?.value;
  return vp === "d" ? SHOP_INITIAL_PRODUCTS_DESKTOP : SHOP_INITIAL_PRODUCTS_MOBILE;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function searchParamsGetter(sp: Record<string, string | string[] | undefined> | undefined) {
  return (key: string) => firstParam(sp?.[key]) ?? null;
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params?: Promise<{ breederSlug?: string | string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = params ? await params : undefined;
  const sp = searchParams ? await searchParams : undefined;
  const breederSlugFromRoute = firstParam(resolvedParams?.breederSlug);
  const breederSlugFromQuery = firstParam(sp?.breeder)?.trim() || undefined;
  const breederShopParam = breederSlugFromRoute ?? breederSlugFromQuery;
  const [initialBreeder, initialLimit] = await Promise.all([
    breederShopParam
      ? resolveBreederFromShopParamCached(breederShopParam)
      : Promise.resolve(null),
    shopInitialProductLimit(),
  ]);
  const breederId = initialBreeder?.id;
  const category = firstParam(sp?.category)?.trim() || "";
  const search = firstParam(sp?.q)?.trim() || "";
  const filterRaw = firstParam(sp?.filter)?.trim() || "";
  const catalogFt =
    resolveCatalogFtFromUrl({
      ft: firstParam(sp?.ft),
      filter: filterRaw || undefined,
    }) || "";
  const quickRaw = firstParam(sp?.quick)?.trim();
  const quick =
    quickRaw === "new" || quickRaw === "sale" || quickRaw === "clearance"
      ? quickRaw
      : resolveCatalogQuickFromFilter(filterRaw) ?? undefined;
  const sortRaw = firstParam(sp?.sort)?.trim();
  const sortFromParam =
    sortRaw === "price_asc" ||
    sortRaw === "price_desc" ||
    sortRaw === "new_arrivals" ||
    sortRaw === "newest"
      ? sortRaw
      : undefined;
  const sortFromFilter = resolveCatalogSortFromFilter(filterRaw);
  const sort = sortFromParam ?? sortFromFilter ?? undefined;
  const priceRange = parsePriceRangeParams({
    get: searchParamsGetter(sp),
  });
  const seedsParam = firstParam(sp?.seeds)?.trim() || null;
  const geneticsParam = firstParam(sp?.genetics)?.trim() || null;
  const difficultyParam = firstParam(sp?.difficulty)?.trim() || null;
  const thcParam = firstParam(sp?.thc)?.trim() || null;
  const cbdParam = firstParam(sp?.cbd)?.trim() || null;
  const sexParam = firstParam(sp?.sex)?.trim() || null;
  const yieldParam = firstParam(sp?.yield)?.trim() || null;

  const useDefaultCache = isDefaultCatalogRequest({
    breederId,
    category,
    search,
    catalogFt,
    quick,
    sort,
    minPrice: priceRange.min ?? undefined,
    maxPrice: priceRange.max ?? undefined,
    seedsParam,
    geneticsParam,
    difficultyParam,
    thcParam,
    cbdParam,
    sexParam,
    yieldParam,
  });

  let initialProducts: ProductListItem[] = [];
  let initialCatalogTotal: number | null = null;
  let initialCatalogUseCursor = false;
  let initialCatalogNextCursor: number | null = null;
  /** Cached default path only — filtered SSR defers clearance chip to client idle. */
  let initialShowClearanceFilter: boolean | undefined = undefined;

  if (useDefaultCache) {
    const bundle = await getCachedDefaultCatalogBundle(initialLimit);
    initialProducts = bundle.products;
    initialCatalogTotal = bundle.catalogTotalCount;
    initialCatalogUseCursor = bundle.catalogUseCursor;
    initialCatalogNextCursor = bundle.catalogNextCursor;
    initialShowClearanceFilter = bundle.showClearanceFilter;
  } else {
    const catalog = await getActiveProducts({
      category: category || undefined,
      breeder_id: breederId,
      search: search || undefined,
      catalog_ft: catalogFt || undefined,
      includeVariants: Boolean(seedsParam),
      limit: initialLimit,
      page: 1,
      quick,
      sort: sort ?? (!quick && breederId != null ? "smart_deal" : undefined),
      minPrice: priceRange.min ?? undefined,
      maxPrice: priceRange.max ?? undefined,
      seeds_param: seedsParam,
      genetics_param: geneticsParam,
      difficulty_param: difficultyParam,
      thc_param: thcParam,
      cbd_param: cbdParam,
      sex_param: sexParam,
      yield_param: yieldParam,
    }).catch(() => ({
      data: [] as ProductListItem[],
      error: "catalog_fetch_failed",
      catalogHasMore: false,
      catalogTotalCount: null as number | null,
      catalogUseCursor: false,
    }));
    initialProducts = catalog.error
      ? []
      : (bigintToJson(catalog.data ?? []) as ProductListItem[]);
    initialCatalogTotal =
      typeof catalog.catalogTotalCount === "number" ? catalog.catalogTotalCount : null;
    initialCatalogUseCursor = catalog.catalogUseCursor === true;
    const lastRow = initialProducts[initialProducts.length - 1];
    initialCatalogNextCursor =
      initialCatalogUseCursor && lastRow?.id != null ? Number(lastRow.id) : null;
  }

  const lcpHref = getListingThumbnailUrl(initialProducts[0] ?? {});

  return (
    <Suspense fallback={<ShopSkeleton />}>
      <CatalogLcpPreload href={lcpHref} />
      <ShopPageClient
        initialProducts={initialProducts}
        initialCatalogTotal={initialCatalogTotal}
        initialCatalogNextCursor={
          Number.isFinite(initialCatalogNextCursor ?? NaN)
            ? initialCatalogNextCursor
            : null
        }
        initialCatalogUseCursor={initialCatalogUseCursor}
        showClearanceFilter={initialShowClearanceFilter}
        initialBreeder={initialBreeder}
      />
    </Suspense>
  );
}
