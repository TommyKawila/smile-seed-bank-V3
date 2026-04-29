"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { InventorySkeleton } from "@/components/skeletons/InventorySkeleton";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  createColumnHelper,
  type ColumnDef,
} from "@tanstack/react-table";
import { Loader2, Plus, ShoppingCart, Search, Trash2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { InventoryDialogs } from "@/components/admin/inventory/InventoryDialogs";
import { InventoryGrid } from "@/components/admin/inventory/InventoryGrid";
import { InventorySearch } from "@/components/admin/inventory/InventorySearch";
import { InventoryStats } from "@/components/admin/inventory/InventoryStats";
import {
  CategoryBadge,
  EditableCell,
  TypeBadge,
  type InventoryRow,
  type ProductGroup,
} from "@/components/admin/inventory/inventory-shared";
import { useProducts } from "@/hooks/useProducts";
import { processAndUploadImages } from "@/lib/supabase/storage-utils";
import { toMasterSku } from "@/lib/sku-utils";
import type { ProductFull } from "@/types/supabase";

const PACK_OPTIONS = ["1 Seed", "3 Seeds", "5 Seeds", "10 Seeds"];

const emptyPack = () => ({ unit_label: "1 Seed", cost_price: 0, price: 0, stock: 0 });

function AdminInventoryContent() {
  const { fetchProductFull } = useProducts({ autoFetch: false });
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string; breeder_id: number | null }[]>([]);
  const [breeders, setBreeders] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [brandId, setBrandId] = useState<string>("");
  const [stockLevel, setStockLevel] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductFull | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<number | null>(null);
  const [addForm, setAddForm] = useState({
    name: "",
    breeder_id: "",
    category_id: "" as string,
    packs: [emptyPack()] as { unit_label: string; cost_price: number; price: number; stock: number }[],
  });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  // ── POS Create Order ──────────────────────────────────────────────────────
  type SearchProduct = { id: number; name: string; master_sku: string | null; brand: string; variants: { id: number; unit_label: string; sku: string | null; price: number; cost_price: number; stock: number }[] };
  type OrderLineItem = { variantId: number; productId: number; productName: string; variantLabel: string; price: number; cost_price: number; maxStock: number; qty: number };
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
  const router = useRouter();
  useEffect(() => {
    const stock = searchParams.get("stock");
    if (stock === "low" || stock === "out") setStockLevel(stock);
  }, [searchParams]);

  const fetchMeta = useCallback(async () => {
    const [invRes, prodsRes, breedRes, catRes] = await Promise.all([
      fetch("/api/admin/inventory", { cache: "no-store" }),
      fetch("/api/admin/products?minimal=1"),
      fetch("/api/admin/breeders"),
      fetch("/api/admin/categories"),
    ]);
    const invData = await invRes.json();
    const prodsData = await prodsRes.json();
    const breedData = await breedRes.json();
    if (Array.isArray(invData)) setRows(invData);
    if (Array.isArray(prodsData)) setProducts(prodsData);
    if (Array.isArray(breedData)) setBreeders(breedData);
    const catData = await catRes.json();
    setCategories(Array.isArray(catData) ? catData : []);
  }, []);

  const refetchInventory = useCallback(async () => {
    const params = new URLSearchParams();
    if (category) params.set("categoryId", category);
    if (typeFilter) params.set("type", typeFilter);
    if (brandId) params.set("brand", brandId);
    if (stockLevel) params.set("stock", stockLevel);
    const res = await fetch(`/api/admin/inventory?${params}`, { cache: "no-store" });
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
    router.refresh();
  }, [category, typeFilter, brandId, stockLevel, router]);

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
    if (!addForm.category_id) {
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
          category_id: addForm.category_id,
          packs: addForm.packs.filter((p) => p.unit_label),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setAddOpen(false);
      setAddForm({ name: "", breeder_id: "", category_id: "", packs: [emptyPack()] });
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

  const handlePhotoUpload = useCallback(async (productId: number, files: FileList | null, previousUrl?: string | null) => {
    if (!files?.[0]) return;
    setUploadingPhoto(productId);
    try {
      const urls = await processAndUploadImages([files[0]], {
        productKey: `id-${productId}`,
        replaceUrls: [previousUrl],
      });
      if (urls[0]) {
        const res = await fetch(`/api/admin/products/${productId}/field`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: urls[0] }),
        });
        if (res.ok) await refetchInventory();
      }
    } finally {
      setUploadingPhoto(null);
    }
  }, [refetchInventory]);

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
      return [...prev, { variantId: variant.id, productId: product.id, productName: product.name, variantLabel: variant.unit_label, price: variant.price, cost_price: variant.cost_price, maxStock: variant.stock, qty: 1 }];
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
      const res = await fetch("/api/admin/orders/simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          items: posLines.map((l) => ({
            variantId: l.variantId,
            productId: l.productId,
            productName: l.productName,
            unitLabel: l.variantLabel,
            quantity: l.qty,
            price: l.price,
          })),
          customer: posNote ? { note: posNote } : undefined,
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

  const grouped = useMemo((): ProductGroup[] => {
    const byProduct = new Map<number, InventoryRow[]>();
    for (const r of rows) {
      const list = byProduct.get(r.product_id) ?? [];
      list.push(r);
      byProduct.set(r.product_id, list);
    }
    return Array.from(byProduct.entries()).map(([product_id, variants]) => {
      const sorted = [...variants].sort((a, b) => {
        if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
        return String(a.unit_label).localeCompare(String(b.unit_label), undefined, { numeric: true });
      });
      const v0 = sorted[0]!;
      return {
        product_id,
        product_name: v0.product_name,
        master_sku: v0.master_sku ?? null,
        brand: v0.brand,
        category: v0.category,
        type: v0.type,
        thc_level: v0.thc_level,
        variants: sorted,
      };
    });
  }, [rows]);

  const filteredGrouped = useMemo((): ProductGroup[] => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return grouped;
    return grouped.filter((grp) => {
      const matchName = (grp.product_name ?? "").toLowerCase().includes(q);
      const matchMasterSku = (grp.master_sku ?? "").toLowerCase().includes(q);
      const matchAnySku = grp.variants.some((v) => (v.sku ?? "").toLowerCase().includes(q));
      return matchName || matchMasterSku || matchAnySku;
    });
  }, [grouped, searchQuery]);

  const columnHelper = createColumnHelper<InventoryRow>();
  const columns = useMemo<ColumnDef<InventoryRow, any>[]>(
    () => [
      columnHelper.display({
        id: "photo",
        header: "Photo",
        cell: ({ row }) => (
          <label className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded border border-zinc-200 bg-zinc-50 hover:bg-zinc-100">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingPhoto === row.original.product_id}
              onChange={(e) =>
                handlePhotoUpload(row.original.product_id, e.target.files, row.original.image_url)
              }
            />
            {uploadingPhoto === row.original.product_id ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
            ) : row.original.image_url ? (
              <img src={row.original.image_url} alt="" className="h-10 w-10 object-cover" />
            ) : (
              <ImagePlus className="h-5 w-5 text-zinc-400" />
            )}
          </label>
        ),
      }),
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
        header: "Stock (สต็อก)",
        cell: ({ row }) => {
          const { stock, low_stock_threshold } = row.original;
          const th = low_stock_threshold ?? 5;
          const low = stock > 0 && stock <= th;
          return (
            <div className={low ? "inline-flex items-center gap-1 rounded bg-red-100/80 px-1.5 py-0.5" : "inline-flex items-center gap-1"}>
              <EditableCell
                value={stock}
                saving={savingId === row.original.id}
                onSave={(v) => patchVariant(row.original.id, { stock: Math.max(0, Math.round(v)) })}
              />
              {low && <span className="text-[10px] font-medium text-red-700 shrink-0" title={`แจ้งต่ำ ≤ ${th}`}>ต่ำ ≤{th}</span>}
            </div>
          );
        },
      }),
      columnHelper.accessor("cost_price", {
        header: "Cost (ต้นทุน)",
        cell: ({ row }) => (
          <EditableCell
            value={row.original.cost_price}
            saving={savingId === row.original.id}
            onSave={(v) => patchVariant(row.original.id, { cost_price: v })}
            prefix="฿"
          />
        ),
      }),
      columnHelper.accessor("price", {
        header: "Price (ราคาขาย)",
        cell: ({ row }) => (
          <EditableCell
            value={row.original.price}
            saving={savingId === row.original.id}
            onSave={(v) => patchVariant(row.original.id, { price: v })}
            prefix="฿"
          />
        ),
      }),
      columnHelper.accessor("margin", {
        header: "Margin %",
        cell: (c) => {
          const val = c.getValue();
          const isNeg = val < 0;
          return (
            <span className={`text-xs ${isNeg ? "text-red-600" : "text-slate-500"}`}>
              {val}%
            </span>
          );
        },
      }),
      columnHelper.accessor("unit_label", { header: "Pack (แพ็ก)", cell: (c) => c.getValue() }),
    ],
    [savingId, uploadingPhoto, patchVariant, handlePhotoUpload, columnHelper]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      <InventoryStats
        rowsCount={rows.length}
        brandId={brandId}
        onOpenPos={() => { setPosOpen(true); setPosSuccess(null); setPosError(null); }}
        onOpenAdd={() => setAddOpen(true)}
      />

      <InventorySearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        category={category}
        setCategory={setCategory}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        brandId={brandId}
        setBrandId={setBrandId}
        stockLevel={stockLevel}
        setStockLevel={setStockLevel}
        categories={categories}
        breeders={breeders}
      />

      <InventoryGrid
        loading={loading}
        rowsLength={rows.length}
        filteredGrouped={filteredGrouped}
        table={table}
        handleEditProduct={handleEditProduct}
        loadingEditId={loadingEditId}
        savingId={savingId}
        patchVariant={patchVariant}
      />

      <InventoryDialogs>
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
                  value={addForm.category_id}
                  onValueChange={(v) => setAddForm((f) => ({ ...f, category_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
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
              <p className="rounded-lg bg-accent px-4 py-3 text-sm font-medium text-primary">{posSuccess}</p>
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
                            className="flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-accent"
                          >
                            <span>{v.unit_label}{v.sku && <span className="ml-1 font-mono text-xs text-zinc-400">({v.sku})</span>}</span>
                            <span className="flex items-center gap-3">
                              <span className="font-semibold text-primary">฿{v.price.toLocaleString()}</span>
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
                        <span className="text-sm font-semibold text-primary">฿{line.price.toLocaleString()}</span>
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
      </InventoryDialogs>

    </div>
  );
}

export default function AdminInventoryPage() {
  return (
    <Suspense fallback={<InventorySkeleton />}>
      <AdminInventoryContent />
    </Suspense>
  );
}
