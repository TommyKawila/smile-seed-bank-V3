import { NextResponse } from "next/server";
import { bigintToJson } from "@/lib/bigint-json";
import { getActiveProducts, getMixedBreederProducts } from "@/services/product-service";

export const dynamic = "force-dynamic";

function numParam(value: string | null): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Math.floor(numParam(searchParams.get("page")) ?? 1));
  const limit = Math.min(100, Math.max(1, Math.floor(numParam(searchParams.get("limit")) ?? 50)));
  const breederParam =
    searchParams.get("breeder")?.trim() ||
    searchParams.get("slug")?.trim() ||
    undefined;
  const breederId = numParam(searchParams.get("breederId"));
  const requestedSort = searchParams.get("sort")?.trim() || undefined;
  const sort =
    requestedSort === "mixed_breeder" || requestedSort === "smart_deal"
      ? requestedSort
      : !requestedSort && (breederParam || breederId != null)
        ? "smart_deal"
        : undefined;

  let result =
    sort === "mixed_breeder"
      ? await getMixedBreederProducts(2, limit)
      : await getActiveProducts({
          category: searchParams.get("category")?.trim() || undefined,
          breeder_id: breederId,
          breeder_shop_param: breederParam,
          search: searchParams.get("search")?.trim() || searchParams.get("q")?.trim() || undefined,
          minPrice: numParam(searchParams.get("minPrice")),
          maxPrice: numParam(searchParams.get("maxPrice")),
          page,
          limit,
          sort,
          seeds_param: searchParams.get("seeds"),
        });

  if ((result.error || (result.data ?? []).length === 0) && sort === "mixed_breeder") {
    console.warn("[api/products] mixed_breeder returned empty/error; falling back", {
      error: result.error,
    });
    result = await getActiveProducts({
      category: searchParams.get("category")?.trim() || undefined,
      search: searchParams.get("search")?.trim() || searchParams.get("q")?.trim() || undefined,
      minPrice: numParam(searchParams.get("minPrice")),
      maxPrice: numParam(searchParams.get("maxPrice")),
      page,
      limit,
      includeVariants: true,
      seeds_param: searchParams.get("seeds"),
    });
  }

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(
    {
      products: bigintToJson(result.data ?? []),
      page,
      pageSize: limit,
      hasMore: (result.data ?? []).length === limit,
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
