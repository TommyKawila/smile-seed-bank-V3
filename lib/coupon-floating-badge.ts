import type { EligibleCoupon } from "@/lib/services/coupon-service";

export const DEFAULT_COUPON_FLOAT_BADGE = "/images/coupon-float-badge.svg" as const;

export type FloatingBadgeKind = "lottie" | "image" | "default";

export type FloatingBadgeAsset = {
  kind: FloatingBadgeKind;
  /** Lottie JSON URL, raster/SVG URL, or default static path */
  src: string;
};

/** Active, not expired — matches storefront “collectable” visibility. */
export function isCouponCollectableForFloating(c: EligibleCoupon): boolean {
  if (!c.is_active) return false;
  if (c.expiry_date) {
    const t = new Date(c.expiry_date).getTime();
    if (Number.isFinite(t) && t <= Date.now()) return false;
  }
  return true;
}

function sortByDiscountThenId<T extends { discount_value: number; id: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    const dv = b.discount_value - a.discount_value;
    if (dv !== 0) return dv;
    return b.id - a.id;
  });
}

/**
 * Prefer Lottie (highest discount, then newest id), then static image, then default SVG.
 */
export function pickFloatingBadgeAsset(coupons: EligibleCoupon[]): FloatingBadgeAsset {
  const ok = coupons.filter(isCouponCollectableForFloating);
  const withLottie = ok.filter((c) => c.badge_lottie_url?.trim());
  if (withLottie.length) {
    const best = sortByDiscountThenId(withLottie)[0];
    return { kind: "lottie", src: best.badge_lottie_url!.trim() };
  }
  const withImage = ok.filter((c) => c.badge_url?.trim());
  if (withImage.length) {
    const best = sortByDiscountThenId(withImage)[0];
    return { kind: "image", src: best.badge_url!.trim() };
  }
  return { kind: "default", src: DEFAULT_COUPON_FLOAT_BADGE };
}
