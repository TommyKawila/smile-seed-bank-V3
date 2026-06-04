import { NextResponse } from "next/server";
import { bigintToJson } from "@/lib/bigint-json";
import { getActiveProducts, getMixedBreederProducts } from "@/services/product-service";
import { PRICE_PARAM_MAX, PRICE_PARAM_MIN } from "@/lib/shop-price-filter";
import {
  resolveCatalogFtFromUrl,
  resolveCatalogQuickFromFilter,
  resolveCatalogSortFromFilter,
} from "@/lib/catalog-navigation";

export const dynamic = "force-dynamic";

function numParam(value: string | null): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Math.floor(numParam(searchParams.get("page")) ?? 1));
  const cursorId = numParam(searchParams.get("cursor"));
  const limit = Math.min(100, Math.max(1, Math.floor(numParam(searchParams.get("limit")) ?? 50)));
  const breederParam =
    searchParams.get("breeder")?.trim() ||
    searchParams.get("slug")?.trim() ||
    undefined;
  const breederId = numParam(searchParams.get("breederId"));
  const filterRaw = searchParams.get("filter")?.trim() || "";
  const catalogFt =
    resolveCatalogFtFromUrl({
      ft: searchParams.get("ft"),
      filter: filterRaw || undefined,
    }) || undefined;
  const quickRaw = searchParams.get("quick")?.trim();
  const quick =
    quickRaw === "new" || quickRaw === "sale" || quickRaw === "clearance"
      ? quickRaw
      : resolveCatalogQuickFromFilter(filterRaw) ?? undefined;
  const requestedSort = searchParams.get("sort")?.trim();
  const includeVariants = searchParams.get("includeVariants") === "true";
  const minPrice =
    numParam(searchParams.get("minPrice")) ??
    numParam(searchParams.get(PRICE_PARAM_MIN));
  const maxPrice =
    numParam(searchParams.get("maxPrice")) ??
    numParam(searchParams.get(PRICE_PARAM_MAX));

  const sortIsMixed = requestedSort === "mixed_breeder";
  const sortIsSmart = requestedSort === "smart_deal";
  const sortIsCatalog =
    requestedSort === "price_asc" ||
    requestedSort === "price_desc" ||
    requestedSort === "new_arrivals" ||
    requestedSort === "newest";
  const sortFromFilter = resolveCatalogSortFromFilter(filterRaw);

  let sort: string | undefined;
  if (sortIsMixed) sort = "mixed_breeder";
  else if (sortIsSmart) sort = "smart_deal";
  else if (sortIsCatalog) sort = requestedSort;
  else if (sortFromFilter) sort = sortFromFilter;
  else if (!requestedSort && (breederParam || breederId != null) && !quick) sort = "smart_deal";

  let result =
    sort === "mixed_breeder"
      ? await getMixedBreederProducts(2, limit)
      : await getActiveProducts({
          category: searchParams.get("category")?.trim() || undefined,
          breeder_id: breederId,
          breeder_shop_param: breederParam,
          search: searchParams.get("search")?.trim() || searchParams.get("q")?.trim() || undefined,
          minPrice,
          maxPrice,
          page,
          limit,
          cursor_id: cursorId,
          includeVariants,
          sort,
          quick,
          seeds_param: searchParams.get("seeds"),
          genetics_param: searchParams.get("genetics"),
          difficulty_param: searchParams.get("difficulty"),
          thc_param: searchParams.get("thc"),
          cbd_param: searchParams.get("cbd"),
          sex_param: searchParams.get("sex"),
          yield_param: searchParams.get("yield"),
          catalog_ft: catalogFt || undefined,
        });

  if ((result.error || (result.data ?? []).length === 0) && sort === "mixed_breeder") {
    console.warn("[api/products] mixed_breeder returned empty/error; falling back", {
      error: result.error,
    });
    result = await getActiveProducts({
      category: searchParams.get("category")?.trim() || undefined,
      search: searchParams.get("search")?.trim() || searchParams.get("q")?.trim() || undefined,
      minPrice,
      maxPrice,
      page,
      limit,
      includeVariants: true,
      seeds_param: searchParams.get("seeds"),
      genetics_param: searchParams.get("genetics"),
      difficulty_param: searchParams.get("difficulty"),
      thc_param: searchParams.get("thc"),
      cbd_param: searchParams.get("cbd"),
      sex_param: searchParams.get("sex"),
      yield_param: searchParams.get("yield"),
      catalog_ft: catalogFt || undefined,
      quick,
      sort:
        sortIsCatalog && requestedSort
          ? requestedSort
          : sortFromFilter
            ? sortFromFilter
            : undefined,
    });
  }

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const hasMoreFromCatalog =
    "catalogHasMore" in result && typeof result.catalogHasMore === "boolean"
      ? result.catalogHasMore
      : undefined;
  const hasMore =
    hasMoreFromCatalog !== undefined ? hasMoreFromCatalog : (result.data ?? []).length === limit;

  const total =
    "catalogTotalCount" in result && typeof result.catalogTotalCount === "number"
      ? result.catalogTotalCount
      : null;
  const nextCursor =
    "catalogNextCursor" in result && typeof result.catalogNextCursor === "number"
      ? result.catalogNextCursor
      : null;
  const useCursor =
    "catalogUseCursor" in result && result.catalogUseCursor === true;

  return NextResponse.json(
    {
      products: bigintToJson(result.data ?? []),
      page,
      pageSize: limit,
      hasMore,
      total,
      nextCursor,
      useCursor,
    },
    { headers: { "Cache-Control": "private, no-store, max-age=0, must-revalidate" } }
  );
}
