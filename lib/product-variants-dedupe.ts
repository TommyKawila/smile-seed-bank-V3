import { parsePackFromUnitLabel } from "@/lib/sku-utils";

/** Minimal shape for catalog/admin variant payloads. */
export type PackDedupeVariant = {
  unit_label: string;
  price?: number | null;
  cost_price?: number | null;
  stock?: number | null;
  clearance_price?: number | null;
  discount_percent?: number | null;
  discount_ends_at?: string | null;
  low_stock_threshold?: number | null;
  is_active?: boolean | null;
  sku?: string | null;
  [key: string]: unknown;
};

/**
 * Collapse duplicate pack sizes to one row per pack.
 * Sums stock; prefers non-zero price/cost; is_active if any row was active.
 * Rows with empty unit_label are kept as-is (draft rows).
 */
export function dedupeVariantsByPack<T extends PackDedupeVariant>(variants: T[]): T[] {
  const empty: T[] = [];
  const byPack = new Map<number, T[]>();

  for (const v of variants) {
    const label = (v.unit_label ?? "").toString().trim();
    if (!label) {
      empty.push(v);
      continue;
    }
    const pack = parsePackFromUnitLabel(label);
    const list = byPack.get(pack) ?? [];
    list.push(v);
    byPack.set(pack, list);
  }

  const merged: T[] = [];
  const packs = [...byPack.keys()].sort((a, b) => a - b);
  for (const pack of packs) {
    const rows = byPack.get(pack)!;
    if (rows.length === 1) {
      merged.push(rows[0]!);
      continue;
    }
    const base = { ...rows[0]! };
    let stock = 0;
    let price = 0;
    let cost = 0;
    let active = false;
    let label = (base.unit_label ?? "").toString().trim();
    let clearance: number | null =
      base.clearance_price != null && Number(base.clearance_price) > 0
        ? Number(base.clearance_price)
        : null;
    let lowThresh =
      base.low_stock_threshold != null ? Number(base.low_stock_threshold) : 5;

    for (const r of rows) {
      stock += Math.max(0, Number(r.stock ?? 0) || 0);
      const p = Number(r.price ?? 0) || 0;
      if (p > 0) price = p;
      const c = Number(r.cost_price ?? 0) || 0;
      if (c > 0) cost = c;
      if (r.is_active !== false) active = true;
      const l = (r.unit_label ?? "").toString().trim();
      if (l) label = l;
      const cp = r.clearance_price != null ? Number(r.clearance_price) : null;
      if (cp != null && cp > 0) clearance = cp;
      if (r.low_stock_threshold != null) lowThresh = Number(r.low_stock_threshold);
    }

    merged.push({
      ...base,
      unit_label: label,
      stock,
      price,
      cost_price: cost,
      is_active: active,
      clearance_price: clearance,
      low_stock_threshold: lowThresh,
    });
  }

  return [...merged, ...empty];
}

export type DbVariantPackRow = {
  id: bigint;
  unit_label: string | null;
  stock: number | null;
  price: number | null;
  cost_price?: number | null;
  sku?: string | null;
  is_active?: boolean | null;
};

/**
 * Pick keeper for duplicate pack rows: prefer active, then highest stock, then highest id.
 */
export function pickKeeperVariantId(rows: DbVariantPackRow[]): bigint {
  const sorted = [...rows].sort((a, b) => {
    const aAct = a.is_active !== false ? 1 : 0;
    const bAct = b.is_active !== false ? 1 : 0;
    if (bAct !== aAct) return bAct - aAct;
    const aStock = Number(a.stock ?? 0);
    const bStock = Number(b.stock ?? 0);
    if (bStock !== aStock) return bStock - aStock;
    return Number(b.id) - Number(a.id);
  });
  return sorted[0]!.id;
}

export type PackCollapseFields = {
  id: bigint;
  stock?: number | null;
  price?: number | null;
  cost_price?: number | null;
  clearance_price?: number | null;
  is_active?: boolean | null;
};

/**
 * Collapse duplicate pack rows onto a keeper before delete.
 * - stock: `stockOverride` when provided (pack-total intent); else sum of all rows
 * - clearance_price: prefer keeper if > 0, else any other row with clearance
 * - price / cost_price: prefer keeper non-zero, else last non-zero from siblings
 */
export function collapsePackDuplicateFields(
  samePack: PackCollapseFields[],
  keeperId: bigint,
  stockOverride?: number | null
): {
  stock: number;
  clearance_price: number | null;
  price: number | null;
  cost_price: number | null;
  dupIds: bigint[];
} {
  const keeper = samePack.find((r) => r.id === keeperId);
  const dups = samePack.filter((r) => r.id !== keeperId);
  const sumStock = samePack.reduce(
    (s, r) => s + Math.max(0, Number(r.stock ?? 0) || 0),
    0
  );
  const stock =
    stockOverride != null && Number.isFinite(Number(stockOverride))
      ? Math.max(0, Math.round(Number(stockOverride)))
      : sumStock;

  let clearance: number | null = null;
  const keeperCp = Number(keeper?.clearance_price ?? 0);
  if (keeperCp > 0) {
    clearance = keeperCp;
  } else {
    for (const r of dups) {
      const cp = Number(r.clearance_price ?? 0);
      if (cp > 0) {
        clearance = cp;
        break;
      }
    }
  }

  const pickPositive = (
    primary: number | null | undefined,
    rows: PackCollapseFields[],
    key: "price" | "cost_price"
  ): number | null => {
    const p = Number(primary ?? 0);
    if (p > 0) return p;
    for (const r of rows) {
      const n = Number(r[key] ?? 0);
      if (n > 0) return n;
    }
    return null;
  };
  const price = pickPositive(keeper?.price, dups, "price");
  const cost = pickPositive(keeper?.cost_price, dups, "cost_price");

  return {
    stock,
    clearance_price: clearance,
    price,
    cost_price: cost,
    dupIds: dups.map((d) => d.id),
  };
}

/** Sum stock across all rows that share a pack size (grid display / sync). */
export function sumStockForPackRows(
  rows: { stock?: number | null }[]
): number {
  return rows.reduce((s, r) => s + Math.max(0, Number(r.stock ?? 0) || 0), 0);
}
