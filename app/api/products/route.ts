import { NextResponse } from "next/server";
import { getActiveProducts } from "@/services/product-service";

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

  const result = await getActiveProducts({
    category: searchParams.get("category")?.trim() || undefined,
    search: searchParams.get("search")?.trim() || searchParams.get("q")?.trim() || undefined,
    minPrice: numParam(searchParams.get("minPrice")),
    maxPrice: numParam(searchParams.get("maxPrice")),
    page,
    limit,
    seeds_param: searchParams.get("seeds"),
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(
    {
      products: result.data ?? [],
      page,
      pageSize: limit,
      hasMore: (result.data ?? []).length === limit,
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
