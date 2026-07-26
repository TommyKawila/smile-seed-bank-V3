import { breederSlugFromName } from "@/lib/breeder-slug";

export type MerchCategoryId = "tees" | "caps" | "pins" | "stickers";

export type MerchAccent = "emerald" | "violet" | "amber" | "sky";

export type MerchCategory = {
  id: MerchCategoryId;
  labelTh: string;
  labelEn: string;
};

export type MerchBreederBox = {
  breederId: number;
  slug: string;
  name: string;
  taglineTh: string;
  taglineEn: string;
  accent: MerchAccent;
  logoUrl: string | null;
  productCount: number;
};

export type MerchStorefrontProduct = {
  id: string;
  slug: string | null;
  breederSlug: string;
  categoryId: MerchCategoryId;
  nameTh: string;
  nameEn: string;
  priceBaht: number;
  blurbTh: string;
  blurbEn: string;
  accent: MerchAccent;
  imageUrl: string | null;
};

export const MERCH_CATEGORIES: MerchCategory[] = [
  { id: "tees", labelTh: "เสื้อยืด", labelEn: "Tees" },
  { id: "caps", labelTh: "หมวก", labelEn: "Caps" },
  { id: "pins", labelTh: "เข็มกลัด", labelEn: "Pins" },
  { id: "stickers", labelTh: "สติกเกอร์", labelEn: "Stickers" },
];

const ACCENTS: MerchAccent[] = ["emerald", "violet", "amber", "sky"];

export function merchAccentForBreederId(breederId: number): MerchAccent {
  return ACCENTS[Math.abs(breederId) % ACCENTS.length];
}

export function getMerchCategory(id: string | null | undefined): MerchCategory | null {
  if (!id) return null;
  return MERCH_CATEGORIES.find((c) => c.id === id) ?? null;
}

export function isMerchCategoryId(value: string): value is MerchCategoryId {
  return MERCH_CATEGORIES.some((c) => c.id === value);
}

export function merchBreederHref(slug: string): string {
  return `/merch?breeder=${encodeURIComponent(slug)}`;
}

export function merchCategoryHref(breederSlug: string, categoryId: MerchCategoryId): string {
  return `/merch?breeder=${encodeURIComponent(breederSlug)}&cat=${encodeURIComponent(categoryId)}`;
}

export function merchBreederSlugFromName(name: string): string {
  return breederSlugFromName(name);
}
