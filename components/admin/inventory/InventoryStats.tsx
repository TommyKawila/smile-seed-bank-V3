"use client";

import Link from "next/link";
import { LayoutGrid, Package, Plus, ShoppingCart, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InventoryStats({
  rowsCount,
  brandId,
  onOpenPos,
  onOpenAdd,
}: {
  rowsCount: number;
  brandId: string;
  onOpenPos: () => void;
  onOpenAdd: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">สต็อกและราคา (Inventory)</h1>
        <p className="text-sm text-zinc-500">{rowsCount} รายการ variant</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenPos}
          className="border-primary/30 text-primary hover:bg-accent"
        >
          <ShoppingCart className="mr-1.5 h-4 w-4" /> สร้างออเดอร์
        </Button>
        <Link href={brandId ? `/admin/inventory/manual?breederId=${brandId}` : "/admin/inventory/manual"}>
          <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-accent">
            <LayoutGrid className="mr-1.5 h-4 w-4" /> Manual Grid
          </Button>
        </Link>
        <Button onClick={onOpenAdd} className="bg-primary text-white hover:bg-primary/90">
          <Plus className="mr-1.5 h-4 w-4" /> เพิ่มสินค้าและแพ็ก (Inventory)
        </Button>
      </div>
    </div>
  );
}

export function ManualInventoryStats({
  strainsCount,
  totalStock,
  selectedCount,
}: {
  strainsCount: number;
  totalStock: number;
  selectedCount: number;
}) {
  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900">Manual Inventory (Spreadsheet)</h1>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <Sprout className="h-3.5 w-3.5 text-primary" />
          {strainsCount} strains
        </span>
        <span className="inline-flex items-center gap-1">
          <Package className="h-3.5 w-3.5 text-primary" />
          {totalStock.toLocaleString("th-TH")} stock
        </span>
        {selectedCount > 0 ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            selected {selectedCount}
          </span>
        ) : null}
      </div>
    </div>
  );
}
