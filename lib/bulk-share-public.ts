import type { BulkSupplierSlug } from "@/lib/bulk-seeds-labels";

/** Client-safe bulk-share cart/pricing display. Sell tiers only — no cost books. */

export const BULK_SHARE_MIN_QTY = 50;

export type BulkShareSellTier = {
  minQty: number;
  label: string;
  qtyDescription: string;
  sellThb: number;
  sellEur: number;
};

export type SerializedPricedBook = {
  supplierSlug: BulkSupplierSlug;
  supplierLabel: string;
  rows: BulkShareSellTier[];
};

export type BulkShareStrainPick = {
  supplierSlug: BulkSupplierSlug;
  supplierLabel: string;
  strainName: string;
  category: string;
};

export type BulkShareCartLine = BulkShareStrainPick & {
  key: string;
  qty: number;
};

export function cartLineKey(supplierSlug: BulkSupplierSlug, strainName: string): string {
  return `${supplierSlug}|${strainName.trim().toLowerCase()}`;
}

export function pickTierForQty<T extends { minQty: number }>(rows: T[], qty: number): T {
  const sorted = [...rows].sort((a, b) => a.minQty - b.minQty);
  let picked = sorted[0]!;
  for (const row of sorted) {
    if (qty >= row.minQty) picked = row;
  }
  return picked;
}

export function validateBulkShareQty(qty: number): string | null {
  const n = Math.floor(qty);
  if (!Number.isFinite(n) || n <= 0) return "Invalid quantity";
  if (n < BULK_SHARE_MIN_QTY) return `Minimum ${BULK_SHARE_MIN_QTY} seeds per strain`;
  return null;
}

export function priceLineFromBook(
  book: SerializedPricedBook,
  qty: number,
  _category: string
): { unitThb: number; unitEur: number; lineThb: number } | null {
  const qtyErr = validateBulkShareQty(qty);
  if (qtyErr) return null;
  const n = Math.floor(qty);
  const tier = pickTierForQty(book.rows, n);
  return { unitThb: tier.sellThb, unitEur: tier.sellEur, lineThb: tier.sellThb * n };
}
