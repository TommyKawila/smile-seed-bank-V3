"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export type InventoryRow = {
  id: number;
  product_id: number;
  product_name: string;
  image_url?: string | null;
  master_sku?: string | null;
  brand: string;
  breeder_id: number | null;
  unit_label: string;
  sku: string | null;
  stock: number;
  low_stock_threshold?: number;
  cost_price: number;
  price: number;
  margin: number;
  is_active: boolean;
  category: string;
  type: string;
  thc_level: string;
};

export type ProductGroup = {
  product_id: number;
  product_name: string;
  master_sku?: string | null;
  brand: string;
  category: string;
  type: string;
  thc_level: string;
  variants: InventoryRow[];
};

export function CategoryBadge({ value }: { value: string }) {
  if (!value || value === "—") return <span className="text-zinc-400">—</span>;
  const isAuto = value.toLowerCase() === "auto";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        isAuto ? "bg-accent text-primary" : "bg-secondary text-secondary-foreground"
      }`}
    >
      {value}
    </span>
  );
}

export function TypeBadge({ value }: { value: string }) {
  if (!value || value === "—") return <span className="text-zinc-400">—</span>;
  const cls =
    value === "Indica" ? "bg-indigo-100 text-indigo-800" :
    value === "Sativa" ? "bg-amber-100 text-amber-800" :
    "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {value}
    </span>
  );
}

export function EditableCell({
  value,
  saving,
  onSave,
  type = "number",
  prefix,
}: {
  value: number;
  saving: boolean;
  onSave: (v: number) => void;
  type?: "number";
  prefix?: string;
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);

  const commit = () => {
    const n = type === "number" ? parseFloat(local) : value;
    if (!Number.isNaN(n) && n !== value) onSave(n);
  };

  return (
    <div className="flex items-center gap-0.5">
      {prefix && <span className="text-xs text-zinc-400">{prefix}</span>}
      <Input
        type="number"
        className="h-8 w-20 border-0 border-b border-transparent bg-transparent px-1 py-0 text-sm shadow-none focus:border-primary focus:ring-0"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        disabled={saving}
      />
    </div>
  );
}
