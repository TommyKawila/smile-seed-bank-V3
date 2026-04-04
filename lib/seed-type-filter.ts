/**
 * Breeder shop filter: `?type=` slug combines `flowering_type` + optional category/collection
 * (uses `product_categories.name` when present, else legacy `products.category` string).
 */

import { normalizeFloweringFromDb } from "@/lib/cannabis-attributes";
import {
  CATEGORY_NAME_PLAIN_PHOTO,
  FLOWERING_LABEL_PHOTO_3N,
} from "@/lib/constants";

/** Canonical slug for URL and matching (lowercase, hyphens). */
export function floweringTypeToSlug(raw: string | null | undefined): string {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (!s) return "";
  return s.toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
}

/** Prefer FK relation name; fall back to denormalized `category` string. */
export function resolveCategoryLabelForFilters(p: {
  category?: string | null;
  product_categories?: { name?: string | null } | null;
}): string {
  const fromRel = p.product_categories?.name?.trim();
  if (fromRel) return fromRel;
  return (p.category ?? "").trim();
}

/** Collection detection from full category label (aggressive substring rules). */
export function collectionKeyFromCategory(categoryLabel: string | null | undefined): "original-line" | "ff" | null {
  const c = (categoryLabel ?? "").trim().toLowerCase();
  if (!c) return null;
  if (c.includes("original")) return "original-line";
  if (
    c === "ff" ||
    c.includes("fast flowering") ||
    c.includes("fast-flowering") ||
    c.includes("fast_flowering") ||
    c.includes("fast version") ||
    /(^|\s)ff(\s|$)/i.test(c)
  ) {
    return "ff";
  }
  return null;
}

export type BreederDisplayProductInput = {
  flowering_type: string | null | undefined;
  category?: string | null;
  product_categories?: { name?: string | null } | null;
};

/**
 * Stable display key for breeder type pills: flowering + optional collection.
 * Products without flowering_type are excluded upstream from counts.
 */
export function breederDisplayTypeKeyFromProduct(p: BreederDisplayProductInput): string {
  const ft = floweringTypeToSlug(p.flowering_type);
  if (!ft) return "";
  const label = resolveCategoryLabelForFilters(p);
  const coll = collectionKeyFromCategory(label);

  if (ft === "autoflower" && coll === "original-line") return "auto-original-line";
  if ((ft === "photoperiod" || ft === "photo-ff") && coll === "ff") return "photo-ff";
  if ((ft === "photoperiod" || ft === "photo-ff") && coll === "original-line") return "photo-original-line";
  if (ft === "autoflower" && coll === "ff") return "auto-ff";

  return ft;
}

/** Shop-wide flowering buckets for pill filter (Auto / Photo / Photo FF / Photo 3N).
 *  Admin Manual Grid category filter uses the same DB values via `lib/admin-grid-category-filter.ts`. */
export type CatalogFloweringBucket = "auto" | "photo" | "photo_ff" | "photo_3n";

function normalizeCategoryLabelKey(label: string | null | undefined): string {
  return (label ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * When `flowering_type` is empty, infer bucket from `product_categories.name` / legacy `category` only.
 * Strict: never maps 3N/FF into plain `photo`.
 */
function catalogBucketFromCategoryLabelOnly(p: BreederDisplayProductInput): CatalogFloweringBucket | null {
  const label = resolveCategoryLabelForFilters(p);
  const n = normalizeCategoryLabelKey(label);
  if (!n) return null;
  if (n === normalizeCategoryLabelKey(FLOWERING_LABEL_PHOTO_3N)) return "photo_3n";
  if (n === "photo ff" || n === "photo_ff") return "photo_ff";
  if (collectionKeyFromCategory(label) === "ff") return "photo_ff";
  if ((CATEGORY_NAME_PLAIN_PHOTO as readonly string[]).includes(n)) return "photo";
  return null;
}

/**
 * Single source of truth: `photo_3n` and `photo_ff` are exclusive; `photo` is plain photoperiod only
 * (FF collection hint upgrades photoperiod → `photo_ff` bucket for counts/pills).
 * NULL `flowering_type` + category **Photo** / **Photoperiod** → `photo` (legacy rows).
 */
export function catalogFloweringBucket(p: BreederDisplayProductInput): CatalogFloweringBucket | null {
  const v = normalizeFloweringFromDb(p.flowering_type);
  if (v === "photo_3n") return "photo_3n";
  if (v === "photo_ff") return "photo_ff";
  if (v === "autoflower") return "auto";
  if (v === "photoperiod") {
    const coll = collectionKeyFromCategory(resolveCategoryLabelForFilters(p));
    if (coll === "ff") return "photo_ff";
    return "photo";
  }
  if (v === "") return catalogBucketFromCategoryLabelOnly(p);
  return null;
}

/** URL `ft` param (slug) vs product — use for shop grid when a pill is selected. */
export function productMatchesCatalogFtParam(
  p: BreederDisplayProductInput,
  ftParam: string | null | undefined
): boolean {
  const want = floweringTypeToSlug(ftParam);
  if (!want) return true;
  const b = catalogFloweringBucket(p);
  if (b == null) return false;
  const slug = b === "photo_ff" ? "photo-ff" : b === "photo_3n" ? "photo-3n" : b;
  return want === slug;
}

export function breederDisplayTypeMatches(
  p: BreederDisplayProductInput,
  urlSlug: string | null | undefined
): boolean {
  const want = floweringTypeToSlug(urlSlug);
  if (!want) return true;
  const key = breederDisplayTypeKeyFromProduct(p);
  return key === want;
}

/** Legacy: plain flowering_type-only match (no category). */
export function floweringTypesMatch(
  productValue: string | null | undefined,
  urlSlug: string
): boolean {
  const want = floweringTypeToSlug(urlSlug);
  if (!want) return true;
  return floweringTypeToSlug(productValue) === want;
}

/** Labels for breeder display-type slugs (includes collection combos). */
export function labelForBreederDisplayTypeSlug(
  slug: string,
  t: (th: string, en: string) => string
): string {
  const s = slug.toLowerCase();
  if (s === "auto-original-line") return t("ออโต้ ออริจินัล", "Auto Original");
  if (s === "photo-ff") return t("โฟโต้ FF", "Photo FF");
  if (s === "photo-original-line") return t("โฟโต้ ออริจินัล", "Photo Original");
  if (s === "auto-ff") return t("ออโต้ FF", "Auto FF");
  return labelForFloweringSlug(slug, t);
}

/** Generic flowering slug → short storefront label. */
export function labelForFloweringSlug(
  slug: string,
  t: (th: string, en: string) => string
): string {
  const s = slug.toLowerCase();
  if (s === "autoflower") return t("ออโต้", "Auto");
  if (s === "photoperiod") return t("โฟโต้", "Photo");
  if (s === "photo-ff" || s === "photo_ff") return t("โฟโต้ FF", "Photo FF");
  if (s === "photo-3n" || s === "photo_3n") return t("Photo 3N", "Photo 3N");
  if (s === "fast-flowering" || s === "fast-version" || s === "fastversion") {
    return t("ฟาสต์", "Fast");
  }
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function labelForFloweringTypeRaw(
  raw: string,
  t: (th: string, en: string) => string
): string {
  return labelForFloweringSlug(floweringTypeToSlug(raw), t);
}

/** Product card badge: `seed_type` → FEM / REG (values stay FEMINIZED / REGULAR in DB). */
export function labelForSeedTypeBadge(seedType: string | null | undefined): string | null {
  if (!seedType?.trim()) return null;
  const u = seedType.trim().toUpperCase();
  if (u === "FEMINIZED" || u === "FEM") return "FEM";
  if (u === "REGULAR" || u === "REG") return "REG";
  return null;
}

/** Product detail: short title-case labels (Fem / Reg). */
export function seedTypeDetailShort(seedType: string | null | undefined): string | null {
  if (!seedType?.trim()) return null;
  const u = seedType.trim().toUpperCase();
  if (u === "FEMINIZED" || u === "FEM") return "Fem";
  if (u === "REGULAR" || u === "REG") return "Reg";
  return null;
}

export function sexTypeDetailShort(sex: string | null | undefined): string | null {
  if (!sex?.trim()) return null;
  const s = sex.trim().toLowerCase();
  if (s === "feminized") return "Fem";
  if (s === "regular") return "Reg";
  return null;
}

/** Shop grid card: AUTO / PHOTO / PHOTO FF (FF hint from name or category when photoperiod). */
export function productCardFloweringChipLabel(product: {
  name: string;
  flowering_type: string | null;
  category?: string | null;
  product_categories?: { name: string } | null;
}): string | null {
  const label = resolveCategoryLabelForFilters(product);
  const v = normalizeFloweringFromDb(product.flowering_type);

  const ffHintFromHaystack = (): boolean => {
    const haystack = [product.name, product.category ?? "", product.product_categories?.name ?? ""].join(" ");
    const lower = haystack.toLowerCase();
    return (
      lower.includes("fast version") ||
      lower.includes("fast flowering") ||
      /\bff\b/i.test(haystack)
    );
  };

  if (v === "photo_3n") return "PHOTO 3N";
  if (v === "photo_ff") return "PHOTO FF";
  if (v === "autoflower") return "AUTO";
  if (v === "photoperiod") {
    if (collectionKeyFromCategory(label) === "ff" || ffHintFromHaystack()) return "PHOTO FF";
    return "PHOTO";
  }
  if (v === "") {
    const b = catalogBucketFromCategoryLabelOnly(product);
    if (b === "photo_3n") return "PHOTO 3N";
    if (b === "photo_ff") return "PHOTO FF";
    if (b === "photo") return ffHintFromHaystack() ? "PHOTO FF" : "PHOTO";
    return null;
  }
  const raw = product.flowering_type?.trim() ?? "";
  return raw ? raw.replace(/-/g, " ").toUpperCase() : null;
}
