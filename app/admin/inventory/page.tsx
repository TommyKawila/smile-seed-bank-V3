"use client";

import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { useSearchParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from "@tanstack/react-table";
import { Loader2, Plus, Filter, Pencil, Wrench, ShoppingCart, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductModal } from "@/components/admin/ProductModal";
import { useProducts } from "@/hooks/useProducts";
import { toMasterSku } from "@/lib/sku-utils";
import type { ProductFull } from "@/types/supabase";

type InventoryRow = {
  id: number;
  product_id: number;
  product_name: string;
  brand: string;
  breeder_id: number | null;
  unit_label: string;
  sku: string | null;
  stock: number;
  cost_price: number;
  price: number;
  margin: number;
  is_active: boolean;
  category: string;
  type: string;
  thc_level: string;
};

type ProductGroup = {
  product_id: number;
  product_name: string;
  brand: string;
  category: string;
  type: string;
  thc_level: string;
  variants: InventoryRow[];
};

const PACK_OPTIONS = ["1 Seed", "3 Seeds", "5 Seeds", "10 Seeds"];

const emptyPack = () => ({ unit_label: "1 Seed", cost_price: 0, price: 0, stock: 0 });

function CategoryBadge({ value }: { value: string }) {
  if (!value || value === "—") return <span className="text-zinc-400">—</span>;
  const isAuto = value.toLowerCase() === "auto";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        isAuto ? "bg-emerald-100 text-emerald-800" : "bg-violet-100 text-violet-800"
      }`}
    >
      {value}
    </span>
  );
}

function TypeBadge({ value }: { value: string }) {
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

function EditableCell({
  value,
  saving,
  onSave,
  type = "number",
}: {
  value: number;
  saving: boolean;
  onSave: (v: number) => void;
  type?: "number";
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);

  const commit = () => {
    const n = type === "number" ? parseFloat(local) : value;
    if (!Number.isNaN(n) && n !== value) onSave(n);
  };

  return (
    <Input
      type="number"
      className="h-8 w-24 border-zinc-200 text-sm"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      disabled={saving}
    />
  );
}

export default function AdminInventoryPage() {
  const { fetchProductFull } = useProducts({ autoFetch: false });
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string; breeder_id: number | null }[]>([]);
  const [breeders, setBreeders] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [brandId, setBrandId] = useState<string>("");
  const [stockLevel, setStockLevel] = useState<string>("");
  const [addOpen, setAddOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductFull | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<number | null>(null);
  const [addForm, setAddForm] = useState({
    name: "",
    breeder_id: "",
    category: "" as "" | "AUTO" | "PHOTO",
    packs: [emptyPack()] as { unit_label: string; cost_price: number; price: number; stock: number }[],
  });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [migrateConfirmOpen, setMigrateConfirmOpen] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<{ updated_products: number; updated_variants: number } | { error: string } | null>(null);

  // ── POS Create Order ──────────────────────────────────────────────────────
  type SearchProduct = { id: number; name: string; master_sku: string | null; brand: string; variants: { id: number; unit_label: string; sku: string | null; price: number; cost_price: number; stock: number }[] };
  type OrderLineItem = { variantId: number; productName: string; variantLabel: string; price: number; cost_price: number; maxStock: number; qty: number };
  const [posOpen, setPosOpen] = useState(false);
  const [posQuery, setPosQuery] = useState("");
  const [posSearching, setPosSearching] = useState(false);
  const [posResults, setPosResults] = useState<SearchProduct[]>([]);
  const [posLines, setPosLines] = useState<OrderLineItem[]>([]);
  const [posNote, setPosNote] = useState("");
  const [posSaving, setPosSaving] = useState(false);
  const [posSuccess, setPosSuccess] = useState<string | null>(null);
  const [posError, setPosError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  useEffect(() => {
    const stock = searchParams.get("stock");
    if (stock === "low" || stock === "out") setStockLevel(stock);
  }, [searchParams]);

  const fetchInventory = useCallback(async () => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (typeFilter) params.set("type", typeFilter);
    if (brandId) params.set("brand", brandId);
    if (stockLevel) params.set("stock", stockLevel);
    const res = await fetch(`/api/admin/inventory?${params}`);
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
    else setRows([]);
  }, [category, typeFilter, brandId, stockLevel]);

  const fetchMeta = useCallback(async () => {
    const [invRes, prodsRes, breedRes] = await Promise.all([
      fetch("/api/admin/inventory"),
      fetch("/api/admin/products"),
      fetch("/api/admin/breeders"),
    ]);
    const invData = await invRes.json();
    const prodsData = await prodsRes.json();
    const breedData = await breedRes.json();
    if (Array.isArray(invData)) setRows(invData);
    if (Array.isArray(prodsData)) setProducts(prodsData);
    if (Array.isArray(breedData)) setBreeders(breedData);
  }, []);

  const refetchInventory = useCallback(async () => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (typeFilter) params.set("type", typeFilter);
    if (brandId) params.set("brand", brandId);
    if (stockLevel) params.set("stock", stockLevel);
    const res = await fetch(`/api/admin/inventory?${params}`);
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  }, [category, typeFilter, brandId, stockLevel]);

  useEffect(() => {
    setLoading(true);
    fetchMeta().finally(() => setLoading(false));
  }, [fetchMeta]);

  useEffect(() => {
    if (!loading) refetchInventory();
  }, [loading, category, typeFilter, brandId, stockLevel, refetchInventory]);

  const patchVariant = useCallback(async (id: number, updates: { stock?: number; cost_price?: number; price?: number }) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/inventory/variants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const next = { ...r, ...updates };
          if (updates.cost_price != null || updates.price != null) {
            next.margin = next.price > 0 ? Math.round(((next.price - next.cost_price) / next.price) * 100) : r.margin;
          }
          return next;
        })
      );
    } finally {
      setSavingId(null);
    }
  }, []);

  const addPack = () => setAddForm((f) => ({ ...f, packs: [...f.packs, emptyPack()] }));
  const setPack = (index: number, field: string, value: string | number) => {
    setAddForm((f) => ({
      ...f,
      packs: f.packs.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
  };
  const removePack = (index: number) => {
    setAddForm((f) => ({ ...f, packs: f.packs.filter((_, i) => i !== index) }));
  };

  const handleAddProduct = async () => {
    if (!addForm.name.trim()) {
      setAddError("กรุณาระบุชื่อสินค้า");
      return;
    }
    if (!addForm.breeder_id) {
      setAddError("กรุณาเลือกแบรนด์");
      return;
    }
    if (!addForm.category) {
      setAddError("กรุณาเลือก Category");
      return;
    }
    if (addForm.packs.length === 0 || addForm.packs.every((p) => !p.unit_label)) {
      setAddError("ต้องมีอย่างน้อย 1 แพ็กเกจ");
      return;
    }
    setAddError(null);
    setAddSaving(true);
    try {
      const res = await fetch("/api/admin/inventory/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name.trim(),
          breeder_id: Number(addForm.breeder_id),
          category: addForm.category,
          packs: addForm.packs.filter((p) => p.unit_label),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setAddOpen(false);
      setAddForm({ name: "", breeder_id: "", category: "", packs: [emptyPack()] });
      await refetchInventory();
    } catch (e) {
      setAddError(String(e).replace("Error: ", ""));
    } finally {
      setAddSaving(false);
    }
  };

  const masterSkuPreview =
    addForm.name.trim() && addForm.breeder_id
      ? toMasterSku(
          breeders.find((b) => String(b.id) === addForm.breeder_id)?.name ?? "BRAND",
          addForm.name.trim()
        )
      : "";

  const handleEditProduct = useCallback(
    async (productId: number) => {
      setLoadingEditId(productId);
      try {
        const full = await fetchProductFull(productId);
        if (full) {
          setEditProduct(full);
          setProductModalOpen(true);
        }
      } finally {
        setLoadingEditId(null);
      }
    },
    [fetchProductFull]
  );

  const handleCloseProductModal = useCallback(() => {
    setProductModalOpen(false);
    setEditProduct(null);
    refetchInventory();
  }, [refetchInventory]);

  // ── POS handlers ─────────────────────────────────────────────────────────
  const searchDebounceRef = { current: 0 };
  const handlePosSearch = useCallback((q: string) => {
    setPosQuery(q);
    clearTimeout(searchDebounceRef.current);
    if (!q.trim()) { setPosResults([]); return; }
    searchDebounceRef.current = window.setTimeout(async () => {
      setPosSearching(true);
      const res = await fetch(`/api/admin/inventory/search?q=${encodeURIComponent(q.trim())}`, { cache: "no-store" });
      const data = await res.json();
      setPosResults(Array.isArray(data) ? data : []);
      setPosSearching(false);
    }, 350);
  }, []);

  const addToOrder = useCallback((product: { id: number; name: string; brand: string }, variant: { id: number; unit_label: string; sku: string | null; price: number; cost_price: number; stock: number }) => {
    setPosLines((prev) => {
      const idx = prev.findIndex((l) => l.variantId === variant.id);
      if (idx >= 0) {
        return prev.map((l, i) => i === idx ? { ...l, qty: Math.min(l.qty + 1, l.maxStock) } : l);
      }
      return [...prev, { variantId: variant.id, productName: product.name, variantLabel: variant.unit_label, price: variant.price, cost_price: variant.cost_price, maxStock: variant.stock, qty: 1 }];
    });
  }, []);

  const removeFromOrder = useCallback((variantId: number) => {
    setPosLines((prev) => prev.filter((l) => l.variantId !== variantId));
  }, []);

  const handleConfirmOrder = useCallback(async () => {
    if (!posLines.length) return;
    setPosSaving(true);
    setPosError(null);
    try {
      const res = await fetch("/api/admin/inventory/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: posLines.map((l) => ({ variantId: l.variantId, quantity: l.qty, price: l.price, cost_price: l.cost_price })),
          note: posNote || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
      setPosSuccess(`✅ สร้างออเดอร์ #${data.orderNumber} สำเร็จ`);
      setPosLines([]);
      setPosQuery("");
      setPosResults([]);
      setPosNote("");
      await refetchInventory();
    } catch (e) {
      setPosError(String(e).replace("Error: ", ""));
    } finally {
      setPosSaving(false);
    }
  }, [posLines, posNote, refetchInventory]);

  const runMigrateSkus = useCallback(async () => {
    setMigrating(true);
    setMigrateResult(null);
    try {
      const res = await fetch("/api/admin/inventory/migrate-skus", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMigrateResult({ error: data.error ?? "Migration failed" });
        return;
      }
      setMigrateResult({ updated_products: data.updated_products ?? 0, updated_variants: data.updated_variants ?? 0 });
      await refetchInventory();
    } catch (e) {
      setMigrateResult({ error: String(e) });
    } finally {
      setMigrating(false);
    }
  }, [refetchInventory]);

  const grouped = useMemo((): ProductGroup[] => {
    const byProduct = new Map<number, InventoryRow[]>();
    for (const r of rows) {
      const list = byProduct.get(r.product_id) ?? [];
      list.push(r);
      byProduct.set(r.product_id, list);
    }
    return Array.from(byProduct.entries()).map(([product_id, variants]) => {
      const v0 = variants[0]!;
      return {
        product_id,
        product_name: v0.product_name,
        brand: v0.brand,
        category: v0.category,
        type: v0.type,
        thc_level: v0.thc_level,
        variants,
      };
    });
  }, [rows]);

  const columnHelper = createColumnHelper<InventoryRow>();
  const columns = useMemo<ColumnDef<InventoryRow, unknown>[]>(
    () => [
      columnHelper.accessor("product_name", { header: "สินค้า / Strain", cell: (c) => c.getValue() }),
      columnHelper.accessor("brand", { header: "แบรนด์", cell: (c) => c.getValue() }),
      columnHelper.accessor("category", { header: "Category", cell: (c) => <CategoryBadge value={c.getValue()} /> }),
      columnHelper.accessor("type", { header: "Type", cell: (c) => <TypeBadge value={c.getValue()} /> }),
      columnHelper.accessor("thc_level", { header: "THC %", cell: (c) => <span className="text-xs">{c.getValue()}</span> }),
      columnHelper.accessor("sku", {
        id: "sku",
        header: "SKU",
        cell: (c) => <span className="font-mono text-xs">{c.getValue() ?? "—"}</span>,
      }),
      columnHelper.accessor("stock", {
        header: "สต็อก",
        cell: ({ row }) => {
          const stock = row.original.stock;
          const low = stock <= 5;
          return (
            <div className={low ? "rounded bg-red-100 px-1.5 py-0.5" : ""}>
              <EditableCell
                value={stock}
                saving={savingId === row.original.id}
                onSave={(v) => patchVariant(row.original.id, { stock: Math.max(0, Math.round(v)) })}
              />
              {low && <span className="ml-1 text-xs font-medium text-red-700">ต่ำ</span>}
            </div>
          );
        },
      }),
      columnHelper.accessor("cost_price", {
        header: "ต้นทุน",
        cell: ({ row }) => (
          <EditableCell
            value={row.original.cost_price}
            saving={savingId === row.original.id}
            onSave={(v) => patchVariant(row.original.id, { cost_price: v })}
          />
        ),
      }),
      columnHelper.accessor("price", {
        header: "ราคาขาย",
        cell: ({ row }) => (
          <EditableCell
            value={row.original.price}
            saving={savingId === row.original.id}
            onSave={(v) => patchVariant(row.original.id, { price: v })}
          />
        ),
      }),
      columnHelper.accessor("margin", {
        header: "Margin %",
        cell: (c) => (
          <span className={c.getValue() >= 0 ? "text-emerald-600" : "text-red-600"}>
            {c.getValue()}%
          </span>
        ),
      }),
      columnHelper.accessor("unit_label", { header: "แพ็ก", cell: (c) => c.getValue() }),
    ],
    [savingId, patchVariant, columnHelper]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">สต็อกและราคา (Inventory)</h1>
          <p className="text-sm text-zinc-500">{rows.length} รายการ variant</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setMigrateConfirmOpen(true); setMigrateResult(null); }}
            disabled={migrating}
            className="text-zinc-600"
          >
            {migrating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Wrench className="mr-1.5 h-4 w-4" />}
            Standardize SKUs
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setPosOpen(true); setPosSuccess(null); setPosError(null); }}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <ShoppingCart className="mr-1.5 h-4 w-4" /> สร้างออเดอร์
          </Button>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Plus className="mr-1.5 h-4 w-4" /> เพิ่มสินค้าและแพ็ก (Inventory)
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" /> กรอง
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="PHOTO">Photo</SelectItem>
                <SelectItem value="AUTO">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="Indica">Indica</SelectItem>
                <SelectItem value="Sativa">Sativa</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">แบรนด์</Label>
            <Select value={brandId || "all"} onValueChange={(v) => setBrandId(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {breeders.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">สต็อก</Label>
            <Select value={stockLevel || "all"} onValueChange={(v) => setStockLevel(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="low">ต่ำ (≤5)</SelectItem>
                <SelectItem value="out">หมด</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} className="border-b bg-zinc-50">
                      {hg.headers.map((h) => (
                        <th key={h.id} className="px-4 py-3 text-left font-medium text-zinc-700">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {grouped.map((grp) => (
                    <Fragment key={grp.product_id}>
                      <tr className="border-b bg-zinc-100/80 font-medium">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-900">{grp.product_name}</span>
                            <button
                              type="button"
                              onClick={() => handleEditProduct(grp.product_id)}
                              disabled={loadingEditId === grp.product_id}
                              className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-800 disabled:opacity-50"
                              title="แก้ไขสินค้า"
                            >
                              {loadingEditId === grp.product_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Pencil className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">{grp.brand}</td>
                        <td className="px-4 py-2.5"><CategoryBadge value={grp.category} /></td>
                        <td className="px-4 py-2.5"><TypeBadge value={grp.type} /></td>
                        <td className="px-4 py-2.5 text-xs">{grp.thc_level}</td>
                        <td colSpan={6} className="px-4 py-2.5 text-xs text-zinc-500">{grp.variants.length} SKU(s)</td>
                      </tr>
                      {grp.variants.map((v) => (
                        <tr
                          key={v.id}
                          className={`border-b hover:bg-zinc-50/50 ${v.stock === 0 ? "bg-red-50" : ""}`}
                        >
                          <td className="pl-8 pr-4 py-2 text-zinc-500">↳ {v.unit_label}</td>
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2 font-mono text-xs">{v.sku ?? "—"}</td>
                          <td className="px-4 py-2">
                            <div className={v.stock <= 5 ? "inline-flex items-center gap-1.5 rounded bg-red-100 px-2 py-1" : ""}>
                              <EditableCell
                                value={v.stock}
                                saving={savingId === v.id}
                                onSave={(val) => patchVariant(v.id, { stock: Math.max(0, Math.round(val)) })}
                              />
                              {v.stock <= 5 && <span className="text-xs font-medium text-red-700">ต่ำ</span>}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <EditableCell
                              value={v.cost_price}
                              saving={savingId === v.id}
                              onSave={(val) => patchVariant(v.id, { cost_price: val })}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <EditableCell
                              value={v.price}
                              saving={savingId === v.id}
                              onSave={(val) => patchVariant(v.id, { price: val })}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <span className={v.margin >= 0 ? "text-emerald-600" : "text-red-600"}>{v.margin}%</span>
                          </td>
                          <td className="px-4 py-2">{v.unit_label}</td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && rows.length === 0 && (
            <div className="py-12 text-center text-zinc-500">ไม่มี variant ในระบบ หรือกรองแล้วไม่ตรง</div>
          )}
        </CardContent>
      </Card>

      {/* Add New Product & Variants Modal */}
      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) setAddError(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>เพิ่มสินค้าและแพ็ก (Inventory-First)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อสินค้า (Strain) *</Label>
              <Input
                placeholder="เช่น Lemon Mandarin"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>แบรนด์ *</Label>
                <Select
                  value={addForm.breeder_id}
                  onValueChange={(v) => setAddForm((f) => ({ ...f, breeder_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกแบรนด์" />
                  </SelectTrigger>
                  <SelectContent>
                    {breeders.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={addForm.category}
                  onValueChange={(v) => setAddForm((f) => ({ ...f, category: v as "AUTO" | "PHOTO" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auto / Photo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO">Auto</SelectItem>
                    <SelectItem value="PHOTO">Photo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {masterSkuPreview && (
              <p className="rounded bg-zinc-100 px-3 py-2 font-mono text-xs text-zinc-600">
                Master SKU: {masterSkuPreview} (variants: …-1, …-3, …-5 ฯลฯ)
              </p>
            )}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>แพ็กเกจ (ขนาด / ต้นทุน / ราคา / สต็อก) *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPack}>
                  <Plus className="mr-1 h-3 w-3" /> เพิ่มแพ็ก
                </Button>
              </div>
              <div className="space-y-2">
                {addForm.packs.map((p, i) => (
                  <div key={i} className="flex flex-wrap items-end gap-2 rounded border border-zinc-200 p-2">
                    <div className="w-24">
                      <Label className="text-xs">ขนาด</Label>
                      <Select
                        value={p.unit_label}
                        onValueChange={(v) => setPack(i, "unit_label", v)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PACK_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20">
                      <Label className="text-xs">ต้นทุน</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        className="h-8"
                        value={p.cost_price || ""}
                        onChange={(e) => setPack(i, "cost_price", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="w-20">
                      <Label className="text-xs">ราคา</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        className="h-8"
                        value={p.price || ""}
                        onChange={(e) => setPack(i, "price", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="w-16">
                      <Label className="text-xs">สต็อก</Label>
                      <Input
                        type="number"
                        min={0}
                        className="h-8"
                        value={p.stock || ""}
                        onChange={(e) => setPack(i, "stock", parseInt(e.target.value, 10) || 0)}
                      />
                    </div>
                    {addForm.packs.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" className="h-8 text-red-500" onClick={() => removePack(i)}>
                        ลบ
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {addError && (
            <p className="text-sm text-red-600">{addError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleAddProduct} disabled={addSaving}>
              {addSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              บันทึก (สร้างสินค้า + แพ็ก)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductModal
        open={productModalOpen}
        initialData={editProduct}
        onClose={handleCloseProductModal}
      />

      {/* POS – Create Order Modal */}
      <Dialog open={posOpen} onOpenChange={(open) => { if (!posSaving) { setPosOpen(open); if (!open) { setPosSuccess(null); setPosError(null); } } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" /> สร้างออเดอร์ (Admin POS)
            </DialogTitle>
          </DialogHeader>

          {posSuccess ? (
            <div className="space-y-4">
              <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{posSuccess}</p>
              <DialogFooter>
                <Button onClick={() => { setPosSuccess(null); setPosOpen(false); }}>ปิด</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search */}
              <div className="space-y-2">
                <Label>ค้นหาสินค้า (ชื่อหรือ Master SKU)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    className="pl-9"
                    placeholder="เช่น Lemon Mandarin หรือ 420FASTBUDS-LEMON"
                    value={posQuery}
                    onChange={(e) => handlePosSearch(e.target.value)}
                  />
                  {posSearching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-400" />}
                </div>

                {/* Search results */}
                {posResults.length > 0 && (
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
                    {posResults.map((prod) => (
                      <div key={prod.id} className="border-b last:border-0">
                        <div className="bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-600">
                          {prod.brand} · {prod.name}
                          {prod.master_sku && <span className="ml-2 font-mono text-zinc-400">{prod.master_sku}</span>}
                        </div>
                        {prod.variants.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => addToOrder(prod, v)}
                            className="flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-emerald-50"
                          >
                            <span>{v.unit_label}{v.sku && <span className="ml-1 font-mono text-xs text-zinc-400">({v.sku})</span>}</span>
                            <span className="flex items-center gap-3">
                              <span className="font-semibold text-emerald-700">฿{v.price.toLocaleString()}</span>
                              <span className={`text-xs ${v.stock <= 5 ? "text-red-600 font-medium" : "text-zinc-400"}`}>สต็อก {v.stock}</span>
                              <Plus className="h-4 w-4 text-zinc-400" />
                            </span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order lines */}
              {posLines.length > 0 && (
                <div className="space-y-2">
                  <Label>รายการที่สั่ง</Label>
                  <div className="rounded-lg border border-zinc-200">
                    {posLines.map((line) => (
                      <div key={line.variantId} className="flex items-center gap-3 border-b px-3 py-2 last:border-0">
                        <div className="min-w-0 flex-1 text-sm">
                          <span className="font-medium">{line.productName}</span>
                          <span className="ml-2 text-zinc-500">{line.variantLabel}</span>
                        </div>
                        <span className="text-sm font-semibold text-emerald-700">฿{line.price.toLocaleString()}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="flex h-7 w-7 items-center justify-center rounded border text-zinc-600 hover:bg-zinc-100"
                            onClick={() => setPosLines((prev) => prev.map((l) => l.variantId === line.variantId ? { ...l, qty: Math.max(1, l.qty - 1) } : l))}
                          >−</button>
                          <input
                            type="number"
                            min={1}
                            max={line.maxStock}
                            value={line.qty}
                            onChange={(e) => {
                              const v = Math.max(1, Math.min(line.maxStock, parseInt(e.target.value, 10) || 1));
                              setPosLines((prev) => prev.map((l) => l.variantId === line.variantId ? { ...l, qty: v } : l));
                            }}
                            className="h-7 w-12 rounded border text-center text-sm"
                          />
                          <button
                            type="button"
                            className="flex h-7 w-7 items-center justify-center rounded border text-zinc-600 hover:bg-zinc-100"
                            onClick={() => setPosLines((prev) => prev.map((l) => l.variantId === line.variantId ? { ...l, qty: Math.min(l.maxStock, l.qty + 1) } : l))}
                          >+</button>
                        </div>
                        <span className="w-20 text-right text-sm font-bold">฿{(line.price * line.qty).toLocaleString()}</span>
                        <button type="button" onClick={() => removeFromOrder(line.variantId)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex justify-between px-3 py-2 text-sm font-bold text-zinc-800">
                      <span>ยอดรวม</span>
                      <span>฿{posLines.reduce((s, l) => s + l.price * l.qty, 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Note */}
              <div className="space-y-2">
                <Label>หมายเหตุ (ไม่บังคับ)</Label>
                <Input placeholder="ชื่อลูกค้า / ช่องทาง / อื่นๆ" value={posNote} onChange={(e) => setPosNote(e.target.value)} />
              </div>

              {posError && <p className="text-sm text-red-600">{posError}</p>}

              <DialogFooter>
                <Button variant="outline" onClick={() => setPosOpen(false)} disabled={posSaving}>ยกเลิก</Button>
                <Button
                  onClick={handleConfirmOrder}
                  disabled={posSaving || posLines.length === 0}
                  className="bg-primary text-white"
                >
                  {posSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                  ยืนยันออเดอร์
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Migrate SKUs confirmation */}
      <Dialog open={migrateConfirmOpen} onOpenChange={(open) => { if (!migrating) setMigrateConfirmOpen(open); if (!open) setMigrateResult(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Standardize All SKUs</DialogTitle>
          </DialogHeader>
          {!migrateResult ? (
            <>
              <p className="text-sm text-zinc-600">
                {migrating
                  ? "Migrating… Please wait."
                  : "This will rewrite all product Master SKUs and variant SKUs to the new UPPERCASE format (e.g. 420FASTBUDS-RAINBOW-MELON-1). Existing values will be overwritten. Continue?"}
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMigrateConfirmOpen(false)} disabled={migrating}>
                  Cancel
                </Button>
                <Button onClick={runMigrateSkus} disabled={migrating}>
                  {migrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Run migration
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              {"error" in migrateResult ? (
                <p className="text-sm text-red-600">{migrateResult.error}</p>
              ) : (
                <p className="text-sm text-emerald-600">
                  Done. Updated {migrateResult.updated_products} products and {migrateResult.updated_variants} variants.
                </p>
              )}
              <DialogFooter>
                <Button onClick={() => { setMigrateConfirmOpen(false); setMigrateResult(null); }}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
