/**
 * Breeder shop filter: `?type=` slug combines `flowering_type` + optional category/collection
 * (uses `product_categories.name` when present, else legacy `products.category` string).
 */

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

/** Shop-wide flowering buckets for pill filter (Auto / Photo / Photo FF). */
export type CatalogFloweringBucket = "auto" | "photo" | "photo_ff";

export function catalogFloweringBucket(p: BreederDisplayProductInput): CatalogFloweringBucket | null {
  const ftRaw = (p.flowering_type ?? "").trim().toLowerCase().replace(/-/g, "_");
  if (ftRaw === "photo_ff") return "photo_ff";
  const key = breederDisplayTypeKeyFromProduct(p);
  if (key === "photo-ff") return "photo_ff";
  if (ftRaw === "autoflower" || key.startsWith("auto")) return "auto";
  if (
    ftRaw === "photoperiod" ||
    key === "photoperiod" ||
    key === "photo-original-line" ||
    (key.startsWith("photo") && key !== "photo-ff")
  ) {
    return "photo";
  }
  return null;
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
  const raw = product.flowering_type?.trim();
  if (!raw) return null;
  const ft = raw.toLowerCase().replace(/-/g, "_");
  if (ft === "autoflower") return "AUTO";
  if (ft === "photo_ff") return "PHOTO FF";
  if (ft === "photoperiod") {
    const haystack = [product.name, product.category ?? "", product.product_categories?.name ?? ""].join(" ");
    const lower = haystack.toLowerCase();
    const ffHint =
      lower.includes("fast version") ||
      lower.includes("fast flowering") ||
      /\bff\b/i.test(haystack);
    return ffHint ? "PHOTO FF" : "PHOTO";
  }
  return raw.replace(/-/g, " ").toUpperCase();
}
