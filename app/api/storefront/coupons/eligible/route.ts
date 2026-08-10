import { NextRequest, NextResponse } from "next/server";
import { getEligibleCoupons } from "@/lib/services/coupon-service";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/storefront/coupons/eligible
 * Returns coupons the authenticated session user has not yet redeemed.
 * Query `userId` / `email` are ignored for authorization — session only.
 */
export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const coupons = await getEligibleCoupons(user.id, user.email?.trim() ?? null);
  return NextResponse.json({ coupons });
}
