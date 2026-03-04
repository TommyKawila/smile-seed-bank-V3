import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { hasUserUsedWelcomeCoupon } from "@/lib/services/coupon-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/storefront/promo/welcome10?userId=<uuid>
 * Returns:
 *   { is_active: boolean, has_used: boolean }
 *
 * has_used = true  → hide popup permanently (user already redeemed WELCOME10)
 * is_active = false → hide popup (code disabled/expired)
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")?.trim() || null;

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .select("is_active")
    .eq("code", "WELCOME10")
    .maybeSingle();

  if (error) return NextResponse.json({ is_active: false, has_used: false });

  const isActive = data?.is_active === true;

  // Only do the redemption check when we have a userId AND code is active
  let hasUsed = false;
  if (userId && isActive) {
    hasUsed = await hasUserUsedWelcomeCoupon(userId);
  }

  return NextResponse.json({ is_active: isActive, has_used: hasUsed });
}
