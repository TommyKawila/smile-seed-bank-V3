import { NextResponse } from "next/server";
import { getStorefrontCartRules } from "@/services/storefront-cart-rules-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Public: shipping rules + gift promotions for client cart (no Supabase JS on storefront). */
export async function GET() {
  try {
    const payload = await getStorefrontCartRules();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      },
    });
  } catch (e) {
    console.error("GET /api/storefront/cart-rules", e);
    return NextResponse.json(
      { shippingRules: [], promotions: [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      },
    );
  }
}
