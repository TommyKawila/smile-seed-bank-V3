"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Search,
  XCircle,
  ImagePlus,
  Trash2,
  Settings2,
  FileText,
  RefreshCw,
  Sparkles,
  Store,
  Sprout,
  Pencil,
} from "lucide-react";
import { Fragment } from "react";
import { toBreederPrefix, toProductPart } from "@/lib/sku-utils";
import { processAndUploadImages } from "@/lib/supabase/storage-utils";
import { toPng } from "html-to-image";
import { pdf } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
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
import { useToast } from "@/hooks/use-toast";
import { toastErrorMessage } from "@/lib/admin-toast";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
import { consumeManualGridImport } from "@/lib/manual-grid-import-handoff";
import { FLOWERING_DB_PHOTO_3N } from "@/lib/constants";
import { resolvePdfLogos } from "@/lib/pdf-image-data-uri";
import { InventoryPdfDocument, ensurePdfPromptFont } from "./components/InventoryPdfDocument";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const DEFAULT_PACKS = [1, 2, 3, 5];
const LS_SHOW_COST = "manual-inventory-show-cost";
const LS_SHOW_FOOTER = "manual-inventory-show-footer";

/** One pack column: stock, cost, retail price */
export type InventoryPackCell = { stock: number; cost: number; price: number };

/** One catalog variant for a pack size (Manual Grid ↔ `product_variants`) */
export type InventoryVariant = { packSize: number; variantId: number | null };

/** Variant id per pack size (null = not linked yet) */
export type InventoryVariantIdsByPack = Record<number, number | null>;

export type InventoryLowStockThresholdByPack = Record<number, number>;

/** Normalized manual grid row (API + client) */
export type InventoryRow = {
  productId: number;
  masterSku: string;
  name: string;
  imageUrl?: string | null;
  strainDominance?: string | null;
  category: string;
  productCategory?: { id: string; name: string } | null;
  categoryId?: string;
  floweringType?: string | null;
  thcPercent?: number | null;
  terpenes?: string | null;
  packs: number[];
  byPack: Record<number, InventoryPackCell>;
  variantIdsByPack?: InventoryVariantIdsByPack;
  lowStockThresholdByPack?: InventoryLowStockThresholdByPack;
  isNew?: boolean;
  /** Local-only: row not yet persisted / needs sync (optional explicit flag) */
  syncStatus?: "pending" | "synced";
};

function isManualGridRowUnsynced(r: InventoryRow): boolean {
  if (r.syncStatus === "pending") return true;
  return r.isNew === true || r.productId < 0;
}

/** Draft / temp ID row not yet linked in main catalog; needs Master SKU before sync. */
export function isManualGridNewItemReadyToSync(r: InventoryRow): boolean {
  if (!r.masterSku?.trim()) return false;
  return r.isNew === true || r.productId < 0;
}

/** Smart columns: pack sizes where at least one row has stock or retail price (excludes 0/0 ghost variants). */
function isPackCellStockedOrPriced(c: InventoryPackCell | undefined): boolean {
  if (!c) return false;
  const stock = Math.max(0, Number(c.stock) || 0);
  const price = Math.max(0, Number(c.price) || 0);
  return stock > 0 || price > 0;
}

function collectPackSizesFromRows(rows: InventoryRow[]): number[] {
  const s = new Set<number>();
  for (const r of rows) {
    if (!r.byPack) continue;
    for (const k of Object.keys(r.byPack)) {
      const n = Number(k);
      if (Number.isNaN(n) || n < 1 || n > 99) continue;
      if (isPackCellStockedOrPriced(r.byPack[n])) s.add(n);
    }
  }
  return [...s].sort((a, b) => a - b);
}

function mergeUniqueSorted(...lists: number[][]): number[] {
  const s = new Set<number>();
  for (const list of lists) for (const n of list) if (n >= 1 && n <= 99) s.add(n);
  return [...s].sort((a, b) => a - b);
}

type PackFooterTotals = {
  totalStrains: number;
  totalStockAll: number;
  grandCostValue: number;
  grandPriceValue: number;
  perPackStock: Record<number, number>;
  perPackCostValue: Record<number, number>;
  perPackPriceValue: Record<number, number>;
};

function computePackFooterTotals(rows: InventoryRow[], packList: number[]): PackFooterTotals {
  const perPackStock: Record<number, number> = {};
  const perPackCostValue: Record<number, number> = {};
  const perPackPriceValue: Record<number, number> = {};
  for (const p of packList) {
    perPackStock[p] = 0;
    perPackCostValue[p] = 0;
    perPackPriceValue[p] = 0;
  }
  let totalStockAll = 0;
  let grandCostValue = 0;
  let grandPriceValue = 0;
  for (const row of rows) {
    for (const p of packList) {
      const st = row.byPack?.[p]?.stock ?? 0;
      const c = row.byPack?.[p]?.cost ?? 0;
      const pr = row.byPack?.[p]?.price ?? 0;
      totalStockAll += st;
      perPackStock[p] += st;
      const cv = st * c;
      const pv = st * pr;
      perPackCostValue[p] += cv;
      perPackPriceValue[p] += pv;
      grandCostValue += cv;
      grandPriceValue += pv;
    }
  }
  return {
    totalStrains: rows.length,
    totalStockAll,
    grandCostValue,
    grandPriceValue,
    perPackStock,
    perPackCostValue,
    perPackPriceValue,
  };
}

/** Raw row from GET /api/admin/inventory/grid before normalizeByPack */
type InventoryGridApiRow = {
  productId: number;
  masterSku?: string;
  name?: string;
  imageUrl?: string | null;
  strainDominance?: string | null;
  category?: string;
  productCategory?: { id: string; name: string } | null;
  categoryId?: string;
  floweringType?: string | null;
  thcPercent?: number | null;
  terpenes?: string | null;
  packs?: number[];
  byPack?: unknown;
  variantIdsByPack?: Record<string, number | null> | Record<number, number | null>;
  lowStockThresholdByPack?: Record<string, number> | Record<number, number>;
};

type InventoryGridApiResponse = {
  rows?: InventoryGridApiRow[];
  error?: string;
  packagesConfig?: { sizes?: number[]; active?: number[] };
  allowedPackages?: number[];
};

type SyncInventoryRowPayload = {
  productId?: unknown;
  masterSku?: unknown;
  name?: unknown;
  imageUrl?: unknown;
  strainDominance?: unknown;
  category?: unknown;
  productCategory?: unknown;
  categoryId?: unknown;
  floweringType?: unknown;
  packs?: unknown;
  byPack?: unknown;
  variantIdsByPack?: InventoryRow["variantIdsByPack"];
  lowStockThresholdByPack?: InventoryRow["lowStockThresholdByPack"];
};

type CategoryApiItem = { id: string | number; name: string };
type BreederApiItem = {
  id: number | bigint | string;
  name: string;
  logo_url?: string | null;
  allowed_packages?: unknown;
};

function normalizeByPack(raw: unknown, packSizes: number[]): Record<number, InventoryPackCell> {
  const out: Record<number, InventoryPackCell> = {};
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
type Breeder = {
  id: number;
  name: string;
  logo_url?: string | null;
  allowed_packages: number[] | { sizes: number[]; active: number[]; manual_grid_extra_packs?: number[] } | null;
};
const STRAIN_DOMINANCE_OPTIONS = ["Mostly Indica", "Mostly Sativa", "Hybrid 50/50"] as const;

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
        className={`h-7 w-14 border-0 border-b border-transparent bg-transparent px-1 py-0 text-sm shadow-none focus:border-primary focus:ring-0 ${bold ? "font-semibold text-foreground" : "text-slate-600"}`}
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
  const { toast } = useToast();
  const [hasMounted, setHasMounted] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [breeders, setBreeders] = useState<Breeder[]>([]);
  const [breederId, setBreederId] = useState<string>("");
  const [category, setCategory] = useState("all");
  const [dominance, setDominance] = useState("all");
  /** User-pinned pack sizes (always show) — persisted on breeder as `manual_grid_extra_packs` */
  const [extraPackSizes, setExtraPackSizes] = useState<number[]>([]);
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const [configSaving, setConfigSaving] = useState(false);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [batchSyncing, setBatchSyncing] = useState(false);
  const [batchSyncLabel, setBatchSyncLabel] = useState("");
  const [syncNewItemsDialogOpen, setSyncNewItemsDialogOpen] = useState(false);
  const [lastAddedRowId, setLastAddedRowId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [rowPendingDelete, setRowPendingDelete] = useState<InventoryRow | null>(null);
  const [customPackInput, setCustomPackInput] = useState("");
  const [exporting, setExporting] = useState<"png" | "pdf" | null>(null);
  const [editingThreshold, setEditingThreshold] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  const [showCost, setShowCost] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return localStorage.getItem(LS_SHOW_COST) !== "0";
    } catch {
      return true;
    }
  });
  const [showFooter, setShowFooter] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return localStorage.getItem(LS_SHOW_FOOTER) !== "0";
    } catch {
      return true;
    }
  });
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<20 | 50 | 100 | "all">(20);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [lineId, setLineId] = useState<string>("");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [exportMainLogoOk, setExportMainLogoOk] = useState(true);
  const [exportBreederLogoOk, setExportBreederLogoOk] = useState(true);
  const exportRef = useRef<HTMLDivElement>(null);
  const { settings } = useSiteSettings();

  useEffect(() => {
    setExportMainLogoOk(true);
  }, [settings.logo_main_url]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_SHOW_COST, showCost ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [showCost]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_SHOW_FOOTER, showFooter ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [showFooter]);

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

  const derivedPackSizes = useMemo(() => collectPackSizesFromRows(rows), [rows]);
  const packs = useMemo(() => {
    const m = mergeUniqueSorted(derivedPackSizes, extraPackSizes);
    return m.length > 0 ? m : DEFAULT_PACKS;
  }, [derivedPackSizes, extraPackSizes]);
  const categoryOptionsForGrid = useMemo(() => {
    const rest = categories.filter(
      (c) =>
        c.id !== FLOWERING_DB_PHOTO_3N &&
        c.name.trim().toLowerCase() !== "photo 3n"
    );
    const hasPhoto3n =
      categories.some((c) => c.id === FLOWERING_DB_PHOTO_3N) ||
      categories.some((c) => c.name.trim().toLowerCase() === "photo 3n");
    if (!hasPhoto3n) return [...categories, { id: FLOWERING_DB_PHOTO_3N, name: "Photo 3N" }];
    return [...rest, { id: FLOWERING_DB_PHOTO_3N, name: "Photo 3N" }];
  }, [categories]);
  const packSpan = showCost ? 3 : 2;
  const packGroupWidthClass = showCost ? "w-[156px]" : "w-[104px]";
  const totalStockForRow = useCallback((row: InventoryRow) => {
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
    const hasLowStock = (r: InventoryRow) =>
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

  const sortedRows = useMemo(() => {
    const catKey = (r: InventoryRow) => (r.category?.trim() ? r.category.trim() : "\uFFFF");
    const tier2 = (a: InventoryRow, b: InventoryRow) => {
      const c = catKey(a).localeCompare(catKey(b), "th", { sensitivity: "base" });
      if (c !== 0) return c;
      return (a.name ?? "").localeCompare(b.name ?? "", "th", { sensitivity: "base" });
    };
    return [...visibleRows].sort((a, b) => {
      const ua = isManualGridRowUnsynced(a);
      const ub = isManualGridRowUnsynced(b);
      if (ua && !ub) return -1;
      if (!ua && ub) return 1;
      if (ua && ub) return a.productId - b.productId;
      return tier2(a, b);
    });
  }, [visibleRows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [breederId, category, dominance, searchQuery, hideOutOfStock, lowStockOnly]);

  const totalItems = sortedRows.length;
  const totalPages =
    itemsPerPage === "all" ? 1 : Math.max(1, Math.ceil(Math.max(totalItems, 1) / itemsPerPage));

  useEffect(() => {
    if (itemsPerPage === "all") {
      setCurrentPage(1);
      return;
    }
    setCurrentPage((p) => {
      const max = Math.max(1, Math.ceil(sortedRows.length / itemsPerPage));
      return Math.min(Math.max(1, p), max);
    });
  }, [sortedRows.length, itemsPerPage]);

  const paginatedRows = useMemo(() => {
    if (itemsPerPage === "all") return sortedRows;
    const start = (currentPage - 1) * itemsPerPage;
    return sortedRows.slice(start, start + itemsPerPage);
  }, [sortedRows, currentPage, itemsPerPage]);

  const rowOffset = itemsPerPage === "all" ? 0 : (currentPage - 1) * itemsPerPage;

  const paginationLabel = useMemo(() => {
    if (totalItems === 0) return "Showing 0 of 0 items";
    const from = rowOffset + 1;
    const to = rowOffset + paginatedRows.length;
    return `Showing ${from}–${to} of ${totalItems} items`;
  }, [totalItems, rowOffset, paginatedRows.length]);

  const visiblePageNumbers = useMemo(() => {
    if (itemsPerPage === "all" || totalPages <= 1) return [1];
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const s = new Set<number>([1, totalPages]);
    for (let d = -2; d <= 2; d++) s.add(currentPage + d);
    return Array.from(s)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);
  }, [totalPages, currentPage, itemsPerPage]);

  const pageButtonParts = useMemo(() => {
    const nums = visiblePageNumbers;
    const out: (number | "ellipsis")[] = [];
    for (let i = 0; i < nums.length; i++) {
      const p = nums[i]!;
      if (i > 0 && p - nums[i - 1]! > 1) out.push("ellipsis");
      out.push(p);
    }
    return out;
  }, [visiblePageNumbers]);

  const toggleSelectAll = useCallback(() => {
    const selectable = sortedRows.map((r) => r.productId);
    const allSelected = selectable.length > 0 && selectable.every((id) => selectedProductIds.has(id));
    setSelectedProductIds(allSelected ? new Set() : new Set(selectable));
  }, [sortedRows, selectedProductIds]);

  const footerTotals = useMemo(
    () => computePackFooterTotals(sortedRows, packs),
    [sortedRows, packs]
  );

  const exportRows = useMemo(
    () => sortedRows.filter((r) => !r.isNew && r.productId > 0),
    [sortedRows]
  );

  const exportFooterTotals = useMemo(
    () => computePackFooterTotals(exportRows, packs),
    [exportRows, packs]
  );

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
  const [editingStrainId, setEditingStrainId] = useState<number | null>(null);
  const [strainSheetForm, setStrainSheetForm] = useState<{
    name: string;
    categoryId: string;
    strainDominance: string;
  } | null>(null);
  const [strainSheetSaving, setStrainSheetSaving] = useState(false);

  const safeJson = async <T,>(res: Response): Promise<T | null> => {
    const text = await res.text();
    if (!text.trim()) return null;
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) {
        const msg = `โหลดหมวดหมู่ไม่สำเร็จ (${res.status})`;
        setFetchError(msg);
        toast({ title: "โหลดข้อมูลไม่สำเร็จ", description: msg, variant: "destructive" });
        return;
      }
      const data = await safeJson<CategoryApiItem[]>(res);
      if (Array.isArray(data)) {
        setCategories(data.map((c) => ({ id: String(c.id), name: c.name })));
      }
    } catch {
      const msg = "โหลดหมวดหมู่ไม่สำเร็จ — ลองใหม่อีกครั้ง";
      setFetchError(msg);
      toast({ title: "โหลดข้อมูลไม่สำเร็จ", description: msg, variant: "destructive" });
    }
  }, [toast]);

  const fetchBreeders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/breeders");
      if (!res.ok) {
        const msg = `โหลด Breeder ไม่สำเร็จ (${res.status})`;
        setFetchError(msg);
        toast({ title: "โหลดข้อมูลไม่สำเร็จ", description: msg, variant: "destructive" });
        return;
      }
      const data = await safeJson<BreederApiItem[]>(res);
      if (Array.isArray(data)) {
        setBreeders(
          data
            .filter((b) => b.id != null && b.name != null && String(b.name).trim() !== "")
            .map((b) => {
              let ap: Breeder["allowed_packages"] = [1, 2, 3, 5];
              const raw = b.allowed_packages;
              if (typeof raw === "string") {
                try {
                  ap = JSON.parse(raw || "[]") as Breeder["allowed_packages"];
                } catch {
                  ap = [1, 2, 3, 5];
                }
              } else if (raw != null) {
                ap = raw as Breeder["allowed_packages"];
              }
              if (!ap) ap = [1, 2, 3, 5];
              return {
                id: Number(b.id),
                name: String(b.name),
                logo_url: b.logo_url ?? null,
                allowed_packages: ap,
              };
            })
        );
      }
    } catch {
      const msg = "โหลด Breeder ไม่สำเร็จ — ลองใหม่อีกครั้ง";
      setFetchError(msg);
      toast({ title: "โหลดข้อมูลไม่สำเร็จ", description: msg, variant: "destructive" });
    }
  }, [toast]);

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
      const res = await fetch(`/api/admin/inventory/grid?${params}`, { cache: "no-store" });
      if (!res.ok) {
        const msg = `โหลดตารางสินค้าไม่สำเร็จ (${res.status})`;
        setFetchError(msg);
        toast({ title: "โหลดข้อมูลไม่สำเร็จ", description: msg, variant: "destructive" });
        return;
      }
      const data = await safeJson<InventoryGridApiResponse>(res);
      if (data == null) {
        const msg = "ไม่สามารถอ่านข้อมูลตารางได้ — ลองใหม่อีกครั้ง";
        setFetchError(msg);
        toast({ title: "โหลดข้อมูลไม่สำเร็จ", description: msg, variant: "destructive" });
        setRows([]);
        return;
      }
      if (data.error) {
        const msg = `${data.error} — ลองใหม่อีกครั้ง`;
        setFetchError(msg);
        toast({ title: "โหลดข้อมูลไม่สำเร็จ", description: msg, variant: "destructive" });
        setRows([]);
        return;
      }
      if (!Array.isArray(data.rows)) {
        setRows([]);
        return;
      }
      const rawRows = data.rows;
      const globalFallback =
        data.packagesConfig?.sizes ?? data.packagesConfig?.active ?? data.allowedPackages ?? DEFAULT_PACKS;
      const arr = Array.isArray(globalFallback) ? globalFallback : [];
      const packSizesForNorm = arr.length ? arr : DEFAULT_PACKS;
      const normalized: InventoryRow[] = rawRows.map((r) => {
        const fromRow =
          Array.isArray(r.packs) && r.packs.length
            ? r.packs.filter((n) => typeof n === "number" && n >= 1 && n <= 99)
            : [];
        const packKeysForRow = fromRow.length ? [...new Set(fromRow)].sort((a, b) => a - b) : packSizesForNorm;
        const byPack = normalizeByPack(r.byPack, packKeysForRow);
        const variantIdsByPack: InventoryVariantIdsByPack = {};
        const lowStockThresholdByPack: InventoryLowStockThresholdByPack = {};
        const rawVid = r.variantIdsByPack as Record<string, number | null> | undefined;
        const rawTh = r.lowStockThresholdByPack as Record<string, number> | undefined;
        for (const p of packKeysForRow) {
          const key = String(p);
          variantIdsByPack[p] = rawVid?.[key] ?? null;
          lowStockThresholdByPack[p] = rawTh?.[key] ?? 5;
        }
        return {
          productId: r.productId,
          masterSku: r.masterSku ?? "",
          name: r.name ?? "",
          imageUrl: r.imageUrl,
          strainDominance: r.strainDominance,
          category: r.category ?? "",
          productCategory: r.productCategory ?? null,
          categoryId: r.categoryId,
          floweringType: r.floweringType ?? null,
          thcPercent: r.thcPercent,
          terpenes: r.terpenes ?? null,
          packs: packKeysForRow,
          byPack,
          variantIdsByPack,
          lowStockThresholdByPack,
        };
      });
      setRows(normalized);
    } catch {
      const msg = "โหลดตารางสินค้าไม่สำเร็จ — ลองใหม่อีกครั้ง";
      setFetchError(msg);
      toast({ title: "โหลดข้อมูลไม่สำเร็จ", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [breederId, category, dominance, toast]);

  const applyCategory = useCallback(
    (value: string) => {
      setCategory(value);
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") params.delete("categoryId");
      else params.set("categoryId", value);
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

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
    const cat = searchParams.get("categoryId");
    if (cat) setCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    fetchGrid();
  }, [fetchGrid]);

  useEffect(() => {
    if (!hasMounted || !breederId || loading) return;
    if (categoryOptionsForGrid.length === 0) return;
    const payload = consumeManualGridImport();
    if (!payload || payload.breederId !== breederId) return;
    const packsToUse = packs.length ? packs : DEFAULT_PACKS;
    setRows((prev) => {
      const drafts: InventoryRow[] = payload.drafts.map((d, idx) => {
        const byPack: Record<number, InventoryPackCell> = {};
        const variantIdsByPack: InventoryVariantIdsByPack = {};
        const lowStockThresholdByPack: InventoryLowStockThresholdByPack = {};
        for (const p of packsToUse) {
          const cell = d.byPack[p] ?? { stock: 0, cost: 0, price: 0 };
          byPack[p] = { stock: cell.stock, cost: cell.cost ?? 0, price: cell.price };
          variantIdsByPack[p] = null;
          lowStockThresholdByPack[p] = 5;
        }
        const matched: Category | undefined = d.category
          ? categoryOptionsForGrid.find((c) => c.name === d.category)
          : undefined;
        const resolvedCat = matched ?? categoryOptionsForGrid[0];
        return {
          productId: -(Date.now() + idx),
          masterSku: d.masterSku,
          name: d.name,
          imageUrl: null,
          strainDominance: d.strainDominance ?? null,
          category: resolvedCat?.name ?? d.category ?? "",
          categoryId: resolvedCat?.id ?? "",
          packs: packsToUse,
          byPack,
          variantIdsByPack,
          lowStockThresholdByPack,
          isNew: true,
          syncStatus: "pending",
        };
      });
      return [...drafts, ...prev];
    });
    toast({
      title: "นำเข้าแบบร่าง",
      description: `เพิ่ม ${payload.drafts.length} แถวจาก AI Import ที่ด้านบน`,
    });
  }, [hasMounted, breederId, loading, categoryOptionsForGrid, packs, toast]);

  useEffect(() => {
    if (!breederId || !breeders.length) {
      setExtraPackSizes([]);
      return;
    }
    const b = breeders.find((x) => String(x.id) === breederId);
    const ap = b?.allowed_packages;
    if (ap && typeof ap === "object" && !Array.isArray(ap) && Array.isArray(ap.manual_grid_extra_packs)) {
      setExtraPackSizes(
        [...new Set(ap.manual_grid_extra_packs.filter((n) => n >= 1 && n <= 99))].sort((a, b) => a - b)
      );
    } else {
      setExtraPackSizes([]);
    }
  }, [breederId, breeders]);

  const addCustomPack = () => {
    const n = parseInt(customPackInput, 10);
    if (n < 1 || n > 99) return;
    const merged = mergeUniqueSorted(derivedPackSizes, extraPackSizes);
    if (merged.includes(n)) {
      setCustomPackInput("");
      return;
    }
    setExtraPackSizes((prev) => mergeUniqueSorted(prev, [n]));
    setCustomPackInput("");
  };

  const removeExtraPack = (pack: number) => {
    setExtraPackSizes((prev) => prev.filter((p) => p !== pack));
  };

  const selectedBreeder = useMemo(
    () => breeders.find((b) => String(b.id) === breederId),
    [breeders, breederId]
  );

  useEffect(() => {
    setExportBreederLogoOk(true);
  }, [selectedBreeder?.logo_url]);

  const addNewStrain = () => {
    const packsToUse = packs.length ? packs : DEFAULT_PACKS;
    const byPack: Record<number, { stock: number; cost: number; price: number }> = {};
    const variantIdsByPack: Record<number, number | null> = {};
    for (const p of packsToUse) {
      byPack[p] = { stock: 0, cost: 0, price: 0 };
      variantIdsByPack[p] = null;
    }
    const cat = category === "all" ? categoryOptionsForGrid[0] : categoryOptionsForGrid.find((c) => c.id === category);
    const newRow: InventoryRow = {
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
      syncStatus: "pending",
    };
    setRows((prev) => [newRow, ...prev]);
    setLastAddedRowId(newRow.productId);
  };

  const syncableNewCount = useMemo(
    () => sortedRows.filter(isManualGridNewItemReadyToSync).length,
    [sortedRows]
  );

  const updateRow = (rowId: number, updates: Partial<InventoryRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.productId === rowId ? { ...r, ...updates } : r))
    );
  };

  const handleNameChange = (row: InventoryRow, name: string) => {
    const updates: Partial<InventoryRow> = { name };
    if (row.isNew && selectedBreeder && name.trim()) {
      const prefix = toBreederPrefix(selectedBreeder.name);
      const part = toProductPart(name);
      updates.masterSku = `${prefix}-${part}`;
    }
    updateRow(row.productId, updates);
  };

  const handleMasterSkuChange = (row: InventoryRow, masterSku: string) => {
    if (row.isNew) updateRow(row.productId, { masterSku });
  };

  const handleCategoryChange = (row: InventoryRow, categoryId: string) => {
    const cat = categoryOptionsForGrid.find((c) => c.id === categoryId);
    updateRow(row.productId, { categoryId: categoryId === "__none__" ? "" : categoryId, category: cat?.name ?? "" });
  };

  const [savingDominance, setSavingDominance] = useState<number | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const handlePhotoUpload = async (row: InventoryRow, files: FileList | null) => {
    if (!files?.[0] || row.isNew) return;
    setUploadingPhoto(row.productId);
    try {
      const urls = await processAndUploadImages([files[0]], {
        productKey: `id-${row.productId}`,
        replaceUrls: [row.imageUrl],
      });
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

  const handleStrainDominanceChange = async (row: InventoryRow, value: string) => {
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

  const handleCellChange = (row: InventoryRow, pack: number, field: "stock" | "cost" | "price" | "low_stock_threshold", value: number) => {
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
    const b = breeders.find((x) => String(x.id) === breederId);
    const raw = b?.allowed_packages;
    let sizes: number[] = [...DEFAULT_PACKS];
    let active: number[] = [...DEFAULT_PACKS];
    if (Array.isArray(raw)) {
      sizes = [...raw];
      active = [...raw];
    } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      sizes = raw.sizes?.length ? [...raw.sizes] : sizes;
      active = raw.active?.length ? [...raw.active] : active;
    }
    const mergedSizes = mergeUniqueSorted(sizes, extraPackSizes);
    const mergedActive = mergeUniqueSorted(active, extraPackSizes);
    setConfigSaving(true);
    try {
      const res = await fetch(`/api/admin/breeders/${breederId}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowed_packages: {
            sizes: mergedSizes.length ? mergedSizes : DEFAULT_PACKS,
            active: mergedActive.length ? mergedActive : mergedSizes.length ? mergedSizes : DEFAULT_PACKS,
            manual_grid_extra_packs: extraPackSizes,
          },
        }),
      });
      if (res.ok) {
        await fetchBreeders();
        await fetchGrid();
      }
    } finally {
      setConfigSaving(false);
    }
  };

  const saveOrUpdateCell = (
    variantId: number | null,
    pack: number,
    row: InventoryRow,
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
    row: InventoryRow,
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

  const buildCleanByPack = useCallback(
    (row: InventoryRow) => {
      const cleanByPack: Record<number, InventoryPackCell> = {};
      for (const packSize of packs) {
        if (typeof packSize !== "number" || packSize < 1 || packSize > 99) continue;
        const cell = row.byPack?.[packSize];
        const c = cell && typeof cell === "object" && !Array.isArray(cell) ? cell : null;
        const stock = c != null ? Math.max(0, Number(c.stock) || 0) : 0;
        const cost = c != null ? Math.max(0, Number(c.cost) || 0) : 0;
        const price = c != null ? Math.max(0, Number(c.price) || 0) : 0;
        cleanByPack[packSize] = { stock, cost, price };
      }
      return cleanByPack;
    },
    [packs]
  );

  const mergeSyncedInventoryRow = useCallback((prev: InventoryRow, gr: SyncInventoryRowPayload): InventoryRow => {
    const byPackRaw = gr.byPack;
    const vid = gr.variantIdsByPack;
    const lowTh = gr.lowStockThresholdByPack;
    const packsIn = Array.isArray(gr.packs) ? gr.packs : undefined;
    const packKeys = packsIn?.length ? packsIn : prev.packs;
    return {
      ...prev,
      productId: typeof gr.productId === "number" ? gr.productId : prev.productId,
      masterSku: typeof gr.masterSku === "string" ? gr.masterSku : prev.masterSku,
      name: typeof gr.name === "string" ? gr.name : prev.name,
      imageUrl: (gr.imageUrl as string | null | undefined) ?? prev.imageUrl,
      strainDominance: (gr.strainDominance as InventoryRow["strainDominance"]) ?? prev.strainDominance,
      category: typeof gr.category === "string" ? gr.category : prev.category,
      productCategory: (gr.productCategory as InventoryRow["productCategory"]) ?? prev.productCategory,
      categoryId: typeof gr.categoryId === "string" ? gr.categoryId : prev.categoryId,
      floweringType:
        gr.floweringType === null || typeof gr.floweringType === "string"
          ? (gr.floweringType as string | null)
          : prev.floweringType,
      packs: packKeys,
      byPack: byPackRaw != null ? normalizeByPack(byPackRaw, packKeys) : prev.byPack,
      variantIdsByPack: vid ?? prev.variantIdsByPack,
      lowStockThresholdByPack: lowTh ?? prev.lowStockThresholdByPack,
      isNew: undefined,
      syncStatus: "synced",
    };
  }, []);

  const syncRowToServer = useCallback(
    async (row: InventoryRow): Promise<InventoryRow> => {
      if (!row.masterSku?.trim()) throw new Error("Master SKU จำเป็น");
      const isPhoto3n = row.categoryId === FLOWERING_DB_PHOTO_3N;
      const shouldClearPhoto3n = !isPhoto3n && row.floweringType === FLOWERING_DB_PHOTO_3N;
      const catId = isPhoto3n
        ? undefined
        : row.categoryId || (row.category && categoryOptionsForGrid.find((c) => c.name === row.category)?.id);
      const catName = isPhoto3n
        ? "Photo 3N"
        : row.category || (row.categoryId && categoryOptionsForGrid.find((c) => c.id === row.categoryId)?.name) || null;
      const cleanByPack = buildCleanByPack(row);
      const payload: Record<string, unknown> = {
        masterSku: row.masterSku.trim(),
        breederId: Number(breederId),
        name: row.name || row.masterSku,
        category: catName,
        categoryId: catId || undefined,
        strain_dominance: row.strainDominance !== undefined ? row.strainDominance : undefined,
        byPack: cleanByPack,
        packSizes: packs,
      };
      if (isPhoto3n || shouldClearPhoto3n) {
        payload.flowering_type = isPhoto3n ? FLOWERING_DB_PHOTO_3N : null;
      }
      const res = await fetch("/api/admin/inventory/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string; gridRow?: SyncInventoryRowPayload };
      if (!res.ok) throw new Error(json.error ?? "Sync ล้มเหลว");
      if (!json.gridRow) throw new Error("ไม่ได้รับข้อมูลหลัง sync");
      return mergeSyncedInventoryRow(row, json.gridRow);
    },
    [breederId, buildCleanByPack, categoryOptionsForGrid, mergeSyncedInventoryRow, packs]
  );

  const handleSync = async (row: InventoryRow) => {
    if (!row.masterSku?.trim()) return;
    setSyncing(row.productId);
    try {
      await syncRowToServer(row);
      await fetchGrid();
      toast({
        title: "สำเร็จ (Success)",
        description: "Sync เรียบร้อย — ข้อมูลอัปเดตในกริดแล้ว",
      });
    } catch (e) {
      toast({
        title: "เกิดข้อผิดพลาด (Error)",
        description: toastErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setSyncing(null);
    }
  };

  const handleEditStrain = (row: InventoryRow) => {
    if (row.isNew) return;
    setStrainSheetForm({
      name: row.name,
      categoryId: row.categoryId || row.productCategory?.id || "__none__",
      strainDominance: row.strainDominance || "__none__",
    });
    setEditingStrainId(row.productId);
  };

  const handleSaveStrainSheet = async () => {
    if (editingStrainId == null || !strainSheetForm || !breederId) return;
    const row = rows.find((r) => r.productId === editingStrainId);
    if (!row || row.isNew) return;
    if (!strainSheetForm.name.trim()) {
      toast({ title: "กรุณากรอกชื่อสายพันธุ์", variant: "destructive" });
      return;
    }
    const catId = strainSheetForm.categoryId === "__none__" ? "" : strainSheetForm.categoryId;
    const cat = categoryOptionsForGrid.find((c) => c.id === catId);
    const valDominance =
      strainSheetForm.strainDominance === "__none__"
        ? null
        : (strainSheetForm.strainDominance as "Mostly Indica" | "Mostly Sativa" | "Hybrid 50/50");
    const updated: InventoryRow = {
      ...row,
      name: strainSheetForm.name.trim(),
      categoryId: catId,
      category: cat?.name ?? row.category,
      strainDominance: valDominance,
    };
    setStrainSheetSaving(true);
    try {
      await syncRowToServer(updated);
      await fetchGrid();
      setEditingStrainId(null);
      setStrainSheetForm(null);
      toast({
        title: "บันทึกแล้ว",
        description: "อัปเดตสายพันธุ์และ Sync เรียบร้อย",
      });
    } catch (e) {
      toast({
        title: "บันทึกไม่สำเร็จ",
        description: toastErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setStrainSheetSaving(false);
    }
  };

  const runBatchSyncNewItems = useCallback(async () => {
    const targets = sortedRows.filter(isManualGridNewItemReadyToSync);
    if (targets.length === 0 || !breederId) return;
    setBatchSyncing(true);
    const progressToast = toast({
      title: "กำลัง Sync…",
      description: `0/${targets.length}`,
    });
    let ok = 0;
    let fail = 0;
    try {
      for (let i = 0; i < targets.length; i++) {
        const row = targets[i];
        setBatchSyncLabel(`${i + 1}/${targets.length}`);
        progressToast.update({
          id: progressToast.id,
          title: "กำลัง Sync…",
          description: `Syncing ${i + 1}/${targets.length} strains…`,
        });
        try {
          await syncRowToServer(row);
          setSelectedProductIds((prev) => {
            const next = new Set(prev);
            next.delete(row.productId);
            return next;
          });
          ok += 1;
        } catch {
          fail += 1;
        }
      }
      progressToast.dismiss();
      await fetchGrid();
      toast({
        title: fail === 0 ? "สำเร็จ (Success)" : "เสร็จสิ้น (Done)",
        description:
          fail === 0
            ? `Sync ครบ ${ok} สายพันธุ์แล้ว`
            : `สำเร็จ ${ok} — ล้มเหลว ${fail}`,
        variant: fail > 0 ? "destructive" : undefined,
      });
    } finally {
      setBatchSyncing(false);
      setBatchSyncLabel("");
    }
  }, [sortedRows, breederId, syncRowToServer, fetchGrid, toast]);

  const handleDeleteClick = (row: InventoryRow) => {
    if (row.isNew) {
      setRows((prev) => prev.filter((r) => r.productId !== row.productId));
      return;
    }
    if (row.productId <= 0) return;
    setRowPendingDelete(row);
  };

  const confirmDeleteRow = async () => {
    const row = rowPendingDelete;
    if (!row || row.productId <= 0) return;
    setDeleting(row.productId);
    setFetchError(null);
    try {
      const res = await fetch(`/api/admin/inventory/products/${row.productId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "ลบไม่สำเร็จ");
      toast({
        title: "สำเร็จ (Success)",
        description: `ลบ "${row.name || row.masterSku}" เรียบร้อยแล้ว / Product and variants removed.`,
      });
      setRowPendingDelete(null);
      await fetchGrid();
    } catch (e) {
      const msg = toastErrorMessage(e);
      setFetchError(msg);
      toast({
        title: "เกิดข้อผิดพลาด (Error)",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const captureExportElement = async () => {
    const el = exportRef.current;
    if (!el) return null;
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
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
      cacheBust: true,
      style: { transform: "none", fontFamily: "'Prompt', 'Inter', sans-serif" },
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
    if (!selectedBreeder || exportRows.length === 0) return;
    setExporting("pdf");
    try {
      ensurePdfPromptFont();
      const { logoMainSrc, breederLogoSrc } = await resolvePdfLogos({
        mainUrl: settings.logo_main_url,
        breederUrl: selectedBreeder.logo_url,
      });
      const pdfRows = exportRows.map((r, i) => ({
        productId: r.productId,
        index: i + 1,
        name: r.name,
        geneticsLabel: r.strainDominance?.trim() || "—",
        categoryLabel: (r.productCategory?.name ?? r.category) || "—",
        byPack: r.byPack,
      }));
      const blob = await pdf(
        <InventoryPdfDocument
          rows={pdfRows}
          breederName={selectedBreeder.name}
          logoMainSrc={logoMainSrc ?? null}
          breederLogoSrc={breederLogoSrc ?? null}
          websiteLine="www.smileseedbank.com"
          qrCodeDataUri={qrDataUrl}
          packs={packs}
          showCost={showCost}
          showFooter={showFooter}
          footerTotals={exportFooterTotals}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `smile-seed-bank-${selectedBreeder.name.replace(/\s+/g, "-")}-price-list.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      const msg = toastErrorMessage(e);
      toast({ title: "ส่งออก PDF ไม่สำเร็จ", description: msg, variant: "destructive" });
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
      <ConfirmDeleteDialog
        isOpen={rowPendingDelete !== null}
        onClose={() => setRowPendingDelete(null)}
        onConfirm={confirmDeleteRow}
        loading={
          rowPendingDelete !== null && deleting === rowPendingDelete.productId
        }
        title="ยืนยันการลบ / Confirm Deletion"
        description={
          rowPendingDelete
            ? `ลบ "${rowPendingDelete.name || rowPendingDelete.masterSku}" และ variants ทั้งหมด? การดำเนินการนี้ไม่สามารถย้อนกลับได้ / This removes the product and all variants. This cannot be undone.`
            : "คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้? การกระทำนี้ไม่สามารถย้อนกลับได้ / Are you sure you want to delete this? This action cannot be undone."
        }
      />
      <AlertDialog open={syncNewItemsDialogOpen} onOpenChange={setSyncNewItemsDialogOpen}>
        <AlertDialogContent className="border-emerald-200/60 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-900">Sync new strains</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-600">
              Syncing {syncableNewCount} new strains to the main catalog. Proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-200">Cancel</AlertDialogCancel>
            <Button
              type="button"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={async () => {
                setSyncNewItemsDialogOpen(false);
                await runBatchSyncNewItems();
              }}
            >
              Proceed
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Sheet
        open={editingStrainId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingStrainId(null);
            setStrainSheetForm(null);
          }
        }}
      >
        <SheetContent className="flex flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>แก้ไขสายพันธุ์ / Edit strain</SheetTitle>
            <SheetDescription>
              อัปเดตชื่อ หมวดหมู่ และประเภทพันธุกรรม จากนั้นบันทึกเพื่อ Sync ไปยัง catalog (Prisma products)
            </SheetDescription>
          </SheetHeader>
          {strainSheetForm && editingStrainId != null ? (
            <div className="flex-1 space-y-4 overflow-y-auto py-2">
              <div className="space-y-1.5">
                <Label>Master SKU</Label>
                <Input
                  readOnly
                  value={rows.find((r) => r.productId === editingStrainId)?.masterSku ?? ""}
                  className="h-9 font-mono text-xs bg-muted"
                />
              </div>
              <div className="space-y-1.5">
                <Label>ชื่อสายพันธุ์ / Name</Label>
                <Input
                  value={strainSheetForm.name}
                  onChange={(e) =>
                    setStrainSheetForm((f) => (f ? { ...f, name: e.target.value } : f))
                  }
                  className="h-9"
                  placeholder="Strain name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>หมวดหมู่ / Category</Label>
                <Select
                  value={strainSheetForm.categoryId === "" ? "__none__" : strainSheetForm.categoryId}
                  onValueChange={(v) =>
                    setStrainSheetForm((f) => (f ? { ...f, categoryId: v } : f))
                  }
                >
                  <SelectTrigger className="h-9 border-primary/25">
                    <SelectValue placeholder="— เลือกหมวดหมู่ —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— เลือกหมวดหมู่ —</SelectItem>
                    {categoryOptionsForGrid.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>ประเภทพันธุกรรม / Genetic type</Label>
                <Select
                  value={strainSheetForm.strainDominance}
                  onValueChange={(v) =>
                    setStrainSheetForm((f) => (f ? { ...f, strainDominance: v } : f))
                  }
                >
                  <SelectTrigger className="h-9 border-primary/25">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— ประเภทพันธุกรรม —</SelectItem>
                    <SelectItem value="Mostly Indica">Mostly Indica</SelectItem>
                    <SelectItem value="Hybrid 50/50">Hybrid 50/50</SelectItem>
                    <SelectItem value="Mostly Sativa">Mostly Sativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
          <SheetFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingStrainId(null);
                setStrainSheetForm(null);
              }}
              disabled={strainSheetSaving}
            >
              ยกเลิก
            </Button>
            <Button type="button" onClick={handleSaveStrainSheet} disabled={strainSheetSaving}>
              {strainSheetSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              บันทึกและ Sync
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
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
              <Select value={category} onValueChange={applyCategory}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {categoryOptionsForGrid.map((c) => (
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
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  ref={searchInputRef}
                  placeholder="ค้นหาชื่อสายพันธุ์ หรือ SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-[220px] rounded-md border-zinc-200 pl-8 pr-9 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {searchQuery.trim() !== "" && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full text-zinc-400 transition hover:text-emerald-500 focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary/30"
                    onClick={() => {
                      setSearchQuery("");
                      queueMicrotask(() => searchInputRef.current?.focus());
                    }}
                  >
                    <XCircle className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600">
              <span className="font-medium text-zinc-700">
                Smart columns (แพ็กที่มีสต็อกหรือราคาขาย {'>'} 0 เท่านั้น / stocked or priced only):
              </span>
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono tabular-nums">
                {derivedPackSizes.length
                  ? derivedPackSizes.join(", ")
                  : "— (ไม่มีแพ็ก active — ใช้ค่าเริ่มต้น 1,2,3,5 จนกว่าจะมีสต็อก/ราคา)"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-xs text-zinc-500">
                Always show (แสดงแม้ยัง 0 สต็อก/ราคา — สำหรับกรอกใหม่; บันทึกกับ Breeder)
              </Label>
              {extraPackSizes.map((pack) => (
                <div key={pack} className="group relative">
                  <span className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/5 px-2.5 py-1 text-sm font-medium text-primary">
                    {pack} {pack === 1 ? "Seed" : "Seeds"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExtraPack(pack)}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-300 text-white opacity-0 transition hover:bg-red-500 group-hover:opacity-100"
                    title="ลบออกจาก Always show"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
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
                className="ml-1"
              >
                {configSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                บันทึก Config
              </Button>
            </div>
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
                  className="border-primary/30 text-primary hover:bg-accent"
                >
                  {exporting === "png" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : "📸"}
                  {" "}Export PNG
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportPDF}
                  disabled={!!exporting}
                  className="border-primary/30 text-primary hover:bg-accent"
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
                    className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
                  />
                  ซ่อนสินค้าหมด
                </label>
                <label className="flex cursor-pointer items-center gap-2 border-l border-zinc-200 pl-2 text-sm text-zinc-600">
                  <Switch
                    checked={!showCost}
                    onCheckedChange={(checked) => setShowCost(!checked)}
                    className="scale-90"
                  />
                  <span>ซ่อนราคาทุน / Hide Cost</span>
                </label>
                <label
                  className="flex cursor-pointer items-center gap-2 border-l border-zinc-200 pl-2 text-sm text-zinc-600"
                  title="ปิดก่อนส่งออก PNG/PDF ให้ลูกค้า — ซ่อนยอดรวม / Hide summary row before customer export"
                >
                  <Switch checked={showFooter} onCheckedChange={setShowFooter} className="scale-90" />
                  <span>แสดงแถวสรุป / Show Summary</span>
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSyncNewItemsDialogOpen(true)}
                  disabled={syncableNewCount === 0 || batchSyncing || !breederId}
                  className="border-emerald-500/40 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-500/60"
                  title="Sync all new draft strains in the current filtered view (Master SKU required). No checkbox selection needed."
                >
                  {batchSyncing ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin text-emerald-700" />
                  ) : (
                    <>
                      <Sparkles className="mr-1 h-4 w-4 text-emerald-600" />
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                    </>
                  )}
                  {syncableNewCount > 0
                    ? `Sync ${syncableNewCount} New Items`
                    : "Sync New Items"}
                  {batchSyncing && batchSyncLabel ? ` (${batchSyncLabel})` : ""}
                </Button>
                <Button
                  size="sm"
                  onClick={addNewStrain}
                  disabled={batchSyncing}
                  className="bg-primary text-white hover:bg-primary/90"
                >
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
              {rows.length > 0 && visibleRows.length === 0
                ? searchQuery.trim()
                  ? "ไม่พบผลลัพธ์ที่ตรงกับคำค้นหา"
                  : "รายการถูกกรองหมด — ลองปิดตัวเลือก ซ่อนสินค้าหมด / สต็อกต่ำ หรือล้างช่องค้นหา"
                : searchQuery.trim()
                  ? "ไม่พบผลลัพธ์ที่ตรงกับคำค้นหา"
                  : "ยังไม่มีสินค้าในระบบสำหรับ Breeder นี้"}
            </div>
          ) : (
            <>
            <div className="overflow-x-auto scroll-smooth overscroll-x-contain">
              <table className="w-full min-w-max text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="sticky left-0 z-10 w-[50px] bg-slate-50 px-1 py-3 text-center text-xs font-medium text-muted-foreground">
                      ลำดับ
                    </th>
                    <th className="sticky left-[50px] z-10 w-10 bg-slate-50 px-1 py-3">
                      <input
                        type="checkbox"
                        checked={sortedRows.length > 0 && sortedRows.every((r) => selectedProductIds.has(r.productId))}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                        title="เลือกทั้งหมด"
                      />
                    </th>
                    <th className="sticky left-[90px] z-10 bg-slate-50 px-2 py-3 text-left font-medium text-slate-700">Sync</th>
                    <th className="sticky left-[132px] z-10 w-10 bg-slate-50 px-1 py-3" />
                    <th className="sticky left-[172px] z-10 w-12 bg-slate-50 px-2 py-3 text-left font-medium text-slate-700">Photo</th>
                    <th className="sticky left-[224px] z-10 min-w-[90px] bg-slate-50 px-3 py-3 text-left font-medium text-slate-700">Master SKU</th>
                    <th className="sticky left-[314px] z-10 min-w-[160px] bg-slate-50 px-3 py-3 text-left font-medium text-slate-700">ชื่อสายพันธุ์</th>
                    <th className="min-w-[100px] px-3 py-3 text-left font-medium text-slate-700">หมวดหมู่</th>
                    <th className="min-w-[100px] px-3 py-3 text-left font-medium text-slate-700">ประเภทพันธุกรรม</th>
                    {packs.map((p) => (
                      <th
                        key={p}
                        colSpan={packSpan}
                        className={`${packGroupWidthClass} border-l border-slate-200 px-0 py-3 text-center font-medium text-primary transition-[width] duration-150`}
                      >
                        {p} {p === 1 ? "Seed" : "Seeds"}
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-100/60">
                    <th colSpan={9} className="px-3 py-1.5" />
                    {packs.map((p) => (
                      <th
                        key={`${p}-s`}
                        colSpan={packSpan}
                        className={`${packGroupWidthClass} border-l border-slate-200 px-0 py-1.5 transition-[width] duration-150`}
                      >
                        <div className="flex divide-x divide-slate-300 text-[10px] font-normal text-slate-500">
                          <span className="flex-1 py-0.5">Stock</span>
                          {showCost && <span className="flex-1 py-0.5">Cost (ทุน)</span>}
                          <span className="flex-1 py-0.5">Price (ราคา)</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row, rowIdx) => {
                    const rowTotalStock = totalStockForRow(row);
                    const isUnsynced = isManualGridRowUnsynced(row);
                    const isRowDimmed = !row.isNew && rowTotalStock === 0;
                    const zebra = (rowOffset + rowIdx) % 2 === 1 ? "bg-slate-50/50" : "";
                    return (
                    <tr
                      key={row.productId}
                      className={`group border-b border-slate-100 transition-colors hover:bg-accent/30 ${isUnsynced ? "bg-amber-50/50" : zebra}`}
                    >
                      <td
                        className={`sticky left-0 z-10 w-[50px] px-1 py-2 text-center font-mono text-sm text-muted-foreground tabular-nums transition-colors group-hover:bg-accent/30 ${isUnsynced ? "bg-amber-50/50" : zebra ? "bg-slate-50/50" : "bg-white"}`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>{rowOffset + rowIdx + 1}</span>
                          {isUnsynced && (
                            <Badge
                              variant="secondary"
                              className="border border-amber-200/90 bg-amber-100 px-1.5 py-0 text-[10px] font-semibold text-amber-950"
                            >
                              New
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className={`sticky left-[50px] z-10 w-10 px-1 py-2 transition-colors group-hover:bg-accent/30 ${isUnsynced ? "bg-amber-50/50" : zebra ? "bg-slate-50/50" : "bg-white"}`}>
                        <input
                          type="checkbox"
                          checked={selectedProductIds.has(row.productId)}
                          onChange={() => toggleSelectRow(row.productId)}
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                      </td>
                      <td className={`sticky left-[90px] z-10 px-2 py-2 transition-colors group-hover:bg-accent/30 ${isUnsynced ? "bg-amber-50/50" : zebra ? "bg-slate-50/50" : "bg-white"}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 min-w-[2rem] border-emerald-200/80 px-2 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400/60"
                          onClick={() => handleSync(row)}
                          disabled={batchSyncing || syncing === row.productId || (row.isNew && !row.masterSku?.trim())}
                          title={row.isNew ? "Sync: สร้าง product + variants" : "Sync/Link ไปยัง Product Detail"}
                        >
                          {syncing === row.productId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
                          )}
                        </Button>
                      </td>
                      <td className={`sticky left-[132px] z-10 w-10 px-1 py-2 transition-colors group-hover:bg-accent/30 ${isUnsynced ? "bg-amber-50/50" : zebra ? "bg-slate-50/50" : "bg-white"}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDeleteClick(row)}
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
                      <td className={`sticky left-[172px] z-10 w-12 px-2 py-2 transition-colors group-hover:bg-accent/30 ${isUnsynced ? "bg-amber-50/50" : zebra ? "bg-slate-50/50" : "bg-white"}`}>
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
                      <td className={`sticky left-[224px] z-10 min-w-[90px] px-3 py-2 transition-colors group-hover:bg-accent/30 ${isRowDimmed ? "opacity-50" : ""} ${isUnsynced ? "bg-amber-50/50" : zebra ? "bg-slate-50/50" : "bg-white"}`}>
                        {row.isNew ? (
                          <Input
                            value={row.masterSku}
                            onChange={(e) => handleMasterSkuChange(row, e.target.value)}
                            placeholder="FB-ZKITTLEZ"
                            className="h-7 w-28 font-mono text-xs border-transparent focus:border-primary"
                            autoFocus={row.productId === lastAddedRowId}
                            onFocus={() => {
                              if (row.productId === lastAddedRowId) setLastAddedRowId(null);
                            }}
                          />
                        ) : (
                          <span className="font-mono text-xs text-slate-600">{row.masterSku || "—"}</span>
                        )}
                      </td>
                      <td className={`sticky left-[314px] z-10 min-w-[160px] px-3 py-2 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)] transition-colors group-hover:bg-accent/30 ${isRowDimmed ? "opacity-50" : ""} ${isUnsynced ? "bg-amber-50/50" : zebra ? "bg-slate-50/50" : "bg-white"}`}>
                        {row.isNew ? (
                          <Input
                            value={row.name}
                            onChange={(e) => handleNameChange(row, e.target.value)}
                            placeholder="Strain Name (auto-SKU)"
                            className="h-7 min-w-[120px] border-transparent focus:border-primary"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEditStrain(row)}
                            className="inline-flex max-w-full items-center gap-1.5 text-left font-medium text-primary hover:text-primary cursor-pointer"
                          >
                            <span className="min-w-0 truncate">{row.name}</span>
                            <Pencil className="h-3.5 w-3.5 shrink-0 text-primary opacity-80" aria-hidden />
                          </button>
                        )}
                      </td>
                      <td className="min-w-[120px] px-4 py-2">
                        <Select
                          value={row.categoryId || row.productCategory?.id || "__none__"}
                          onValueChange={(v) => handleCategoryChange(row, v)}
                        >
                          <SelectTrigger className="h-8 border-primary/25 bg-white text-xs text-primary hover:bg-accent/50">
                            <SelectValue placeholder="— เลือกหมวดหมู่ —" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— เลือกหมวดหมู่ —</SelectItem>
                            {categoryOptionsForGrid.map((c) => (
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
                            <SelectTrigger className="h-8 border-primary/25 bg-white text-xs text-primary hover:bg-accent/50">
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
                            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
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
                        const lowStock = stock > 0 && stock <= th;
                        const zeroStock = Math.max(0, Number(stock) || 0) === 0;
                        const packFadeClass = zeroStock
                          ? "opacity-[0.35] transition-opacity focus-within:opacity-100"
                          : "";
                        const key = `${row.productId}-${packSize}`;
                        const packCellClass = "w-[52px] border-l border-slate-100 px-1 py-2 align-top";
                        const outClass = outOfStock ? "bg-red-50/80" : "";
                        const lowClass = lowStock && !outOfStock ? "bg-amber-50/50" : "";
                        return (
                          <Fragment key={packSize}>
                            <td className={`${packCellClass} ${outClass} ${lowClass} ${packFadeClass}`}>
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
                            {showCost && (
                              <td className={`${packCellClass} ${packFadeClass}`}>
                                <EditableCell
                                  value={cost}
                                  saving={!row.isNew && savingCell === `${key}-cost`}
                                  onSave={(v) => saveOrUpdateCell(variantId, packSize, row, "cost", v)}
                                  prefix="฿"
                                />
                              </td>
                            )}
                            <td className={`${packCellClass} ${packFadeClass} ${outOfStock ? "bg-red-50/80" : ""}`}>
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
                {showFooter && sortedRows.length > 0 ? (
                <tfoot>
                  <tr className="border-t-2 border-slate-300 bg-muted/50 font-bold text-sm shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
                    <td
                      colSpan={7}
                      className="sticky left-0 z-10 min-w-0 bg-muted/50 px-3 py-2.5 align-top shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]"
                    >
                      <div className="max-w-[min(100vw,520px)] space-y-1">
                        <div className="text-xs font-bold leading-tight text-foreground">รวมทั้งหมด (Total)</div>
                        <div className="text-[10px] font-semibold tabular-nums leading-snug text-muted-foreground">
                          สายพันธุ์ {footerTotals.totalStrains} · สต็อกรวม {footerTotals.totalStockAll}
                        </div>
                        {showCost && (
                          <div className="text-[10px] font-semibold tabular-nums leading-snug text-slate-800">
                            มูลค่าทุนรวม ฿{footerTotals.grandCostValue.toLocaleString("th-TH")}
                          </div>
                        )}
                        <div className="text-[10px] font-semibold tabular-nums leading-snug text-primary">
                          มูลค่าขายรวม ฿{footerTotals.grandPriceValue.toLocaleString("th-TH")}
                        </div>
                      </div>
                    </td>
                    <td className="min-w-[120px] bg-muted/50 px-4 py-2" aria-hidden />
                    <td className="min-w-[120px] bg-muted/50 px-4 py-2" aria-hidden />
                    {packs.map((packSize) => {
                      const packFooterClass =
                        "w-[52px] border-l border-slate-200 bg-muted/50 px-1 py-2 align-top tabular-nums";
                      return (
                        <Fragment key={`tfoot-${packSize}`}>
                          <td className={`${packFooterClass} text-right`}>
                            {footerTotals.perPackStock[packSize] ?? 0}
                          </td>
                          {showCost && (
                            <td className={`${packFooterClass} text-right`}>
                              ฿{(footerTotals.perPackCostValue[packSize] ?? 0).toLocaleString("th-TH")}
                            </td>
                          )}
                          <td className={`${packFooterClass} text-right text-primary`}>
                            ฿{(footerTotals.perPackPriceValue[packSize] ?? 0).toLocaleString("th-TH")}
                          </td>
                        </Fragment>
                      );
                    })}
                  </tr>
                </tfoot>
                ) : null}
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-muted/40 px-4 py-3">
              <p className="text-sm tabular-nums text-muted-foreground">{paginationLabel}</p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="items-per-page" className="whitespace-nowrap text-xs text-zinc-600">
                    แสดงต่อหน้า
                  </Label>
                  <Select
                    value={String(itemsPerPage)}
                    onValueChange={(v) => {
                      if (v === "all") setItemsPerPage("all");
                      else setItemsPerPage(Number(v) as 20 | 50 | 100);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger id="items-per-page" className="h-8 w-[100px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1 border-l border-zinc-200 pl-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    disabled={itemsPerPage === "all" || currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {itemsPerPage !== "all" && totalPages > 1 ? (
                    <div className="flex items-center gap-0.5">
                      {pageButtonParts.map((part, idx) =>
                        part === "ellipsis" ? (
                          <span key={`e-${idx}`} className="px-1 text-xs text-muted-foreground">
                            …
                          </span>
                        ) : (
                          <Button
                            key={part}
                            type="button"
                            variant={currentPage === part ? "default" : "outline"}
                            size="sm"
                            className="h-8 min-w-[2rem] px-2 text-xs"
                            onClick={() => setCurrentPage(part)}
                          >
                            {part}
                          </Button>
                        )
                      )}
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    disabled={itemsPerPage === "all" || currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            </>
          )}
          {!loading && breederId && rows.length === 0 && (
            <div className="py-12 text-center text-zinc-500">ไม่มีสินค้าตามเงื่อนไขนี้</div>
          )}
        </CardContent>
      </Card>

      {selectedProductIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-t border-slate-200 bg-white px-6 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <span className="text-sm font-medium text-slate-700">
            เลือกแล้ว <span className="font-semibold text-primary">{selectedProductIds.size}</span> รายการ
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
            <Button size="sm" className="bg-primary text-white hover:bg-primary/90" onClick={() => goToQuotationBuilder()}>
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
          <div className="flex items-center justify-between gap-6 border-b-2 border-primary bg-accent/50 px-6 pt-8 pb-6">
            <div className="w-16 flex-shrink-0" aria-hidden />
            <div className="flex flex-1 flex-col items-center justify-center gap-y-1 text-center">
              {settings.logo_main_url && exportMainLogoOk ? (
                <img
                  src={settings.logo_main_url}
                  alt="Smile Seed Bank"
                  className="h-20 w-auto max-w-[200px] object-contain"
                  onError={() => setExportMainLogoOk(false)}
                />
              ) : (
                <div className="flex h-20 w-24 flex-shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-accent">
                  {settings.logo_main_url ? (
                    <Store className="h-10 w-10 text-primary" aria-hidden />
                  ) : (
                    <span className="text-xl font-bold text-primary">SB</span>
                  )}
                </div>
              )}
              <p className="text-sm font-medium text-primary">www.smileseedbank.com</p>
              <div className="flex items-center justify-center">
                {selectedBreeder?.logo_url && exportBreederLogoOk ? (
                  <img
                    src={selectedBreeder.logo_url}
                    alt=""
                    crossOrigin="anonymous"
                    className="mr-2 h-10 w-auto max-h-10 max-w-[120px] object-contain"
                    onError={() => setExportBreederLogoOk(false)}
                  />
                ) : (
                  <div className="mr-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-accent">
                    <Sprout className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                )}
                <span className="text-xs text-zinc-500">{selectedBreeder?.name ?? "Price List"}</span>
              </div>
            </div>
            <div className="flex w-16 flex-shrink-0 justify-end">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR" width={64} height={64} className="rounded-lg border border-primary/25" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-primary/25 bg-white text-[10px] text-zinc-400">QR</div>
              )}
            </div>
          </div>
          <div className="p-6">
        <table className="w-full table-fixed border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-primary bg-accent">
              <th className="w-[36px] px-1 py-2 text-left font-semibold text-primary">Photo</th>
              <th className="w-[140px] px-2 py-2 text-left font-semibold text-primary">Strain Name</th>
              <th className="w-[70px] px-2 py-2 text-left font-semibold text-primary">Category</th>
              <th className="w-[90px] px-2 py-2 text-left font-semibold text-primary">ประเภทพันธุกรรม</th>
              {packs.map((p) => (
                <th
                  key={p}
                  colSpan={packSpan}
                  className={`${showCost ? "w-[120px]" : "w-[80px]"} px-1 py-2 text-center font-semibold text-primary transition-[width] duration-150`}
                >
                  {p} {p === 1 ? "Seed" : "Seeds"}
                </th>
              ))}
            </tr>
            <tr className="border-b border-primary/25 bg-accent/50">
              <th colSpan={4} className="px-2 py-1" />
              {packs.map((p) => (
                <th key={p} colSpan={packSpan} className="px-1 py-1 text-center text-[10px] font-normal text-primary">
                  {showCost ? "Stock | Cost | Price" : "Stock | Price"}
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
                <td className="max-w-[70px] break-words px-2 py-2 text-primary">{(row.productCategory?.name ?? row.category) ?? "—"}</td>
                <td className="max-w-[90px] break-words px-2 py-2 text-primary">{row.strainDominance || "—"}</td>
                {packs.map((packSize) => {
                  const stock = row.byPack?.[packSize]?.stock ?? 0;
                  const cost = row.byPack?.[packSize]?.cost ?? 0;
                  const price = row.byPack?.[packSize]?.price ?? 0;
                  const outOfStock = stock === 0;
                  return (
                    <td key={packSize} colSpan={packSpan} className="px-1 py-2 text-center text-zinc-700">
                      {outOfStock ? (
                        <span className="text-zinc-400">หมด</span>
                      ) : (
                        <>
                          <span className="font-medium">{stock}</span>
                          {showCost && (
                            <>
                              <span className="text-zinc-400"> | </span>
                              <span className="font-medium">{cost > 0 ? cost.toLocaleString("th-TH") : "—"}</span>
                            </>
                          )}
                          <span className="text-zinc-400"> | </span>
                          <span className="font-medium text-primary">{price > 0 ? price.toLocaleString("th-TH") : "—"}</span>
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {showFooter && exportRows.length > 0 ? (
            <tfoot>
              <tr className="border-t-2 border-primary/30 bg-muted/50 font-bold text-xs">
                <td colSpan={4} className="px-2 py-2 align-top">
                  <div className="max-w-[360px] space-y-0.5">
                    <div className="font-bold text-foreground">รวมทั้งหมด (Total)</div>
                    <div className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                      สายพันธุ์ {exportFooterTotals.totalStrains} · สต็อกรวม {exportFooterTotals.totalStockAll}
                    </div>
                    {showCost && (
                      <div className="text-[10px] font-semibold tabular-nums text-slate-800">
                        มูลค่าทุนรวม ฿{exportFooterTotals.grandCostValue.toLocaleString("th-TH")}
                      </div>
                    )}
                    <div className="text-[10px] font-semibold tabular-nums text-primary">
                      มูลค่าขายรวม ฿{exportFooterTotals.grandPriceValue.toLocaleString("th-TH")}
                    </div>
                  </div>
                </td>
                {packs.map((packSize) => (
                  <td
                    key={`export-tfoot-${packSize}`}
                    colSpan={packSpan}
                    className="border-l border-primary/15 px-1 py-2 text-center tabular-nums text-zinc-800"
                  >
                    <span className="font-medium">{exportFooterTotals.perPackStock[packSize] ?? 0}</span>
                    {showCost && (
                      <>
                        <span className="text-zinc-400"> | </span>
                        <span>฿{(exportFooterTotals.perPackCostValue[packSize] ?? 0).toLocaleString("th-TH")}</span>
                      </>
                    )}
                    <span className="text-zinc-400"> | </span>
                    <span className="font-medium text-primary">
                      ฿{(exportFooterTotals.perPackPriceValue[packSize] ?? 0).toLocaleString("th-TH")}
                    </span>
                  </td>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </table>
        <div className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-6">
          <p className="text-sm text-zinc-600">
            Contact us at Line: <span className="font-semibold text-primary">{lineId ? (lineId.startsWith("@") ? lineId : `@${lineId}`) : "@smileseedbank"}</span>
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
