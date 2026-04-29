"use client";

import Link from "next/link";
import { LayoutGrid, Plus, ShoppingCart } from "lucide-react";
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
