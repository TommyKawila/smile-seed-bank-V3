/** Default Clearance discount when adding a product (pay 50% of list). */
export const CLEARANCE_DISCOUNT_PERCENT = 50 as const;

/** Allowed Clearance discount groups (percent off list). */
export const CLEARANCE_DISCOUNT_PERCENTS = [50, 30, 25] as const;

export type ClearanceDiscountPercent = (typeof CLEARANCE_DISCOUNT_PERCENTS)[number];

export function isClearanceDiscountPercent(value: unknown): value is ClearanceDiscountPercent {
  const n = Number(value);
  return CLEARANCE_DISCOUNT_PERCENTS.some((p) => p === n);
}

/** Normalize to allowlist; invalid/missing → default 50. */
export function normalizeClearanceDiscountPercent(
  value: unknown,
  fallback: ClearanceDiscountPercent = CLEARANCE_DISCOUNT_PERCENT
): ClearanceDiscountPercent {
  return isClearanceDiscountPercent(value) ? value : fallback;
}

/**
 * Breeder banner box on `/clearance` — same frame on mobile (1-col) and desktop (3-col).
 * Upload at this ratio; storefront uses object-cover inside aspect-[16/10].
 */
export const CLEARANCE_BREEDER_BANNER = {
  aspectClass: "aspect-[16/10]" as const,
  recommendedWidth: 1600,
  recommendedHeight: 1000,
  minWidth: 960,
  minHeight: 600,
  /** Safe: keep logo/key art centered; bottom ~35% gets title gradient on storefront. */
  safeZoneNoteTh:
    "วางโลโก้/ภาพหลักกลางการ์ด · ด้านล่าง ~35% จะมี gradient ทับชื่อค่าย",
  safeZoneNoteEn:
    "Center the logo/key art · bottom ~35% is covered by the title gradient",
} as const;

export function clearanceBreederBannerSizeLabel(locale: "th" | "en" = "th"): string {
  const { recommendedWidth: w, recommendedHeight: h, minWidth, minHeight } =
    CLEARANCE_BREEDER_BANNER;
  if (locale === "en") {
    return `Recommended ${w}×${h} px (16:10) · min ${minWidth}×${minHeight} px`;
  }
  return `แนะนำ ${w}×${h} px (อัตราส่วน 16:10) · ขั้นต่ำ ${minWidth}×${minHeight} px`;
}

/** Storefront Clearance landing — one banner box per participating breeder (per % section). */
export type StorefrontClearanceBreederBox = {
  breederId: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  imageUrl: string | null;
  titleTh: string;
  titleEn: string | null;
  productCount: number;
  discountPercent: ClearanceDiscountPercent;
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

/** Whole-baht clearance price from list price at % off. */
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
