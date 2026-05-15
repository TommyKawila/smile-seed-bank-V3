export type HeroBanner = {
  id: string;
  desktopSrc: string;
  mobileSrc: string;
  desktopSrcEn?: string | null;
  mobileSrcEn?: string | null;
  altTh: string;
  altEn?: string | null;
  link: string;
  /** Split-hero panel backdrop (#RRGGBB); visible when image aspect ≠ locked frame (e.g. mobile contain). */
  panelBgHex?: string | null;
};

/** Fallback when no rows in `hero_banners` match schedule + active. */
export const DEFAULT_HERO_BANNERS_FALLBACK: HeroBanner[] = [
  {
    id: "420-fast-buds",
    desktopSrc:
      "https://images.unsplash.com/photo-1601412436405-1f0c6b50921f?auto=format&fit=crop&w=1920&h=700&q=85",
    mobileSrc:
      "https://images.unsplash.com/photo-1601412436405-1f0c6b50921f?auto=format&fit=crop&w=900&h=1125&q=85",
    altTh: "420 Fast Buds — Smile Seed Bank",
    altEn: "420 Fast Buds — Smile Seed Bank",
    link: "/seeds/420fastbuds",
  },
  {
    id: "vault-shop",
    desktopSrc:
      "https://images.unsplash.com/photo-1548776478-23bf51fa65c8?auto=format&fit=crop&w=1920&h=700&q=85",
    mobileSrc:
      "https://images.unsplash.com/photo-1548776478-23bf51fa65c8?auto=format&fit=crop&w=900&h=1125&q=85",
    altTh: "Browse the genetic vault — Smile Seed Bank",
    altEn: "Browse the genetic vault — Smile Seed Bank",
    link: "/seeds",
  },
];
