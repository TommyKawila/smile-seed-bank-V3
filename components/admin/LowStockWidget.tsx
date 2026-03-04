"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LowStockItem = {
  stock: number;
  sku: string;
  unit_label: string;
  product_name: string;
  master_sku: string;
  brand: string;
};

export function LowStockWidget() {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard/low-stock", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          สต็อกต่ำ (≤5)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">ไม่มีรายการสต็อกต่ำ</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li
                key={`${item.master_sku}-${item.unit_label}-${i}`}
                className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-zinc-600">{item.master_sku !== "—" ? item.master_sku : item.sku}</p>
                  <p className="truncate text-zinc-700">{item.brand} · {item.product_name}</p>
                </div>
                <span className="ml-2 shrink-0 rounded bg-red-200 px-2 py-0.5 font-semibold text-red-800">
                  {item.stock}
                </span>
              </li>
            ))}
          </ul>
        )}
        {items.length > 0 && (
          <Link
            href="/admin/inventory?stock=low"
            className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-zinc-200 py-2 text-sm font-medium text-primary hover:bg-primary/5"
          >
            ดูทั้งหมดที่ Inventory
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
