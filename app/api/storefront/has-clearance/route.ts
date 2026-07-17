import { NextResponse } from "next/server";
import { hasStorefrontClearanceProducts } from "@/services/product-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const show = await hasStorefrontClearanceProducts().catch(() => false);
  return NextResponse.json(
    { showClearanceFilter: show },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    }
  );
}
