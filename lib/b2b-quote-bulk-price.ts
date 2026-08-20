import {
  DEFAULT_EUR_THB,
  getBulkSupplierBook,
  priceSgShareTiers,
  type BulkPricedTier,
  type BulkSupplierSlug,
} from "@/lib/bulk-seeds-book";
import { pickTierForQty } from "@/lib/bulk-share-order";
import { normalizeBreederLabel } from "@/lib/b2b-quote-line";
import { lineTotal, recalculateItem, roundMoney, amountFromEur } from "@/lib/b2b-quote-calc";
import { priceSgfShareTiers } from "@/lib/sgf-seeds-share";
import { B2B_BREEDER_SG, B2B_BREEDER_SGF, type B2BCurrency, type B2BQuoteLineItem } from "@/types/b2b-quote";

export const B2B_BULK_QTY_STEP = 50;

/** Floor qty and enforce the 50-seed minimum. Do not round onto a ×50 grid — SG tiers break at 101 / 251. */
export function clampB2BBulkQty(qty: number): number {
  const n = Math.floor(Number(qty));
  if (!Number.isFinite(n) || n < B2B_BULK_QTY_STEP) return B2B_BULK_QTY_STEP;
  return n;
}

/** +/- 50 UI only. Never use this before pickTierForQty. */
export function snapB2BBulkQty(qty: number): number {
  const n = Math.floor(Number(qty));
  if (!Number.isFinite(n) || n < B2B_BULK_QTY_STEP) return B2B_BULK_QTY_STEP;
  return Math.round(n / B2B_BULK_QTY_STEP) * B2B_BULK_QTY_STEP;
}

export function bulkSupplierSlugFromBreeder(breederName: string): BulkSupplierSlug | null {
  const label = normalizeBreederLabel(breederName);
  if (label === B2B_BREEDER_SGF || label === "Green Future") return "green-future";
  if (label === B2B_BREEDER_SG) return "seeds-genetics";
  return null;
}

function pricedRowsForSlug(slug: BulkSupplierSlug): BulkPricedTier[] {
  const book = getBulkSupplierBook(slug);
  if (!book) return [];
  const opts = {
    book,
    eurThb: DEFAULT_EUR_THB,
    landedPct: book.recommendedLandedPct,
  };
  return slug === "green-future" ? priceSgfShareTiers(opts) : priceSgShareTiers(opts);
}

/** Unit sell from Bulk seeds book (same share ladder as exclusive link). */
export function bulkUnitPriceForBreeder(
  breederName: string,
  qty: number,
  currency: B2BCurrency
): number | null {
  const slug = bulkSupplierSlugFromBreeder(breederName);
  if (!slug) return null;
  const rows = pricedRowsForSlug(slug);
  if (!rows.length) return null;
  const tier = pickTierForQty(rows, clampB2BBulkQty(qty));
  const eur = roundMoney(tier.sellEur, "EUR");
  if (currency === "THB") return roundMoney(tier.sellThb, "THB");
  if (currency === "USD") return roundMoney(amountFromEur(eur, "USD"), "USD");
  return eur;
}

export function isBulkPricedBreeder(breederName: string): boolean {
  return bulkSupplierSlugFromBreeder(breederName) != null;
}

/** Keep entered qty (min 50) and fill unit from the share ladder for SGF / Seeds Genetics. */
export function applyBulkBookPrice(
  item: B2BQuoteLineItem,
  currency: B2BCurrency
): B2BQuoteLineItem {
  const quantity = clampB2BBulkQty(item.quantity);
  const unit = bulkUnitPriceForBreeder(item.breederName, quantity, currency);
  if (unit == null) {
    return recalculateItem({ ...item, quantity }, currency);
  }
  return recalculateItem({ ...item, quantity, unitPrice: unit }, currency);
}

export function emptyBulkPricedLineItem(
  breederName: string = B2B_BREEDER_SGF,
  currency: B2BCurrency = "EUR"
): B2BQuoteLineItem {
  const quantity = B2B_BULK_QTY_STEP;
  const unitPrice = bulkUnitPriceForBreeder(breederName, quantity, currency) ?? 0;
  return {
    id: `tmp-${Math.random().toString(36).slice(2, 10)}`,
    strainName: "",
    breederName,
    quantity,
    unitPrice,
    lineTotal: lineTotal(quantity, unitPrice, currency),
  };
}
