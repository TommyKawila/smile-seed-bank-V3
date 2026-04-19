import type { DiscountTier } from "@/types/supabase";

/** Spend-based tiers (THB). Highest matching `min_spend` wins. */
export interface TieredDiscountRule {
  min_spend: number;
  discount_percent: number;
}

/** Empty by default — spend tiers come from `promotion_rules` via `/api/storefront/tiered-discounts` only. */
export const DEFAULT_TIERED_RULES: TieredDiscountRule[] = [];

export interface PromoInfo {
  discount_type: "PERCENTAGE" | "FIXED" | string;
  discount_value: number;
}

export function evaluateTieredDiscountBySpend(
  subtotal: number,
  rules: TieredDiscountRule[]
): { discountPercent: number; minSpend: number } | null {
  const eligible = rules.filter((r) => subtotal >= r.min_spend);
  if (eligible.length === 0) return null;
  const best = eligible.reduce((a, b) =>
    b.discount_percent > a.discount_percent ? b : a
  );
  return { discountPercent: best.discount_percent, minSpend: best.min_spend };
}

export function evaluateDiscountTier(subtotal: number, tiers: DiscountTier[]): DiscountTier | null {
  const eligible = tiers.filter((t) => t.is_active && subtotal >= t.min_amount);
  if (eligible.length === 0) return null;
  return eligible.reduce((best, t) =>
    t.discount_percentage > best.discount_percentage ? t : best
  );
}

/** Matches `lib/services/coupon-service` (percentage on subtotal; fixed capped). */
export function computeCouponDiscountOnSubtotal(subtotal: number, promoInfo: PromoInfo): number {
  const dt = String(promoInfo.discount_type).toUpperCase();
  if (dt === "PERCENTAGE") {
    return Math.round((subtotal * promoInfo.discount_value) / 100);
  }
  return Math.min(promoInfo.discount_value, subtotal);
}

export type ExclusiveDiscountResolution = {
  tierDiscount: number;
  promoDiscount: number;
  /** Eligible auto tier % (for progress / labels), not necessarily applied if coupon wins. */
  eligibleTierPercent: number;
  usePromoForOrder: boolean;
  promoSupersededByTier: boolean;
};

/**
 * Tier auto-discount and coupon are **exclusive**. Pick the path with the lower
 * merchandise total (best deal). Tie → prefer auto tier (sustainable default).
 */
export function resolveExclusiveCartDiscounts(input: {
  subtotal: number;
  tieredRules: TieredDiscountRule[];
  discountTiers: DiscountTier[];
  promoInfo: PromoInfo | null;
}): ExclusiveDiscountResolution {
  const { subtotal, tieredRules, discountTiers, promoInfo } = input;

  const tieredResult =
    tieredRules.length > 0 ? evaluateTieredDiscountBySpend(subtotal, tieredRules) : null;
  const appliedTier = evaluateDiscountTier(subtotal, discountTiers);
  const eligibleTierPercent = Math.max(
    tieredResult?.discountPercent ?? 0,
    appliedTier?.discount_percentage ?? 0
  );
  const tierDiscount = Math.round((subtotal * eligibleTierPercent) / 100);

  if (!promoInfo) {
    return {
      tierDiscount,
      promoDiscount: 0,
      eligibleTierPercent,
      usePromoForOrder: false,
      promoSupersededByTier: false,
    };
  }

  const couponDiscount = computeCouponDiscountOnSubtotal(subtotal, promoInfo);
  const merchAfterTier = subtotal - tierDiscount;
  const merchAfterCoupon = subtotal - couponDiscount;

  if (couponDiscount <= 0) {
    return {
      tierDiscount,
      promoDiscount: 0,
      eligibleTierPercent,
      usePromoForOrder: false,
      promoSupersededByTier: false,
    };
  }

  if (merchAfterCoupon < merchAfterTier) {
    return {
      tierDiscount: 0,
      promoDiscount: couponDiscount,
      eligibleTierPercent,
      usePromoForOrder: true,
      promoSupersededByTier: false,
    };
  }

  return {
    tierDiscount,
    promoDiscount: 0,
    eligibleTierPercent,
    usePromoForOrder: false,
    promoSupersededByTier: merchAfterCoupon >= merchAfterTier,
  };
}
