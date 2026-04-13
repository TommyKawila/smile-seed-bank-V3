import { NextResponse } from "next/server";
import { getFeaturedProducts } from "@/services/product-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getFeaturedProducts(16);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json(
    { products: result.data ?? [] },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
