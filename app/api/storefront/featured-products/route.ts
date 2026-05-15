import { NextResponse } from "next/server";
import { HOME_FEATURED_POOL, HOME_FEATURED_SHOW } from "@/lib/constants";
import { getFeaturedProducts } from "@/services/product-service";

export const dynamic = "force-dynamic";

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = arr[i];
    const b = arr[j];
    if (a === undefined || b === undefined) continue;
    arr[i] = b;
    arr[j] = a;
  }
}

export async function GET() {
  const result = await getFeaturedProducts(HOME_FEATURED_POOL);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  const pool = [...(result.data ?? [])];
  shuffleInPlace(pool);
  const products = pool.slice(0, HOME_FEATURED_SHOW);

  return NextResponse.json(
    { products },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
