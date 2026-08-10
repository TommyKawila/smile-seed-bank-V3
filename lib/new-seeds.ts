/** Storefront New Seeds landing — one banner box per participating breeder. */
export type StorefrontNewSeedsBreederBox = {
  breederId: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  imageUrl: string | null;
  titleTh: string;
  titleEn: string | null;
  productCount: number;
};

export type NewSeedsBreederSummary = {
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

/**
 * Breeder banner box on `/new` — bento tiles; upload at 4:3 mobile-friendly ratio.
 */
export const NEW_SEEDS_BREEDER_BANNER = {
  aspectClass: "aspect-[4/3]" as const,
  recommendedWidth: 1200,
  recommendedHeight: 900,
  minWidth: 800,
  minHeight: 600,
  safeZoneNoteTh:
    "วางโลโก้/ภาพหลักกลางการ์ด · มุมซ้ายบนจะมี badge NEW · ด้านล่าง ~30% มี gradient ทับชื่อ",
  safeZoneNoteEn:
    "Center logo/key art · top-left gets NEW badge · bottom ~30% is title gradient",
} as const;

export function newSeedsBreederBannerSizeLabel(locale: "th" | "en" = "th"): string {
  const { recommendedWidth: w, recommendedHeight: h, minWidth, minHeight } =
    NEW_SEEDS_BREEDER_BANNER;
  if (locale === "en") {
    return `Recommended ${w}×${h} px (4:3) · min ${minWidth}×${minHeight} px`;
  }
  return `แนะนำ ${w}×${h} px (อัตราส่วน 4:3) · ขั้นต่ำ ${minWidth}×${minHeight} px`;
}
