"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Link2, ChevronLeft, Plus, X, Search, ImagePlus, Trash2, Settings2, FileText } from "lucide-react";
import { Fragment } from "react";
import { toBreederPrefix, toProductPart } from "@/lib/sku-utils";
import { processAndUploadImages } from "@/lib/supabase/storage-utils";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveQuotationHandoff, type QuotationHandoffItem } from "@/lib/quotation-grid-handoff";

const DEFAULT_PACKS = [1, 2, 3, 5];

function normalizeByPack(
  raw: unknown,
  packSizes: number[]
): Record<number, { stock: number; cost: number; price: number }> {
  const out: Record<number, { stock: number; cost: number; price: number }> = {};
  const obj = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  for (const k of Object.keys(obj)) {
    const p = parseInt(k, 10);
    if (Number.isNaN(p) || p < 1 || p > 99) continue;
    const cell = obj[k];
    const c = cell && typeof cell === "object" ? (cell as Record<string, unknown>) : {};
    out[p] = {
      stock: Number(c.stock) || 0,
      cost: Number(c.cost) || 0,
      price: Number(c.price) || 0,
    };
  }
  for (const packSize of packSizes) {
    if (!(packSize in out)) out[packSize] = { stock: 0, cost: 0, price: 0 };
  }
  return out;
}

type Category = { id: string; name: string };
type Breeder = { id: number; name: string; logo_url?: string | null; allowed_packages: number[] | { sizes: number[]; active: number[] } | null };
type PackagesConfig = { sizes: number[]; active: number[] };
const STRAIN_DOMINANCE_OPTIONS = ["Mostly Indica", "Mostly Sativa", "Hybrid 50/50"] as const;

type GridRow = {
  productId: number;
  masterSku: string;
  name: string;
  imageUrl?: string | null;
  strainDominance?: string | null;
  category: string;
  productCategory?: { id: string; name: string } | null;
  categoryId?: string;
  thcPercent?: number | null;
  terpenes?: string | null;
  packs: number[];
  byPack: Record<number, { stock: number; cost: number; price: number }>;
  variantIdsByPack?: Record<number, number | null>;
  lowStockThresholdByPack?: Record<number, number>;
  isNew?: boolean;
};

function EditableCell({
  value,
  saving,
  onSave,
  prefix,
  bold,
  align = "left",
}: {
  value: number;
  saving: boolean;
  onSave: (v: number) => void;
  prefix?: string;
  bold?: boolean;
  align?: "left" | "right";
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);

  const commit = () => {
    const n = parseFloat(local);
    if (!Number.isNaN(n) && n !== value) onSave(n);
  };

  return (
    <div className={`flex items-center gap-0.5 ${align === "right" ? "justify-end" : ""}`}>
      {prefix && <span className="text-[10px] text-slate-400">{prefix}</span>}
      <Input
        type="number"
        className={`h-7 w-14 border-0 border-b border-transparent bg-transparent px-1 py-0 text-sm shadow-none focus:border-emerald-500 focus:ring-0 ${bold ? "font-semibold text-slate-800" : "text-slate-600"}`}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        disabled={saving}
      />
    </div>
  );
}

export default function ManualInventoryPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [breeders, setBreeders] = useState<Breeder[]>([]);
  const [breederId, setBreederId] = useState<string>("");
  const [category, setCategory] = useState("all");
  const [dominance, setDominance] = useState("all");
  const [packagesConfig, setPackagesConfig] = useState<PackagesConfig>({ sizes: [1, 2, 3, 5], active: [1, 2, 3, 5] });
  const [rows, setRows] = useState<GridRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const [configSaving, setConfigSaving] = useState(false);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [customPackInput, setCustomPackInput] = useState("");
  const [exporting, setExporting] = useState<"png" | "pdf" | null>(null);
  const [editingThreshold, setEditingThreshold] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [lineId, setLineId] = useState<string>("");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const exportRef = useRef<HTMLDivElement>(null);
  const { settings } = useSiteSettings();

  useEffect(() => {
    QRCode.toDataURL("https://www.smileseedbank.com", { width: 256, margin: 2, color: { dark: "#047857", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/admin/settings/payment")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d?.lineId && setLineId(String(d.lineId)))
      .catch(() => {});
  }, []);

  const packs = useMemo(() => [...packagesConfig.active].sort((a, b) => a - b), [packagesConfig.active]);
  const totalStockForRow = useCallback((row: GridRow) => {
    return packs.reduce((sum, pk) => sum + (row.byPack?.[pk]?.stock ?? 0), 0);
  }, [packs]);

  const toggleSelectRow = useCallback((productId: number) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }, []);

  const visibleRows = useMemo(() => {
    const hasLowStock = (r: GridRow) =>
      packs.some((pk) => {
        const stock = r.byPack?.[pk]?.stock ?? 0;
        const th = r.lowStockThresholdByPack?.[pk] ?? 5;
        return stock > 0 && stock <= th;
      });
    let list = rows;
    if (hideOutOfStock) {
      list = list.filter((r) => totalStockForRow(r) > 0 || r.isNew);
    }
    if (lowStockOnly) {
      list = list.filter((r) => hasLowStock(r) || r.isNew);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          (r.name ?? "").toLowerCase().includes(q) ||
          (r.masterSku ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [rows, hideOutOfStock, lowStockOnly, totalStockForRow, searchQuery, packs]);

  const toggleSelectAll = useCallback(() => {
    const selectable = visibleRows.filter((r) => !r.isNew).map((r) => r.productId);
    const allSelected = selectable.length > 0 && selectable.every((id) => selectedProductIds.has(id));
    setSelectedProductIds(allSelected ? new Set() : new Set(selectable));
  }, [visibleRows, selectedProductIds]);

  const goToQuotationBuilder = useCallback(() => {
    const selectedRows = rows.filter((r) => selectedProductIds.has(r.productId) && !r.isNew);
    if (selectedRows.length === 0) return;
    const breederName = breeders.find((b) => String(b.id) === breederId)?.name ?? "";
    const items: QuotationHandoffItem[] = selectedRows.map((r) => {
      const packKeys = r.packs?.length
        ? [...r.packs].sort((a, b) => a - b)
        : Object.keys(r.byPack || {})
            .map((k) => Number(k))
            .filter((n) => !Number.isNaN(n) && n > 0)
            .sort((a, b) => a - b);
      const byPack: QuotationHandoffItem["byPack"] = {};
      for (const pk of packKeys) {
        const cell = r.byPack[pk] ?? { stock: 0, cost: 0, price: 0 };
        const variantId = r.variantIdsByPack?.[pk] ?? 0;
        byPack[String(pk)] = {
          variantId,
          stock: cell.stock,
          price: cell.price,
          unitLabel: pk === 1 ? "1 Seed" : `${pk} Seeds`,
        };
      }
      return {
        productId: r.productId,
        masterSku: r.masterSku,
        name: r.name,
        imageUrl: r.imageUrl ?? null,
        packs: packKeys,
        byPack,
        breederName,
      };
    });
    saveQuotationHandoff({ v: 1, source: "grid", items });
    setSelectedProductIds(new Set());
    router.push("/admin/quotations/new?from=grid");
  }, [rows, selectedProductIds, breeders, breederId, router]);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const safeJson = async <T,>(res: Response): Promise<T | null> => {
    const text = await res.text();
    if (!text.trim()) return null;
    try {
      return JSON.parse(text) as T;
    } catch {
      console.error("[fetch] Invalid JSON response:", text.slice(0, 200));
      return null;
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) {
        console.error("[fetchCategories]", res.status, res.statusText);
        setFetchError(`โหลดหมวดหมู่ไม่สำเร็จ (${res.status})`);
        return;
      }
      const data = await safeJson<unknown[]>(res);
      if (Array.isArray(data)) {
        setCategories(data.map((c: { id: string; name: string }) => ({ id: String(c.id), name: c.name })));
      }
    } catch (err) {
      console.error("[fetchCategories]", err);
      setFetchError("โหลดหมวดหมู่ไม่สำเร็จ");
    }
  }, []);

  const fetchBreeders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/breeders");
      if (!res.ok) {
        console.error("[fetchBreeders]", res.status, res.statusText);
        setFetchError(`โหลด Breeder ไม่สำเร็จ (${res.status})`);
        return;
      }
      const data = await safeJson<unknown[]>(res);
      if (Array.isArray(data)) {
      setBreeders(
        data
          .filter((b: { id?: unknown; name?: string }) => b.id != null && b.name != null && b.name !== "")
          .map((b: { id: number | bigint; name: string; logo_url?: string | null; allowed_packages?: unknown }) => {
            let ap = b.allowed_packages;
            if (typeof ap === "string") ap = JSON.parse(ap || "[]");
            if (!ap) ap = [1, 2, 3, 5];
            return { id: Number(b.id), name: String(b.name), logo_url: b.logo_url ?? null, allowed_packages: ap };
          })
      );
    }
    } catch (err) {
      console.error("[fetchBreeders]", err);
      setFetchError("โหลด Breeder ไม่สำเร็จ");
    }
  }, []);

  const fetchGrid = useCallback(async () => {
    if (!breederId) {
      setRows([]);
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({ breederId });
      if (category && category !== "all") params.set("categoryId", category);
      if (dominance && dominance !== "all") params.set("dominance", dominance);
      const res = await fetch(`/api/admin/inventory/grid?${params}`);
      if (!res.ok) {
        const errText = await res.text();
        console.error("[fetchGrid]", res.status, res.statusText, errText);
        setFetchError(`โหลดตารางไม่สำเร็จ (${res.status})`);
        return;
      }
      const data = await safeJson<{ rows?: GridRow[]; packagesConfig?: { sizes?: number[]; active?: number[] }; allowedPackages?: number[] }>(res);
      if (data?.rows) {
        console.log("[fetchGrid] raw response rows (first 2):", data.rows.slice(0, 2).map((r) => ({ productId: r.productId, byPack: r.byPack })));
        const packSizes = data.packagesConfig?.sizes ?? data.packagesConfig?.active ?? data.allowedPackages ?? DEFAULT_PACKS;
        const arr = Array.isArray(packSizes) ? packSizes : [];
        const normalized = data.rows.map((r) => {
          const byPack = normalizeByPack(r.byPack, arr.length ? arr : DEFAULT_PACKS);
          const variantIdsByPack: Record<number, number | null> = {};
          const lowStockThresholdByPack: Record<number, number> = {};
          const raw = (r as { variantIdsByPack?: Record<string, number | null>; lowStockThresholdByPack?: Record<string, number> }).variantIdsByPack;
          const rawTh = (r as { lowStockThresholdByPack?: Record<string, number> }).lowStockThresholdByPack;
          for (const p of arr.length ? arr : DEFAULT_PACKS) {
            variantIdsByPack[p] = raw?.[String(p)] ?? raw?.[p] ?? null;
            lowStockThresholdByPack[p] = rawTh?.[String(p)] ?? rawTh?.[p] ?? 5;
          }
          return { ...r, byPack, variantIdsByPack, lowStockThresholdByPack };
        });
        setRows(normalized);
      }
      if (data?.packagesConfig?.sizes?.length) {
        setPackagesConfig({ sizes: data.packagesConfig.sizes, active: data.packagesConfig.active ?? data.packagesConfig.sizes });
      } else if (data?.allowedPackages?.length) {
        const arr = data.allowedPackages;
        setPackagesConfig({ sizes: arr, active: arr });
      }
    } catch (err) {
      console.error("[fetchGrid]", err);
      setFetchError("โหลดตารางไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [breederId, category, dominance]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    fetchBreeders();
    fetchCategories();
  }, [fetchBreeders, fetchCategories]);

  useEffect(() => {
    const q = searchParams.get("breederId");
    if (q) setBreederId(q);
  }, [searchParams]);

  useEffect(() => {
    fetchGrid();
  }, [fetchGrid]);

  useEffect(() => {
    if (breederId && breeders.length) {
      const b = breeders.find((x) => String(x.id) === breederId);
      const ap = b?.allowed_packages;
      if (ap) {
        if (Array.isArray(ap)) setPackagesConfig({ sizes: ap, active: ap });
        else if (ap && typeof ap === "object" && "sizes" in ap) setPackagesConfig({ sizes: ap.sizes, active: ap.active ?? ap.sizes });
      }
    }
  }, [breederId, breeders]);

  const togglePack = (pack: number) => {
    const isActive = packagesConfig.active.includes(pack);
    const nextActive = isActive
      ? packagesConfig.active.filter((p) => p !== pack)
      : [...packagesConfig.active, pack].sort((a, b) => a - b);
    if (nextActive.length === 0) return;
    setPackagesConfig({ ...packagesConfig, active: nextActive });
  };

  const removePack = (pack: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSizes = packagesConfig.sizes.filter((p) => p !== pack);
    const nextActive = packagesConfig.active.filter((p) => p !== pack);
    if (nextSizes.length === 0) return;
    setPackagesConfig({ sizes: nextSizes, active: nextActive });
  };

  const addCustomPack = () => {
    const n = parseInt(customPackInput, 10);
    if (n >= 1 && n <= 99 && !packagesConfig.sizes.includes(n)) {
      const nextSizes = [...packagesConfig.sizes, n].sort((a, b) => a - b);
      const nextActive = [...packagesConfig.active, n].sort((a, b) => a - b);
      setPackagesConfig({ sizes: nextSizes, active: nextActive });
      setCustomPackInput("");
    }
  };

  const selectedBreeder = useMemo(
    () => breeders.find((b) => String(b.id) === breederId),
    [breeders, breederId]
  );

  const addNewStrain = () => {
    const packsToUse = packs.length ? packs : DEFAULT_PACKS;
    const byPack: Record<number, { stock: number; cost: number; price: number }> = {};
    const variantIdsByPack: Record<number, number | null> = {};
    for (const p of packsToUse) {
      byPack[p] = { stock: 0, cost: 0, price: 0 };
      variantIdsByPack[p] = null;
    }
    const cat = category === "all" ? categories[0] : categories.find((c) => c.id === category);
    const newRow: GridRow = {
      productId: -Date.now(),
      masterSku: "",
      name: "",
      imageUrl: null,
      category: cat?.name ?? "",
      categoryId: cat?.id ?? "",
      packs: [...packsToUse],
      byPack,
      variantIdsByPack,
      lowStockThresholdByPack: Object.fromEntries(packsToUse.map((p) => [p, 5])),
      isNew: true,
    };
    setRows((prev) => [...prev, newRow]);
  };

  const updateRow = (rowId: number, updates: Partial<GridRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.productId === rowId ? { ...r, ...updates } : r))
    );
  };

  const handleNameChange = (row: GridRow, name: string) => {
    const updates: Partial<GridRow> = { name };
    if (row.isNew && selectedBreeder && name.trim()) {
      const prefix = toBreederPrefix(selectedBreeder.name);
      const part = toProductPart(name);
      updates.masterSku = `${prefix}-${part}`;
    }
    updateRow(row.productId, updates);
  };

  const handleMasterSkuChange = (row: GridRow, masterSku: string) => {
    if (row.isNew) updateRow(row.productId, { masterSku });
  };

  const handleCategoryChange = (row: GridRow, categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    updateRow(row.productId, { categoryId: categoryId === "__none__" ? "" : categoryId, category: cat?.name ?? "" });
  };

  const [savingDominance, setSavingDominance] = useState<number | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const handlePhotoUpload = async (row: GridRow, files: FileList | null) => {
    if (!files?.[0] || row.isNew) return;
    setUploadingPhoto(row.productId);
    try {
      const urls = await processAndUploadImages([files[0]]);
      if (urls[0]) {
        const res = await fetch(`/api/admin/products/${row.productId}/field`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: urls[0] }),
        });
        if (res.ok) {
          updateRow(row.productId, { imageUrl: urls[0] });
        }
      }
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handleStrainDominanceChange = async (row: GridRow, value: string) => {
    const val = value === "__none__" ? null : (value as "Mostly Indica" | "Mostly Sativa" | "Hybrid 50/50");
    updateRow(row.productId, { strainDominance: val });
    if (row.isNew) return;
    setSavingDominance(row.productId);
    try {
      const res = await fetch(`/api/admin/products/${row.productId}/field`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strain_dominance: val }),
      });
      if (!res.ok) await fetchGrid();
    } finally {
      setSavingDominance(null);
    }
  };

  const handleCellChange = (row: GridRow, pack: number, field: "stock" | "cost" | "price" | "low_stock_threshold", value: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.productId !== row.productId) return r;
        if (field === "low_stock_threshold") {
          const lowStockThresholdByPack = { ...(r.lowStockThresholdByPack ?? {}), [pack]: value };
          return { ...r, lowStockThresholdByPack };
        }
        const byPack = { ...r.byPack };
        byPack[pack] = { ...(byPack[pack] ?? { stock: 0, cost: 0, price: 0 }), [field]: value };
        return { ...r, byPack };
      })
    );
  };

  const saveConfig = async () => {
    if (!breederId) return;
    setConfigSaving(true);
    try {
      const res = await fetch(`/api/admin/breeders/${breederId}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowed_packages: packagesConfig }),
      });
      if (res.ok) await fetchGrid();
    } finally {
      setConfigSaving(false);
    }
  };

  const saveOrUpdateCell = (
    variantId: number | null,
    pack: number,
    row: GridRow,
    field: "stock" | "cost" | "price" | "low_stock_threshold",
    value: number
  ) => {
    if (row.isNew) {
      handleCellChange(row, pack, field, value);
      return;
    }
    saveCell(variantId, pack, row, field, value);
  };

  const saveCell = async (
    variantId: number | null,
    pack: number,
    row: GridRow,
    field: "stock" | "cost" | "price" | "low_stock_threshold",
    value: number
  ) => {
    const cell = row.byPack[pack];
    const hasVariant = variantId != null;
    const hasProduct = row.productId && row.masterSku;
    if (!hasVariant && !hasProduct) return;

    setSavingCell(`${row.productId}-${pack}-${field}`);
    try {
      const apiField = field === "cost" ? "cost_price" : field;
      const body: Record<string, unknown> = hasVariant
        ? { variantId, [apiField]: value }
        : field === "low_stock_threshold"
        ? { variantId, low_stock_threshold: value }
        : {
            productId: row.productId,
            pack,
            masterSku: row.masterSku,
            [apiField]: value,
            ...(field === "stock" ? { price: cell?.price ?? 0, cost_price: cell?.cost ?? 0 } : field === "cost" ? { stock: cell?.stock ?? 0, price: cell?.price ?? 0 } : { stock: cell?.stock ?? 0, cost_price: cell?.cost ?? 0 }),
          };
      if (field === "low_stock_threshold" && !hasVariant) return;
      const res = await fetch("/api/admin/inventory/cell", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setRows((prev) =>
          prev.map((r) => {
            if (r.productId !== row.productId) return r;
            if (field === "low_stock_threshold") {
              const lowStockThresholdByPack = { ...(r.lowStockThresholdByPack ?? {}), [pack]: value };
              return { ...r, lowStockThresholdByPack };
            }
            const byPack = { ...r.byPack };
            if (byPack[pack]) byPack[pack] = { ...byPack[pack], [field]: value };
            return { ...r, byPack };
          })
        );
        if (!hasVariant) await fetchGrid();
      }
    } finally {
      setSavingCell(null);
    }
  };

  const handleSync = async (row: GridRow) => {
    if (!row.masterSku?.trim()) return;
    setSyncing(row.productId);
    try {
      const catId = row.categoryId || (row.category && categories.find((c) => c.name === row.category)?.id);
      const catName = row.category || (row.categoryId && categories.find((c) => c.id === row.categoryId)?.name) || null;
      const cleanByPack: Record<number, { stock: number; cost: number; price: number }> = {};
      for (const packSize of packs) {
        if (typeof packSize !== "number" || packSize < 1 || packSize > 99) continue;
        const cell = row.byPack?.[packSize];
        const c = cell && typeof cell === "object" && !Array.isArray(cell) ? cell : null;
        const stock = c != null ? Math.max(0, Number(c.stock) || 0) : 0;
        const cost = c != null ? Math.max(0, Number(c.cost) || 0) : 0;
        const price = c != null ? Math.max(0, Number(c.price) || 0) : 0;
        cleanByPack[packSize] = { stock, cost, price };
      }
      console.log("[handleSync] raw byPack before send:", row.byPack, "-> cleanByPack:", cleanByPack);
      const res = await fetch("/api/admin/inventory/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterSku: row.masterSku.trim(),
          breederId: Number(breederId),
          name: row.name || row.masterSku,
          category: catName,
          categoryId: catId || undefined,
          strain_dominance: row.strainDominance !== undefined ? row.strainDominance : undefined,
          byPack: cleanByPack,
        }),
      });
      if (res.ok) await fetchGrid();
    } finally {
      setSyncing(null);
    }
  };

  const handleDelete = async (row: GridRow) => {
    if (row.isNew) {
      setRows((prev) => prev.filter((r) => r.productId !== row.productId));
      return;
    }
    if (row.productId <= 0) return;
    if (!confirm(`ลบ "${row.name || row.masterSku}" และ variants ทั้งหมด? การดำเนินการนี้ไม่สามารถย้อนกลับได้`)) return;
    setDeleting(row.productId);
    setFetchError(null);
    try {
      const res = await fetch(`/api/admin/inventory/products/${row.productId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "ลบไม่สำเร็จ");
      await fetchGrid();
    } catch (e) {
      setFetchError(String(e));
    } finally {
      setDeleting(null);
    }
  };

  const exportRows = visibleRows.filter((r) => !r.isNew && r.productId > 0);

  const captureExportElement = async () => {
    const el = exportRef.current;
    if (!el) return null;
    const origStyle = el.getAttribute("style") ?? "";
    el.style.position = "fixed";
    el.style.left = "0";
    el.style.top = "0";
    el.style.opacity = "1";
    el.style.zIndex = "99999";
    el.style.pointerEvents = "none";
    await new Promise((r) => setTimeout(r, 800));
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w === 0 || h === 0) {
      el.setAttribute("style", origStyle);
      return null;
    }
    const dataUrl = await toPng(el, {
      pixelRatio: 2,
      fontFamily: "'Prompt', 'Inter', sans-serif",
      cacheBust: true,
      style: { transform: "none" },
    });
    el.setAttribute("style", origStyle);
    return dataUrl;
  };

  const handleExportPNG = async () => {
    if (!exportRef.current || !selectedBreeder || exportRows.length === 0) return;
    setExporting("png");
    try {
      const dataUrl = await captureExportElement();
      if (!dataUrl) return;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `smile-seed-bank-${selectedBreeder.name.replace(/\s+/g, "-")}-price-list.png`;
      a.click();
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    if (!exportRef.current || !selectedBreeder || exportRows.length === 0) return;
    setExporting("pdf");
    try {
      const dataUrl = await captureExportElement();
      if (!dataUrl) return;
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const el = exportRef.current;
      const imgW = el?.offsetWidth ?? 800;
      const imgH = el?.offsetHeight ?? 600;
      const ratio = imgH / imgW;
      let pdfImgH = pageW * ratio;
      if (pdfImgH > pageH) {
        pdfImgH = pageH;
        const pdfImgW = pageH / ratio;
        pdf.addImage(dataUrl, "PNG", (pageW - pdfImgW) / 2, 0, pdfImgW, pdfImgH);
      } else {
        pdf.addImage(dataUrl, "PNG", 0, 0, pageW, pdfImgH);
      }
      pdf.save(`smile-seed-bank-${selectedBreeder.name.replace(/\s+/g, "-")}-price-list.pdf`);
    } finally {
      setExporting(null);
    }
  };

  if (!hasMounted) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 p-4 sm:p-6 ${selectedProductIds.size > 0 ? "pb-24" : ""}`}>
      <div className="flex items-center gap-3">
        <Link href="/admin/inventory">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Manual Inventory (Spreadsheet)</h1>
          <p className="text-sm text-zinc-500">จัดการสต็อกแบบ Dynamic Grid ตาม Breeder</p>
        </div>
      </div>

      {fetchError && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <span className="text-sm font-medium text-red-700">{fetchError}</span>
          <Button variant="ghost" size="sm" onClick={() => setFetchError(null)} className="text-red-600 hover:bg-red-100">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Breeder & Config</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label>Breeder</Label>
              <Select
                value={breederId || (breeders.length === 0 ? "__empty__" : "__none__")}
                onValueChange={(v) => setBreederId(v === "__none__" || v === "__empty__" ? "" : v)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={breeders.length === 0 ? "No breeders available" : "เลือก Breeder"} />
                </SelectTrigger>
                <SelectContent>
                  {breeders.length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      No breeders available
                    </SelectItem>
                  ) : (
                    <>
                      <SelectItem value="__none__">— เลือก Breeder —</SelectItem>
                      {breeders.map((b) => {
                        const val = b.id.toString();
                        if (!val) return null;
                        return (
                          <SelectItem key={b.id} value={val}>
                            {b.name}
                          </SelectItem>
                        );
                      })}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>ประเภทพันธุกรรม</Label>
              <Select value={dominance} onValueChange={setDominance}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {STRAIN_DOMINANCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>ค้นหา</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="ค้นหาชื่อสายพันธุ์ หรือ SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-[220px] pl-8 rounded-md border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Label className="w-full text-xs text-zinc-500">Allowed Package Sizes (คลิกเปิด/ปิด คอลัมน์, X ลบถาวร)</Label>
            {packagesConfig.sizes.slice().sort((a, b) => a - b).map((pack) => {
              const isActive = packagesConfig.active.includes(pack);
              return (
                <div key={pack} className="relative group">
                  <button
                    type="button"
                    onClick={() => togglePack(pack)}
                    className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                      isActive
                        ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                        : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300"
                    }`}
                  >
                    {pack} {pack === 1 ? "Seed" : "Seeds"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => removePack(pack, e)}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-300 text-white opacity-0 transition hover:bg-red-500 group-hover:opacity-100"
                    title="ลบออกจาก config"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              );
            })}
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={1}
                max={99}
                placeholder="Pack"
                className="h-8 w-20"
                value={customPackInput}
                onChange={(e) => setCustomPackInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomPack()}
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomPack} className="h-8">
                Add Pack
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={saveConfig}
              disabled={!breederId || configSaving}
              className="ml-2"
            >
              {configSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              บันทึก Config
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-medium text-zinc-700">Inventory Grid</span>
          <div className="flex items-center gap-2">
            {breederId && exportRows.length > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportPNG}
                  disabled={!!exporting}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  {exporting === "png" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : "📸"}
                  {" "}Export PNG
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportPDF}
                  disabled={!!exporting}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  {exporting === "pdf" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : "📄"}
                  {" "}Export PDF
                </Button>
              </>
            )}
            {breederId && (
              <>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600">
                  <input
                    type="checkbox"
                    checked={hideOutOfStock}
                    onChange={(e) => setHideOutOfStock(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  ซ่อนสินค้าหมด
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600">
                  <input
                    type="checkbox"
                    checked={lowStockOnly}
                    onChange={(e) => setLowStockOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-red-500 focus:ring-red-500"
                  />
                  สต็อกต่ำเท่านั้น
                </label>
                <Button size="sm" onClick={addNewStrain} className="bg-primary text-white hover:bg-primary/90">
                  <Plus className="mr-1.5 h-4 w-4" /> Add New Strain
                </Button>
              </>
            )}
          </div>
        </div>
        <CardContent className="p-0">
          {!breederId ? (
            <div className="py-12 text-center text-zinc-500">เลือก Breeder เพื่อแสดงตาราง</div>
          ) : loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              {searchQuery.trim() ? "ไม่พบผลลัพธ์ที่ตรงกับคำค้นหา" : "ไม่มีข้อมูล"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="sticky left-0 z-10 w-10 bg-slate-50 px-1 py-3">
                      <input
                        type="checkbox"
                        checked={visibleRows.filter((r) => !r.isNew).length > 0 && visibleRows.filter((r) => !r.isNew).every((r) => selectedProductIds.has(r.productId))}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        title="เลือกทั้งหมด"
                      />
                    </th>
                    <th className="sticky left-[40px] z-10 bg-slate-50 px-2 py-3 text-left font-medium text-slate-700">Sync</th>
                    <th className="sticky left-[82px] z-10 w-10 bg-slate-50 px-1 py-3" />
                    <th className="sticky left-[122px] z-10 w-12 bg-slate-50 px-2 py-3 text-left font-medium text-slate-700">Photo</th>
                    <th className="sticky left-[174px] z-10 min-w-[90px] bg-slate-50 px-3 py-3 text-left font-medium text-slate-700">Master SKU</th>
                    <th className="sticky left-[264px] z-10 min-w-[160px] bg-slate-50 px-3 py-3 text-left font-medium text-slate-700">ชื่อสายพันธุ์</th>
                    <th className="min-w-[100px] px-3 py-3 text-left font-medium text-slate-700">หมวดหมู่</th>
                    <th className="min-w-[100px] px-3 py-3 text-left font-medium text-slate-700">ประเภทพันธุกรรม</th>
                    {packs.map((p) => (
                      <th key={p} colSpan={3} className="w-[156px] border-l border-slate-200 px-0 py-3 text-center font-medium text-emerald-800">
                        {p} {p === 1 ? "Seed" : "Seeds"}
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-100/60">
                    <th colSpan={8} className="px-3 py-1.5" />
                    {packs.map((p) => (
                      <th key={`${p}-s`} colSpan={3} className="w-[156px] border-l border-slate-200 px-0 py-1.5">
                        <div className="flex divide-x divide-slate-300 text-[10px] font-normal text-slate-500">
                          <span className="flex-1 py-0.5">Stock</span>
                          <span className="flex-1 py-0.5">Cost (ทุน)</span>
                          <span className="flex-1 py-0.5">Price (ราคา)</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, rowIdx) => {
                    const rowTotalStock = totalStockForRow(row);
                    const isRowDimmed = !row.isNew && rowTotalStock === 0;
                    const zebra = rowIdx % 2 === 1 ? "bg-slate-50/50" : "";
                    return (
                    <tr
                      key={row.productId}
                      className={`group border-b border-slate-100 transition-colors hover:bg-emerald-50/30 ${row.isNew ? "bg-amber-50/50" : zebra}`}
                    >
                      <td className={`sticky left-0 z-10 w-10 px-1 py-2 transition-colors group-hover:bg-emerald-50/30 ${row.isNew ? "bg-amber-50/50" : zebra ? "bg-slate-50/50" : "bg-white"}`}>
                        {!row.isNew && (
                          <input
                            type="checkbox"
                            checked={selectedProductIds.has(row.productId)}
                            onChange={() => toggleSelectRow(row.productId)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        )}
                      </td>
                      <td className={`sticky left-[40px] z-10 px-2 py-2 transition-colors group-hover:bg-emerald-50/30 ${row.isNew ? "bg-amber-50/50" : zebra ? "bg-slate-50/50" : "bg-white"}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                          onClick={() => handleSync(row)}
                          disabled={syncing === row.productId || (row.isNew && !row.masterSku?.trim())}
                          title={row.isNew ? "Sync: สร้าง product + variants" : "Sync/Link ไปยัง Product Detail"}
                        >
                          {syncing === row.productId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Link2 className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                      <td className={`sticky left-[82px] z-10 w-10 px-1 py-2 transition-colors group-hover:bg-emerald-50/30 ${row.isNew ? "bg-amber-50/50" : zebra ? "bg-slate-50/50" : "bg-white"}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDelete(row)}
                          disabled={deleting === row.productId}
                          title={row.isNew ? "ลบแถว" : "ลบสินค้าและ variants ทั้งหมด"}
                        >
                          {deleting === row.productId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                      <td className={`sticky left-[122px] z-10 w-12 px-2 py-2 transition-colors group-hover:bg-emerald-50/30 ${row.isNew ? "bg-amber-50/50" : zebra ? "bg-slate-50/50" : "bg-white"}`}>
                        <label className="flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50 hover:bg-slate-100">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={row.isNew || uploadingPhoto === row.productId}
                            onChange={(e) => handlePhotoUpload(row, e.target.files)}
                          />
                          {uploadingPhoto === row.productId ? (
                            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                          ) : row.imageUrl ? (
                            <>
                              <Image
                                src={row.imageUrl}
                                alt=""
                                width={40}
                                height={40}
                                className="h-10 w-10 object-cover rounded-lg"
                                unoptimized={!row.imageUrl.includes("supabase.co")}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove("hidden");
                                }}
                              />
                              <span className="hidden flex items-center justify-center">
                                <ImagePlus className="h-5 w-5 text-zinc-400" />
                              </span>
                            </>
                          ) : (
                            <ImagePlus className="h-5 w-5 text-zinc-400" />
                          )}
                        </label>
                      </td>
                      <td className={`sticky left-[174px] z-10 min-w-[90px] px-3 py-2 transition-colors group-hover:bg-emerald-50/30 ${isRowDimmed ? "opacity-50" : ""} ${row.isNew ? "bg-amber-50/50" : zebra ? "bg-slate-50/50" : "bg-white"}`}>
                        {row.isNew ? (
                          <Input
                            value={row.masterSku}
                            onChange={(e) => handleMasterSkuChange(row, e.target.value)}
                            placeholder="FB-ZKITTLEZ"
                            className="h-7 w-28 font-mono text-xs border-transparent focus:border-emerald-500"
                          />
                        ) : (
                          <span className="font-mono text-xs text-slate-600">{row.masterSku || "—"}</span>
                        )}
                      </td>
                      <td className={`sticky left-[264px] z-10 min-w-[160px] px-3 py-2 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)] transition-colors group-hover:bg-emerald-50/30 ${isRowDimmed ? "opacity-50" : ""} ${row.isNew ? "bg-amber-50/50" : zebra ? "bg-slate-50/50" : "bg-white"}`}>
                        {row.isNew ? (
                          <Input
                            value={row.name}
                            onChange={(e) => handleNameChange(row, e.target.value)}
                            placeholder="Strain Name (auto-SKU)"
                            className="h-7 min-w-[120px] border-transparent focus:border-emerald-500"
                          />
                        ) : (
                          <Link
                            href={`/product/${row.productId}`}
                            target="_blank"
                            className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                          >
                            {row.name}
                          </Link>
                        )}
                      </td>
                      <td className="min-w-[120px] px-4 py-2">
                        <Select
                          value={row.categoryId || row.productCategory?.id || "__none__"}
                          onValueChange={(v) => handleCategoryChange(row, v)}
                        >
                          <SelectTrigger className="h-8 border-emerald-200 bg-white text-xs text-emerald-800 hover:bg-emerald-50/50">
                            <SelectValue placeholder="— เลือกหมวดหมู่ —" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— เลือกหมวดหมู่ —</SelectItem>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className={`min-w-[120px] px-4 py-2 ${isRowDimmed ? "opacity-50" : ""}`}>
                        <div className="flex items-center gap-1">
                          <Select
                            value={row.strainDominance || "__none__"}
                            onValueChange={(v) => handleStrainDominanceChange(row, v)}
                            disabled={savingDominance === row.productId}
                          >
                            <SelectTrigger className="h-8 border-emerald-200 bg-white text-xs text-emerald-800 hover:bg-emerald-50/50">
                              <SelectValue placeholder="— ประเภทพันธุกรรม —" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">— ประเภทพันธุกรรม —</SelectItem>
                              <SelectItem value="Mostly Indica">Mostly Indica</SelectItem>
                              <SelectItem value="Hybrid 50/50">Hybrid 50/50</SelectItem>
                              <SelectItem value="Mostly Sativa">Mostly Sativa</SelectItem>
                            </SelectContent>
                          </Select>
                          {savingDominance === row.productId && (
                            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-emerald-600" />
                          )}
                        </div>
                      </td>
                      {packs.map((packSize) => {
                        const stock = row.byPack?.[packSize]?.stock ?? 0;
                        const cost = row.byPack?.[packSize]?.cost ?? 0;
                        const price = row.byPack?.[packSize]?.price ?? 0;
                        const variantId = row.variantIdsByPack?.[packSize] ?? null;
                        const th = row.lowStockThresholdByPack?.[packSize] ?? 5;
                        const outOfStock = stock === 0 && price > 0;
                        const notAvailable = stock === 0 && price === 0;
                        const lowStock = stock > 0 && stock <= th;
                        const key = `${row.productId}-${packSize}`;
                        const packCellClass = "w-[52px] border-l border-slate-100 px-1 py-2 align-top";
                        const outClass = outOfStock ? "bg-red-50/80" : "";
                        const lowClass = lowStock && !outOfStock ? "bg-amber-50/50" : "";
                        return (
                          <Fragment key={packSize}>
                            <td className={`${packCellClass} ${outClass} ${lowClass}`}>
                              <div className="flex items-center justify-end gap-0.5">
                                {lowStock && variantId != null && (
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" title={`แจ้งต่ำ ≤ ${th}`} />
                                )}
                                <EditableCell
                                  value={stock}
                                  saving={!row.isNew && savingCell === `${key}-stock`}
                                  onSave={(v) => saveOrUpdateCell(variantId, packSize, row, "stock", v)}
                                  align="right"
                                />
                                {variantId != null && (
                                  <button
                                    type="button"
                                    title={`แจ้งต่ำ ≤ ${th} (คลิกแก้ไข)`}
                                    className="rounded p-0.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600"
                                    onClick={() => setEditingThreshold(editingThreshold === key ? null : key)}
                                  >
                                    <Settings2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                              {editingThreshold === key && variantId != null && (
                                <div className="mt-1 flex items-center gap-1 rounded bg-slate-100 px-1.5 py-1">
                                  <span className="text-[9px] text-slate-500">≤</span>
                                  <Input
                                    type="number"
                                    min={0}
                                    className="h-5 w-10 border-0 bg-white text-xs"
                                    value={th}
                                    onChange={(e) => handleCellChange(row, packSize, "low_stock_threshold", Math.max(0, Number(e.target.value) || 5))}
                                    onBlur={() => {
                                      saveOrUpdateCell(variantId, packSize, row, "low_stock_threshold", row.lowStockThresholdByPack?.[packSize] ?? 5);
                                      setEditingThreshold(null);
                                    }}
                                    onKeyDown={(e) => e.key === "Enter" && setEditingThreshold(null)}
                                  />
                                </div>
                              )}
                            </td>
                            <td className={`${packCellClass} ${notAvailable ? "text-slate-300" : ""}`}>
                              <EditableCell
                                value={cost}
                                saving={!row.isNew && savingCell === `${key}-cost`}
                                onSave={(v) => saveOrUpdateCell(variantId, packSize, row, "cost", v)}
                                prefix="฿"
                              />
                            </td>
                            <td className={`${packCellClass} ${notAvailable ? "text-slate-300" : ""} ${outOfStock ? "bg-red-50/80" : ""}`}>
                              <EditableCell
                                value={price}
                                saving={!row.isNew && savingCell === `${key}-price`}
                                onSave={(v) => saveOrUpdateCell(variantId, packSize, row, "price", v)}
                                prefix="฿"
                                bold
                              />
                            </td>
                          </Fragment>
                        );
                      })}
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
          )}
          {!loading && breederId && rows.length === 0 && (
            <div className="py-12 text-center text-zinc-500">ไม่มีสินค้าตามเงื่อนไขนี้</div>
          )}
        </CardContent>
      </Card>

      {selectedProductIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-t border-slate-200 bg-white px-6 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <span className="text-sm font-medium text-slate-700">
            เลือกแล้ว <span className="font-semibold text-emerald-700">{selectedProductIds.size}</span> รายการ
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedProductIds(new Set())}
              className="border-slate-200 text-slate-600"
            >
              ล้างการเลือก
            </Button>
            <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => goToQuotationBuilder()}>
              <FileText className="mr-1.5 h-4 w-4" />
              สร้างใบเสนอราคา
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-zinc-400">
        Sync/Link: สร้างหรือเชื่อมโยง product เข้า main catalog ด้วย master_sku → แก้ไขรูปและคำบรรยายได้ที่ Product Detail
      </p>

      {/* Export-only layout: in-viewport during capture (html-to-image fails with off-screen) */}
      {createPortal(
        <div
          ref={exportRef}
          className="fixed left-0 top-0 z-[-1] w-[800px] min-h-[400px] overflow-visible bg-white shadow-xl opacity-0 pointer-events-none"
          style={{ fontFamily: "'Prompt', 'Inter', sans-serif", transform: "none" }}
        >
          {/* Branded header — Digital Menu */}
          <div className="flex items-center justify-between gap-6 border-b-2 border-emerald-700 bg-emerald-50/30 px-6 pt-8 pb-6">
            <div className="w-16 flex-shrink-0" aria-hidden />
            <div className="flex flex-1 flex-col items-center justify-center gap-y-1 text-center">
              {settings.logo_main_url ? (
                <img src={settings.logo_main_url} alt="Smile Seed Bank" className="h-20 w-auto object-contain" />
              ) : (
                <div className="flex h-20 w-24 items-center justify-center rounded-lg bg-emerald-100 text-xl font-bold text-emerald-800">SSB</div>
              )}
              <p className="text-sm font-medium text-emerald-600">www.smileseedbank.com</p>
              <div className="flex items-center justify-center">
                {selectedBreeder?.logo_url ? (
                  <img
                    src={selectedBreeder.logo_url}
                    alt=""
                    crossOrigin="anonymous"
                    className="mr-2 h-10 w-auto object-contain"
                  />
                ) : null}
                <span className="text-xs text-zinc-500">{selectedBreeder?.name ?? "Price List"}</span>
              </div>
            </div>
            <div className="flex w-16 flex-shrink-0 justify-end">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR" width={64} height={64} className="rounded-lg border border-emerald-200" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-emerald-200 bg-white text-[10px] text-zinc-400">QR</div>
              )}
            </div>
          </div>
          <div className="p-6">
        <table className="w-full table-fixed border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-emerald-700 bg-emerald-50">
              <th className="w-[36px] px-1 py-2 text-left font-semibold text-emerald-900">Photo</th>
              <th className="w-[140px] px-2 py-2 text-left font-semibold text-emerald-900">Strain Name</th>
              <th className="w-[70px] px-2 py-2 text-left font-semibold text-emerald-900">Category</th>
              <th className="w-[90px] px-2 py-2 text-left font-semibold text-emerald-900">ประเภทพันธุกรรม</th>
              {packs.map((p) => (
                <th key={p} colSpan={3} className="w-[120px] px-1 py-2 text-center font-semibold text-emerald-900">
                  {p} {p === 1 ? "Seed" : "Seeds"}
                </th>
              ))}
            </tr>
            <tr className="border-b border-emerald-200 bg-emerald-50/50">
              <th colSpan={4} className="px-2 py-1" />
              {packs.map((p) => (
                <th key={p} colSpan={3} className="px-1 py-1 text-center text-[10px] font-normal text-emerald-700">
                  Stock | Cost | Price
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exportRows.map((row) => (
              <tr key={row.productId} className="border-b border-zinc-200">
                <td className="w-9 px-1 py-2">
                  {row.imageUrl ? (
                    <img
                      src={row.imageUrl}
                      alt=""
                      className="h-9 w-9 rounded object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <div className={`flex h-9 w-9 items-center justify-center rounded bg-zinc-100 ${row.imageUrl ? "hidden" : ""}`}>
                    <ImagePlus className="h-4 w-4 text-zinc-400" />
                  </div>
                </td>
                <td className="max-w-[140px] break-words px-2 py-2 font-medium text-zinc-900">{row.name}</td>
                <td className="max-w-[70px] break-words px-2 py-2 text-emerald-800">{(row.productCategory?.name ?? row.category) ?? "—"}</td>
                <td className="max-w-[90px] break-words px-2 py-2 text-emerald-700">{row.strainDominance || "—"}</td>
                {packs.map((packSize) => {
                  const stock = row.byPack?.[packSize]?.stock ?? 0;
                  const cost = row.byPack?.[packSize]?.cost ?? 0;
                  const price = row.byPack?.[packSize]?.price ?? 0;
                  const outOfStock = stock === 0;
                  return (
                    <td key={packSize} colSpan={3} className="px-1 py-2 text-center text-zinc-700">
                      {outOfStock ? (
                        <span className="text-zinc-400">หมด</span>
                      ) : (
                        <>
                          <span className="font-medium">{stock}</span>
                          <span className="text-zinc-400"> | </span>
                          <span className="font-medium">{cost > 0 ? cost.toLocaleString("th-TH") : "—"}</span>
                          <span className="text-zinc-400"> | </span>
                          <span className="font-medium text-emerald-800">{price > 0 ? price.toLocaleString("th-TH") : "—"}</span>
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-6">
          <p className="text-sm text-zinc-600">
            Contact us at Line: <span className="font-semibold text-emerald-800">{lineId ? (lineId.startsWith("@") ? lineId : `@${lineId}`) : "@smileseedbank"}</span>
          </p>
        </div>
        </div>
          {/* Watermark overlay — visible in export only */}
          <div
            className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
            aria-hidden
          >
            <div
              className="absolute left-1/2 top-1/2 flex w-[200%] -translate-x-1/2 -translate-y-1/2 flex-wrap justify-center gap-x-32 gap-y-16"
              style={{ transform: "translate(-50%, -50%) rotate(-30deg)" }}
            >
              {Array.from({ length: 80 }).map((_, i) => (
                <span
                  key={i}
                  className="whitespace-nowrap text-sm font-medium text-slate-400"
                  style={{ opacity: 0.06 }}
                >
                  SMILE SEED BANK - www.smileseedbank.com
                </span>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
