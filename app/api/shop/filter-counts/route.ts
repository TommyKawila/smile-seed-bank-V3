import { NextResponse } from "next/server";
import { resolveCatalogFtFromUrl } from "@/lib/catalog-navigation";
import { getShopCatalogFilterCounts } from "@/services/shop-catalog-filter-counts";

export const dynamic = "force-dynamic";

function numParam(value: string | null): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const breederParam =
    searchParams.get("breeder")?.trim() ||
    searchParams.get("slug")?.trim() ||
    undefined;
  const filterRaw = searchParams.get("filter")?.trim() || "";
  const catalogFt =
    resolveCatalogFtFromUrl({
      ft: searchParams.get("ft"),
      filter: filterRaw || undefined,
    }) || undefined;

  const counts = await getShopCatalogFilterCounts({
    breeder_id: numParam(searchParams.get("breederId")),
    breeder_shop_param: breederParam,
    category: searchParams.get("category")?.trim() || undefined,
    search:
      searchParams.get("search")?.trim() ||
      searchParams.get("q")?.trim() ||
      undefined,
    catalog_ft: catalogFt,
  });

  return NextResponse.json({ counts });
}
