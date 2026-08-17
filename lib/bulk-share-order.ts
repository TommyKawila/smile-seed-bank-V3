import {
  BULK_SUPPLIER_BOOKS,
  priceSgShareTiers,
  SEEDS_GENETICS_SLUG,
  type BulkPricedTier,
  type BulkSupplierSlug,
} from "@/lib/bulk-seeds-book";
import type { BulkSharePayload } from "@/lib/bulk-share-token";
import { priceSgfShareTiers, SGF_SEEDS_SHARE_NAME } from "@/lib/sgf-seeds-share";

export const BULK_SHARE_MIN_QTY = 50;
export const BULK_SHARE_PHOTO_FF_QTY = 1000;

export type BulkSharePricedBook = {
  supplierSlug: BulkSupplierSlug;
  supplierLabel: string;
  rows: BulkPricedTier[];
};

export type BulkShareStrainPick = {
  supplierSlug: BulkSupplierSlug;
  supplierLabel: string;
  strainName: string;
  category: string;
  lockedQty?: number;
};

export type BulkShareCartLine = BulkShareStrainPick & {
  key: string;
  qty: number;
};

export type BulkShareOrderItemInput = {
  supplierSlug: BulkSupplierSlug;
  strainName: string;
  category?: string;
  qty: number;
};

export type BulkSharePricedLine = {
  supplierSlug: BulkSupplierSlug;
  supplierLabel: string;
  strainName: string;
  category: string;
  qty: number;
  unitThb: number;
  unitEur: number;
  lineThb: number;
};

export type BulkShareOrderTotals = {
  seedCount: number;
  subtotalThb: number;
  subtotalEur: number;
  lines: BulkSharePricedLine[];
};

export function cartLineKey(supplierSlug: BulkSupplierSlug, strainName: string): string {
  return `${supplierSlug}|${strainName.trim().toLowerCase()}`;
}

export function isPhotoFfCategory(category: string): boolean {
  return category.toLowerCase() === "photo-ff";
}

export function defaultQtyForCategory(category: string): number {
  return isPhotoFfCategory(category) ? BULK_SHARE_PHOTO_FF_QTY : BULK_SHARE_MIN_QTY;
}

export function pickTierForQty(rows: BulkPricedTier[], qty: number): BulkPricedTier {
  const sorted = [...rows].sort((a, b) => a.minQty - b.minQty);
  let picked = sorted[0]!;
  for (const row of sorted) {
    if (qty >= row.minQty) picked = row;
  }
  return picked;
}

export function supplierLabel(slug: BulkSupplierSlug): string {
  if (slug === "green-future") return SGF_SEEDS_SHARE_NAME;
  const book = BULK_SUPPLIER_BOOKS.find((b) => b.slug === slug);
  return book?.name ?? slug;
}

export function buildPricedBooks(payload: BulkSharePayload): BulkSharePricedBook[] {
  return payload.suppliers
    .map((slug) => {
      const book = BULK_SUPPLIER_BOOKS.find((b) => b.slug === slug);
      if (!book) return null;
      const priceOpts = {
        book,
        eurThb: payload.eurThb,
        landedPct: payload.landed[slug] ?? book.recommendedLandedPct,
        gmOverride: payload.gmOverride,
      };
      const rows =
        slug === "green-future"
          ? priceSgfShareTiers(priceOpts)
          : slug === SEEDS_GENETICS_SLUG
            ? priceSgShareTiers(priceOpts)
            : [];
      return {
        supplierSlug: slug,
        supplierLabel: supplierLabel(slug),
        rows,
      };
    })
    .filter((b): b is BulkSharePricedBook => Boolean(b));
}

function validateQty(qty: number, category: string): string | null {
  const n = Math.floor(qty);
  if (!Number.isFinite(n) || n <= 0) return "Invalid quantity";
  if (isPhotoFfCategory(category)) {
    if (n !== BULK_SHARE_PHOTO_FF_QTY) {
      return `Photo FF must be exactly ${BULK_SHARE_PHOTO_FF_QTY} seeds`;
    }
    return null;
  }
  if (n < BULK_SHARE_MIN_QTY) return `Minimum ${BULK_SHARE_MIN_QTY} seeds per strain`;
  return null;
}

export function priceBulkShareOrder(
  payload: BulkSharePayload,
  items: BulkShareOrderItemInput[]
): { ok: true; totals: BulkShareOrderTotals } | { ok: false; error: string } {
  if (!items.length) return { ok: false, error: "Cart is empty" };

  const books = buildPricedBooks(payload);
  const bookBySlug = new Map(books.map((b) => [b.supplierSlug, b]));
  const lines: BulkSharePricedLine[] = [];

  for (const raw of items) {
    const strainName = raw.strainName.trim();
    if (!strainName) return { ok: false, error: "Missing strain name" };
    if (!payload.suppliers.includes(raw.supplierSlug)) {
      return { ok: false, error: "Supplier not on this offer" };
    }
    const book = bookBySlug.get(raw.supplierSlug);
    if (!book?.rows.length) return { ok: false, error: "Pricing unavailable" };

    const category = (raw.category ?? "").trim();
    const qtyErr = validateQty(raw.qty, category);
    if (qtyErr) return { ok: false, error: qtyErr };

    const qty = isPhotoFfCategory(category) ? BULK_SHARE_PHOTO_FF_QTY : Math.floor(raw.qty);
    const tier = pickTierForQty(book.rows, qty);
    const unitThb = tier.sellThb;
    const unitEur = tier.sellEur;
    const lineThb = unitThb * qty;

    lines.push({
      supplierSlug: raw.supplierSlug,
      supplierLabel: book.supplierLabel,
      strainName,
      category,
      qty,
      unitThb,
      unitEur,
      lineThb,
    });
  }

  const seedCount = lines.reduce((s, l) => s + l.qty, 0);
  const subtotalThb = lines.reduce((s, l) => s + l.lineThb, 0);
  const fx = payload.eurThb > 0 ? payload.eurThb : 1;
  const subtotalEur = subtotalThb / fx;

  return {
    ok: true,
    totals: { seedCount, subtotalThb, subtotalEur, lines },
  };
}

export function serializePricedBooks(books: BulkSharePricedBook[]) {
  return books.map((b) => ({
    supplierSlug: b.supplierSlug,
    supplierLabel: b.supplierLabel,
    rows: b.rows.map((r) => ({
      minQty: r.minQty,
      label: r.label,
      qtyDescription: r.qtyDescription,
      sellThb: r.sellThb,
      sellEur: r.sellEur,
    })),
  }));
}

export type SerializedPricedBook = ReturnType<typeof serializePricedBooks>[number];

export function priceLineFromBook(
  book: SerializedPricedBook,
  qty: number,
  category: string
): { unitThb: number; unitEur: number; lineThb: number } | null {
  const qtyErr = validateQty(qty, category);
  if (qtyErr) return null;
  const n = isPhotoFfCategory(category) ? BULK_SHARE_PHOTO_FF_QTY : Math.floor(qty);
  const tier = pickTierForQty(book.rows as BulkPricedTier[], n);
  return { unitThb: tier.sellThb, unitEur: tier.sellEur, lineThb: tier.sellThb * n };
}
