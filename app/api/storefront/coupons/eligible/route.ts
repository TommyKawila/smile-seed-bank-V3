import { NextRequest, NextResponse } from "next/server";
import { getEligibleCoupons } from "@/lib/services/coupon-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/storefront/coupons/eligible?userId=<uuid>&email=<email>
 * Returns all coupons this specific user has NOT yet redeemed.
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")?.trim();
  const email = req.nextUrl.searchParams.get("email")?.trim() || null;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const coupons = await getEligibleCoupons(userId, email);
  return NextResponse.json({ coupons });
}
