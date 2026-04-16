import { NextResponse } from "next/server";
import { getLowStockSpotlight } from "@/lib/services/low-stock-spotlight";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("ids")?.trim();
  const withinIds = raw
    ? raw
        .split(",")
        .map((s) => parseInt(s, 10))
        .filter((n) => Number.isFinite(n) && n > 0)
    : null;

  const result = await getLowStockSpotlight({
    withinIds: withinIds && withinIds.length > 0 ? withinIds : null,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error, products: [] }, { status: 500 });
  }

  return NextResponse.json(
    { products: result.data ?? [] },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
