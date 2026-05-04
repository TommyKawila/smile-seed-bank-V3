import { NextResponse } from "next/server";
import { bigintToJson } from "@/lib/bigint-json";
import { withTimeout } from "@/lib/timeout";
import { getRelatedProducts } from "@/services/product-service";

export const dynamic = "force-dynamic";
const RELATED_TIMEOUT_MS = 2000;

function numParam(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = numParam(searchParams.get("productId"));
  if (productId == null) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const result = await withTimeout(
    getRelatedProducts({
      productId,
      breederId: numParam(searchParams.get("breederId")),
      categoryName: searchParams.get("category"),
      genetics: searchParams.get("genetics"),
      limit: numParam(searchParams.get("limit")) ?? 4,
    }),
    RELATED_TIMEOUT_MS,
    { data: [], error: null }
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(
    { products: bigintToJson(result.data ?? []) },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
