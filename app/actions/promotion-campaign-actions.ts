"use server";

import { validateCoupon } from "@/lib/services/coupon-service";

/** Server-side promo validation for checkout (same rules as POST /api/storefront/coupons/validate). */
export async function validatePromotionCampaignCode(input: {
  code: string;
  subtotal: number;
  email: string | null;
  user_id: string | null;
}) {
  const code = input.code.trim().toUpperCase();
  return validateCoupon({
    code,
    subtotal: input.subtotal,
    email: input.email,
    user_id: input.user_id,
  });
}
