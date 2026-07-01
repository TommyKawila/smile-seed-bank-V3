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

function searchParamsGetter(sp: Record<string, string | string[] | undefined> | undefined) {
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
  params?: Promise<{ breederSlug?: string | string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = params ? await params : undefined;
  const sp = searchParams ? await searchParams : undefined;
  const breederSlug = firstParam(resolvedParams?.breederSlug);
  const breederId = await resolveBreederIdFromSlug(breederSlug);
  const breederShopParam = firstParam(sp?.breeder)?.trim() || "";
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

  const [catalog, showClearanceFilter] = await Promise.all([
    getActiveProducts({
      category: category || undefined,
      breeder_id: breederId,
      breeder_shop_param: breederShopParam || undefined,
      search: search || undefined,
      catalog_ft: catalogFt || undefined,
      includeVariants: Boolean(firstParam(sp?.seeds)?.trim()),
      limit: SHOP_INITIAL_PRODUCTS,
      page: 1,
      quick,
      sort: sort ?? (!quick && (breederId != null || breederShopParam) ? "smart_deal" : undefined),
      minPrice: priceRange.min ?? undefined,
      maxPrice: priceRange.max ?? undefined,
      seeds_param: firstParam(sp?.seeds)?.trim() || null,
      genetics_param: firstParam(sp?.genetics)?.trim() || null,
      difficulty_param: firstParam(sp?.difficulty)?.trim() || null,
      thc_param: firstParam(sp?.thc)?.trim() || null,
      cbd_param: firstParam(sp?.cbd)?.trim() || null,
      sex_param: firstParam(sp?.sex)?.trim() || null,
      yield_param: firstParam(sp?.yield)?.trim() || null,
    }).catch(() => ({
      data: [] as ProductListItem[],
      error: "catalog_fetch_failed",
      catalogHasMore: false,
      catalogTotalCount: null as number | null,
      catalogUseCursor: false,
    })),
    hasStorefrontClearanceProducts().catch(() => false),
  ]);
  const initialProducts = catalog.error
    ? []
    : (bigintToJson(catalog.data ?? []) as ProductListItem[]);
  const initialCatalogTotal =
    typeof catalog.catalogTotalCount === "number" ? catalog.catalogTotalCount : null;
  const initialCatalogUseCursor = catalog.catalogUseCursor === true;
  const lastRow = initialProducts[initialProducts.length - 1];
  const initialCatalogNextCursor =
    initialCatalogUseCursor && lastRow != null && lastRow.id != null
      ? Number(lastRow.id)
      : null;

  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopPageClient
        initialProducts={initialProducts}
        initialCatalogTotal={initialCatalogTotal}
        initialCatalogNextCursor={
          Number.isFinite(initialCatalogNextCursor ?? NaN)
            ? initialCatalogNextCursor
            : null
        }
        initialCatalogUseCursor={initialCatalogUseCursor}
        showClearanceFilter={showClearanceFilter}
      />
    </Suspense>
  );
}
