/** Canonical DB values for products.flowering_type / products.sex_type (lowercase). */

export const FLOWERING_TYPES = ["autoflower", "photoperiod"] as const;
export type FloweringTypeCanonical = (typeof FLOWERING_TYPES)[number];

export const SEX_TYPES = ["feminized", "regular"] as const;
export type SexTypeCanonical = (typeof SEX_TYPES)[number];

/**
 * Normalize flowering type from DB for UI (standardized).
 */
export const normalizeFloweringFromDb = (
  val: string | null | undefined
): "photoperiod" | "autoflower" | "" => {
  if (!val) return "";
  const normalized = val.trim().toLowerCase();
  if (normalized.includes("auto")) return "autoflower";
  if (normalized.includes("photo")) return "photoperiod";
  return "";
};

/**
 * Normalize sex type from DB for UI (standardized).
 */
export const normalizeSexFromDb = (
  val: string | null | undefined
): "feminized" | "regular" | "" => {
  if (!val) return "";
  const normalized = val.trim().toLowerCase();
  if (normalized.includes("reg")) return "regular";
  if (normalized.includes("fem") || normalized === "ff") return "feminized";
  return "";
};

export function normalizeFloweringTypeFromDb(
  raw: string | null | undefined
): FloweringTypeCanonical | null {
  const v = normalizeFloweringFromDb(raw);
  return v === "" ? null : v;
}

export function normalizeSexTypeFromDb(
  raw: string | null | undefined
): SexTypeCanonical | null {
  if (raw == null || raw === "") return null;
  const l = raw.trim().toLowerCase();
  if (l.includes("autoflower") || l === "auto") return null;
  const v = normalizeSexFromDb(raw);
  return v === "" ? null : v;
}

/** Storefront / receipt short labels */
export function labelFloweringType(raw: string | null | undefined): string {
  const c = normalizeFloweringTypeFromDb(raw);
  if (c === "autoflower") return "Autoflower";
  if (c === "photoperiod") return "Photoperiod";
  return raw?.trim() ? String(raw) : "—";
}

export function isAutofloweringDb(raw: string | null | undefined): boolean {
  return normalizeFloweringTypeFromDb(raw) === "autoflower";
}

export function isPhotoperiodDb(raw: string | null | undefined): boolean {
  return normalizeFloweringTypeFromDb(raw) === "photoperiod";
}
