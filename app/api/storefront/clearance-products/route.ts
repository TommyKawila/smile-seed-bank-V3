import { NextResponse } from "next/server";
import { getClearanceStorefrontProducts } from "@/services/product-service";

export const dynamic = "force-dynamic";

const CLEARANCE_LIMIT = 24;

export async function GET() {
  const result = await getClearanceStorefrontProducts(CLEARANCE_LIMIT);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json(
    { products: result.data ?? [] },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
