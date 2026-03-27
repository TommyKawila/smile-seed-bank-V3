/**
 * Product name helpers for catalog / import (display & SEO).
 */

import type { ProductVariant } from "@/types/supabase";

/** Extra standalone words to strip (case-insensitive, word boundaries). */
const EXTRA_NOISE_WORDS = ["Pack", "Seeds"] as const;

/**
 * Cleans a cannabis strain name by removing unnecessary attributes, feminized markers,
 * and calendar years (2000–2029) to make it professional and SEO-friendly.
 *
 * Does **not** strip two-digit numbers that are part of a strain name (e.g. `47` in `AK-47`).
 * Years are matched only as full four-digit tokens `20xx` with word boundaries.
 *
 * @param name The raw strain name from a sheet or external source. `null` / `undefined` / non-string yields `""`.
 * @returns A cleaned, trimmed string (may be empty).
 */
export function cleanStrainName(name: string | null | undefined): string {
  if (name == null || typeof name !== "string") return "";
  let s = name.trim();
  if (!s) return "";

  // Longer parenthetical phrases first
  s = s.replace(/\(\s*FEMINIZED\s*\)/gi, "");
  s = s.replace(/\(\s*FEM\s*\)/gi, "");
  s = s.replace(/\(\s*Fem\s*\)/gi, "");
  s = s.replace(/\(\s*fem\s*\)/gi, "");
  s = s.replace(/\(\s*FAST\s*\)/gi, "");
  s = s.replace(/\(\s*FF\s*\)/gi, "");

  // Years inside parentheses, e.g. (2023)
  s = s.replace(/\(\s*20[0-2][0-9]\s*\)/g, "");

  // Standalone years 2000–2029 only (\b avoids touching "47" in AK-47)
  s = s.replace(/\b20[0-2][0-9]\b/g, "");

  // Hyphen/em-dash separated suffixes
  s = s.replace(/\s*[-–—]\s*FEMINIZED\b/gi, "");
  s = s.replace(/\s*[-–—]\s*FEM\b/gi, "");

  // Standalone feminized markers as words
  s = s.replace(/\bFEMINIZED\b/gi, "");
  s = s.replace(/\bFEM\b/gi, "");

  for (const w of EXTRA_NOISE_WORDS) {
    s = s.replace(new RegExp(`\\b${w}\\b`, "gi"), "");
  }

  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/[-–—]\s*$/g, "").trim();

  return s;
}

/** Sum variant stock (skips inactive when `is_active` is false). */
export function computeTotalStock(
  variants: Pick<ProductVariant, "stock" | "is_active">[] | null | undefined
): number {
  if (!variants?.length) return 0;
  return variants.reduce((sum, v) => {
    if (v.is_active === false) return sum;
    const q = Number(v.stock);
    return sum + (Number.isFinite(q) ? Math.max(0, q) : 0);
  }, 0);
}

/**
 * Lowest retail price among in-stock variants; if none in stock, lowest price among priced variants.
 */
export function computeStartingPrice(
  variants: Pick<ProductVariant, "price" | "stock" | "is_active">[] | null | undefined
): number {
  if (!variants?.length) return 0;
  const active = variants.filter((v) => v.is_active !== false);
  const priced = active.map((v) => ({
    price: Number(v.price ?? 0),
    stock: Number(v.stock ?? 0),
  }));
  const withPrice = priced.filter((v) => v.price > 0);
  if (withPrice.length === 0) return 0;
  const inStock = withPrice.filter((v) => v.stock > 0);
  const pool = inStock.length > 0 ? inStock : withPrice;
  return Math.min(...pool.map((v) => v.price));
}

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/** True when aggregate stock is at or below threshold (0 = out / very low). */
export function isLowStock(
  stock: number | null | undefined,
  threshold: number = DEFAULT_LOW_STOCK_THRESHOLD
): boolean {
  const n = stock == null ? 0 : Number(stock);
  if (!Number.isFinite(n) || n < 0) return false;
  return n <= threshold;
}
