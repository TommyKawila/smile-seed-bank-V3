import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Brand checkout promotions retired — always empty so cart/listing skip brand %.
 * Coupons (`promo_codes`) and clearance are unchanged.
 */
export async function GET() {
  return NextResponse.json(
    { rules: [] },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      },
    },
  );
}
