"use client";

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import type { CartItem } from "@/types/supabase";

const THRESHOLD = 5;

const EMPTY_STOCK_MAP = new Map<number, number>();

type Props = {
  items: CartItem[];
  variantStockById: Map<number, number>;
};

/**
 * POS cart warning for catalog lines where variant stock is below threshold.
 * Logic lives here so the parent page cannot reference an out-of-scope variable.
 */
export function PosLowStockWarning({ items, variantStockById }: Props) {
  const stockMap =
    variantStockById instanceof Map ? variantStockById : EMPTY_STOCK_MAP;

  const lowStockRows = useMemo(() => {
    const safeItems = Array.isArray(items) ? items : [];
    const rows: {
      variantId: number;
      productName: string;
      unitLabel: string;
      stock: number;
    }[] = [];
    for (const item of safeItems) {
      if (item.isFreeGift) continue;
      const stock = stockMap.get(item.variantId);
      if (stock === undefined) continue;
      if (stock < THRESHOLD) {
        rows.push({
          variantId: item.variantId,
          productName: item.productName,
          unitLabel: item.unitLabel,
          stock,
        });
      }
    }
    return { rows, hadItems: safeItems.length > 0 };
  }, [items, stockMap]);

  if (!lowStockRows.hadItems || lowStockRows.rows.length === 0) return null;

  return (
    <div
      role="status"
      className="rounded-lg border border-emerald-200/80 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-800 shadow-sm"
    >
      <div className="flex gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-emerald-900">
            สต็อกต่ำ (คงเหลือต่ำกว่า {THRESHOLD} ชิ้น)
          </p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-zinc-600">
            {lowStockRows.rows.map((row) => (
              <li key={row.variantId}>
                <span className="text-zinc-800">{row.productName}</span>
                {" · "}
                {row.unitLabel}
                {" — "}
                <span className="font-medium text-emerald-800">เหลือ {row.stock}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
