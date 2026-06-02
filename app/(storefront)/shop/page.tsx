import { Suspense } from "react";
import { ShopSkeleton } from "@/components/skeletons/ShopSkeleton";
import { ShopPageClient } from "@/app/(storefront)/shop/ShopPageClient";
import { getActiveProducts, hasStorefrontClearanceProducts } from "@/services/product-service";
import { bigintToJson } from "@/lib/bigint-json";
import { prisma } from "@/lib/prisma";
import { breederSlugFromName } from "@/lib/breeder-slug";
import type { ProductListItem } from "@/services/storefront-product-service";
import { parsePriceRangeParams } from "@/lib/shop-price-filter";
import {
  resolveCatalogFtFromUrl,
  resolveCatalogQuickFromFilter,
  resolveCatalogSortFromFilter,
} from "@/lib/catalog-navigation";

const SHOP_INITIAL_PRODUCTS = 30;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

type RouteParams = { breederSlug?: string | string[] };
type SearchParams = Record<string, string | string[] | undefined>;

function searchParamsGetter(sp: SearchParams | undefined) {
  return (key: string) => firstParam(sp?.[key]) ?? null;
}

async function resolveBreederIdFromSlug(slug: string | undefined): Promise<number | undefined> {
  const normalizedSlug = decodeURIComponent(slug ?? "").trim().toLowerCase();
  if (!normalizedSlug) return undefined;

  const breeders = await prisma.breeders.findMany({
    where: { is_active: true },
    select: { id: true, name: true },
  });
  const match = breeders.find(
    (breeder) => breederSlugFromName(breeder.name).toLowerCase() === normalizedSlug
  );
  return match ? Number(match.id) : undefined;
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params?: Promise<RouteParams>;
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const breederSlug = firstParam(resolvedParams?.breederSlug);
  const breederId = await resolveBreederIdFromSlug(breederSlug);
  const category = firstParam(resolvedSearchParams?.category)?.trim() || "";
  const search = firstParam(resolvedSearchParams?.q)?.trim() || "";
  const filterRaw = firstParam(resolvedSearchParams?.filter)?.trim() || "";
  const catalogFt =
    resolveCatalogFtFromUrl({
      ft: firstParam(resolvedSearchParams?.ft),
      filter: filterRaw || undefined,
    }) || "";
  const quickRaw = firstParam(resolvedSearchParams?.quick)?.trim();
  const quick =
    quickRaw === "new" || quickRaw === "sale" || quickRaw === "clearance"
      ? quickRaw
      : resolveCatalogQuickFromFilter(filterRaw) ?? undefined;
  const sortRaw = firstParam(resolvedSearchParams?.sort)?.trim();
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
    get: searchParamsGetter(resolvedSearchParams),
  });

  const [catalog, showClearanceFilter] = await Promise.all([
    getActiveProducts({
      category: category || undefined,
      breeder_id: breederId,
      search: search || undefined,
      catalog_ft: catalogFt || undefined,
      includeVariants: true,
      limit: SHOP_INITIAL_PRODUCTS,
      page: 1,
      quick,
      sort: sort ?? (!quick && breederId != null ? "smart_deal" : undefined),
      minPrice: priceRange.min ?? undefined,
      maxPrice: priceRange.max ?? undefined,
      seeds_param: firstParam(resolvedSearchParams?.seeds)?.trim() || null,
      genetics_param: firstParam(resolvedSearchParams?.genetics)?.trim() || null,
      difficulty_param: firstParam(resolvedSearchParams?.difficulty)?.trim() || null,
      thc_param: firstParam(resolvedSearchParams?.thc)?.trim() || null,
      cbd_param: firstParam(resolvedSearchParams?.cbd)?.trim() || null,
      sex_param: firstParam(resolvedSearchParams?.sex)?.trim() || null,
      yield_param: firstParam(resolvedSearchParams?.yield)?.trim() || null,
    }).catch(() => ({
      data: [] as ProductListItem[],
      error: "catalog_fetch_failed",
      catalogHasMore: false,
      catalogTotalCount: null as number | null,
    })),
    hasStorefrontClearanceProducts().catch(() => false),
  ]);
  const initialProducts = catalog.error
    ? []
    : (bigintToJson(catalog.data ?? []) as ProductListItem[]);
  const initialCatalogTotal =
    typeof catalog.catalogTotalCount === "number" ? catalog.catalogTotalCount : null;

  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopPageClient
        initialProducts={initialProducts}
        initialCatalogTotal={initialCatalogTotal}
        showClearanceFilter={showClearanceFilter}
      />
    </Suspense>
  );
}
