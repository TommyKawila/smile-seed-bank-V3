import type { Product } from "@/types/supabase";

function toPct(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function getGeneticPercents(
  product: Pick<Product, "sativa_percent" | "indica_percent" | "sativa_ratio" | "indica_ratio">
): { sativa: number; indica: number } | null {
  let s = toPct(product.sativa_percent);
  let i = toPct(product.indica_percent);
  if (s == null && i == null) {
    s = toPct(product.sativa_ratio);
    i = toPct(product.indica_ratio);
  }
  if (s == null || i == null) return null;
  return { sativa: s, indica: i };
}
