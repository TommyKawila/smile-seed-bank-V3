/** Fixed Clearance discount — pay (100 - percent)% of list price. */
export const CLEARANCE_DISCOUNT_PERCENT = 50 as const;

/** Storefront Clearance landing — one banner box per participating breeder. */
export type StorefrontClearanceBreederBox = {
  breederId: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  imageUrl: string | null;
  titleTh: string;
  titleEn: string | null;
  productCount: number;
  discountPercent: typeof CLEARANCE_DISCOUNT_PERCENT;
};

export type ClearanceBreederSummary = {
  breederId: number;
  name: string;
  logoUrl: string | null;
  productCount: number;
  banner: {
    id: number;
    imageUrl: string | null;
    titleTh: string;
    titleEn: string | null;
    sortOrder: number;
    isActive: boolean;
  } | null;
};

/** Whole-baht clearance price from list price at fixed % off. */
export function clearancePriceFromList(
  listPrice: number,
  percent: number = CLEARANCE_DISCOUNT_PERCENT
): number {
  const list = Number(listPrice);
  if (!Number.isFinite(list) || list <= 0) return 0;
  const pct = Math.min(99, Math.max(1, Math.round(percent)));
  return Math.max(1, Math.round((list * (100 - pct)) / 100));
}

export function applyClearancePricesToVariants<
  T extends { price?: number | null; clearance_price?: number | null },
>(variants: T[], percent: number = CLEARANCE_DISCOUNT_PERCENT): T[] {
  return variants.map((v) => {
    const list = Number(v.price ?? 0);
    const cp = clearancePriceFromList(list, percent);
    return { ...v, clearance_price: cp > 0 ? cp : null };
  });
}
