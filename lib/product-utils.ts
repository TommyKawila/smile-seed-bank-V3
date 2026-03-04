import type { ProductVariant } from "@/types/supabase";

export function computeStartingPrice(variants: ProductVariant[]): number {
  const active = variants.filter((v) => v.is_active && v.stock > 0);
  if (active.length === 0) return 0;
  return Math.min(...active.map((v) => v.price));
}

export function computeTotalStock(variants: ProductVariant[]): number {
  return variants.reduce((sum, v) => sum + v.stock, 0);
}

export function isLowStock(totalStock: number): boolean {
  return totalStock <= 5;
}
