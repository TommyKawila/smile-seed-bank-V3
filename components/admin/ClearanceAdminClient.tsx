"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  PackageX,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  CLEARANCE_DISCOUNT_PERCENT,
  CLEARANCE_DISCOUNT_PRESETS,
  CLEARANCE_BREEDER_BANNER,
  clearanceBreederBannerSizeLabel,
  normalizeClearanceDiscountPercent,
} from "@/lib/clearance";
import { formatPrice, cn } from "@/lib/utils";
import { computeTotalStock } from "@/lib/product-utils";
import type { ProductFull } from "@/types/supabase";
import type { ClearanceBreederSummary } from "@/lib/clearance";

type PickerVariant = {
  id: number;
  unit_label?: string | null;
  price?: number | null;
  stock?: number | null;
  is_active?: boolean | null;
  clearance_price?: number | null;
};

type PickerRow = {
  id: number;
  name: string;
  image_url: string | null;
  stock?: number | null;
  breeders?: { name: string } | null;
  is_clearance?: boolean | null;
  product_variants?: PickerVariant[] | null;
};

type ClearancePackRow = {
  productId: number;
  productName: string;
  imageUrl: string | null;
  variantId: number;
  unitLabel: string;
  listPrice: number;
  clearancePrice: number;
  discountPercent: number;
};

const NO_BREEDER_KEY = -1;

function pickerRowHasStock(row: PickerRow): boolean {
  if (row.product_variants?.length) {
    return computeTotalStock(row.product_variants) > 0;
  }
  return Number(row.stock ?? 0) > 0;
}

function productBreederId(p: ProductFull): number {
  const id = p.breeder_id != null ? Number(p.breeder_id) : NaN;
  return Number.isFinite(id) && id > 0 ? id : NO_BREEDER_KEY;
}

function productClearancePercent(p: ProductFull): number {
  return normalizeClearanceDiscountPercent(p.clearance_discount_percent);
}

function activePickerVariants(row: PickerRow): PickerVariant[] {
  return (row.product_variants ?? []).filter((v) => v.is_active !== false);
}

function packLabel(unitLabel: string | null | undefined, locale: "th" | "en" = "th"): string {
  const raw = unitLabel?.trim();
  if (!raw) return locale === "th" ? "แพ็ก" : "Pack";
  return raw;
}

function clearancePacksFromProduct(p: ProductFull): ClearancePackRow[] {
  const pct = productClearancePercent(p);
  const rows: ClearancePackRow[] = [];
  for (const v of p.product_variants ?? []) {
    const cp = Number(
      (v as { clearance_price?: number | null }).clearance_price ?? 0
    );
    if (!(cp > 0)) continue;
    rows.push({
      productId: p.id as number,
      productName: p.name,
      imageUrl: p.image_url,
      variantId: v.id as number,
      unitLabel: packLabel(v.unit_label),
      listPrice: Number(v.price ?? 0),
      clearancePrice: cp,
      discountPercent: pct,
    });
  }
  return rows;
}

export function ClearanceAdminClient() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductFull[]>([]);
  const [breederSummary, setBreederSummary] = useState<ClearanceBreederSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQ, setPickerQ] = useState("");
  const [pickerDebounced, setPickerDebounced] = useState("");
  const [pickerRows, setPickerRows] = useState<PickerRow[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerBreederId, setPickerBreederId] = useState("all");
  const [breederOptions, setBreederOptions] = useState<{ id: number; name: string }[]>([]);
  const [selectedVariantIds, setSelectedVariantIds] = useState<number[]>([]);
  const [listSelectedIds, setListSelectedIds] = useState<number[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bannerBusyId, setBannerBusyId] = useState<number | null>(null);
  const [expandedBreederId, setExpandedBreederId] = useState<number | null>(null);
  const [expandedPickerProductId, setExpandedPickerProductId] = useState<number | null>(null);
  const [viewPercent, setViewPercent] = useState<number | null>(null);
  const [addDiscountPercent, setAddDiscountPercent] = useState(CLEARANCE_DISCOUNT_PERCENT);
  const [rowPercentDraft, setRowPercentDraft] = useState<Record<number, string>>({});
  const [percentBusyId, setPercentBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clearance", { cache: "no-store" });
      const json = (await res.json()) as {
        products?: ProductFull[];
        breederSummary?: ClearanceBreederSummary[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "โหลดไม่สำเร็จ");
      setProducts(json.products ?? []);
      setBreederSummary(json.breederSummary ?? []);
      setListSelectedIds([]);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "โหลด Clearance ไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setPickerDebounced(pickerQ.trim()), 280);
    return () => clearTimeout(t);
  }, [pickerQ]);

  useEffect(() => {
    if (!pickerOpen) return;
    let cancelled = false;
    fetch("/api/admin/breeders")
      .then((r) => r.json())
      .then((data: { id: number | string; name: string; is_active?: boolean | null }[]) => {
        if (cancelled || !Array.isArray(data)) return;
        setBreederOptions(
          data
            .filter((b) => b.is_active !== false)
            .map((b) => ({ id: Number(b.id), name: b.name }))
            .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }))
        );
      })
      .catch(() => {
        if (!cancelled) setBreederOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [pickerOpen]);

  useEffect(() => {
    if (!pickerOpen) return;
    let cancelled = false;
    setPickerLoading(true);
    const params = new URLSearchParams({ limit: "40", isActive: "true", stockStatus: "sellable" });
    if (pickerDebounced) params.set("q", pickerDebounced);
    if (pickerBreederId !== "all") params.set("breeder", pickerBreederId);
    fetch(`/api/admin/products?${params}`)
      .then((r) => r.json())
      .then((data: { products?: PickerRow[] }) => {
        if (!cancelled) {
          setPickerRows((data.products ?? []).filter(pickerRowHasStock));
        }
      })
      .finally(() => {
        if (!cancelled) setPickerLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pickerOpen, pickerDebounced, pickerBreederId]);

  useEffect(() => {
    if (!pickerOpen) {
      setPickerQ("");
      setPickerDebounced("");
      setPickerBreederId("all");
      setSelectedVariantIds([]);
      setExpandedPickerProductId(null);
    }
  }, [pickerOpen]);

  const percentBuckets = useMemo(() => {
    const map = new Map<number, { products: ProductFull[]; breederIds: Set<number> }>();
    for (const p of products) {
      const pct = productClearancePercent(p);
      let bucket = map.get(pct);
      if (!bucket) {
        bucket = { products: [], breederIds: new Set() };
        map.set(pct, bucket);
      }
      bucket.products.push(p);
      bucket.breederIds.add(productBreederId(p));
    }
    return [...map.entries()]
      .map(([percent, b]) => ({
        percent,
        productCount: b.products.length,
        breederCount: b.breederIds.size,
      }))
      .sort((a, b) => b.percent - a.percent);
  }, [products]);

  const scopedProducts = useMemo(() => {
    if (viewPercent == null) return products;
    return products.filter((p) => productClearancePercent(p) === viewPercent);
  }, [products, viewPercent]);

  useEffect(() => {
    if (viewPercent == null) return;
    if (scopedProducts.length === 0) {
      setViewPercent(null);
      setExpandedBreederId(null);
      setListSelectedIds([]);
    }
  }, [viewPercent, scopedProducts.length]);

  const productsByBreederId = useMemo(() => {
    const map = new Map<number, ProductFull[]>();
    for (const p of scopedProducts) {
      const bid = productBreederId(p);
      const prev = map.get(bid);
      if (prev) prev.push(p);
      else map.set(bid, [p]);
    }
    return map;
  }, [scopedProducts]);

  const boxRows = useMemo(() => {
    const rows: {
      breederId: number;
      name: string;
      logoUrl: string | null;
      summary: ClearanceBreederSummary | null;
      products: ProductFull[];
    }[] = [];

    for (const b of breederSummary) {
      const list = productsByBreederId.get(b.breederId) ?? [];
      if (list.length === 0) continue;
      rows.push({
        breederId: b.breederId,
        name: b.name,
        logoUrl: b.logoUrl,
        summary: b,
        products: list,
      });
    }

    const known = new Set(breederSummary.map((b) => b.breederId));
    const orphans = scopedProducts.filter((p) => !known.has(productBreederId(p)));
    if (orphans.length > 0) {
      rows.push({
        breederId: NO_BREEDER_KEY,
        name: "ไม่มีค่าย / ไม่ตรงสรุป",
        logoUrl: null,
        summary: null,
        products: orphans,
      });
    }
    return rows;
  }, [breederSummary, scopedProducts, productsByBreederId]);

  const openAddPicker = () => {
    setAddDiscountPercent(
      viewPercent != null ? viewPercent : CLEARANCE_DISCOUNT_PERCENT
    );
    setPickerOpen(true);
  };

  const enterPercent = (percent: number) => {
    setViewPercent(percent);
    setExpandedBreederId(null);
    setListSelectedIds([]);
  };

  const exitPercent = () => {
    setViewPercent(null);
    setExpandedBreederId(null);
    setListSelectedIds([]);
  };

  const selectedVariantSet = useMemo(
    () => new Set(selectedVariantIds),
    [selectedVariantIds]
  );
  const listSelectedSet = useMemo(() => new Set(listSelectedIds), [listSelectedIds]);

  const expandedPackRows = useMemo(() => {
    if (expandedBreederId == null) return [] as ClearancePackRow[];
    const box = boxRows.find((r) => r.breederId === expandedBreederId);
    if (!box) return [];
    return box.products.flatMap((p) => clearancePacksFromProduct(p));
  }, [boxRows, expandedBreederId]);

  const allExpandedSelected =
    expandedPackRows.length > 0 &&
    expandedPackRows.every((r) => listSelectedSet.has(r.variantId));

  const selectedInExpanded = expandedPackRows.filter((r) =>
    listSelectedSet.has(r.variantId)
  ).length;

  const toggleExpand = (breederId: number) => {
    setExpandedBreederId((prev) => {
      if (prev === breederId) return null;
      setListSelectedIds([]);
      return breederId;
    });
  };

  const toggleVariantSelect = (variantId: number) => {
    setSelectedVariantIds((prev) =>
      prev.includes(variantId)
        ? prev.filter((x) => x !== variantId)
        : [...prev, variantId]
    );
  };

  const toggleListSelect = (variantId: number) => {
    setListSelectedIds((prev) =>
      prev.includes(variantId)
        ? prev.filter((x) => x !== variantId)
        : [...prev, variantId]
    );
  };

  const toggleListSelectAllInExpanded = () => {
    if (allExpandedSelected) {
      setListSelectedIds([]);
      return;
    }
    setListSelectedIds(expandedPackRows.map((r) => r.variantId));
  };

  const removeSelectedFromList = async () => {
    if (listSelectedIds.length === 0) {
      toast({ title: "เลือกแพ็กที่ต้องการนำออกก่อน" });
      return;
    }
    if (
      !window.confirm(`นำแพ็กออกจาก Clearance ${listSelectedIds.length} รายการ?`)
    ) {
      return;
    }
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/clearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", variantIds: listSelectedIds }),
      });
      const json = (await res.json()) as { error?: string; removed?: number };
      if (!res.ok) throw new Error(json.error ?? "นำออกไม่สำเร็จ");
      toast({
        title: `นำออก ${json.removed ?? listSelectedIds.length} แพ็กแล้ว`,
      });
      setListSelectedIds([]);
      await load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "นำออกไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBulkBusy(false);
    }
  };

  const addSelected = async () => {
    const variantToProduct = new Map<number, number>();
    for (const row of pickerRows) {
      for (const v of activePickerVariants(row)) {
        variantToProduct.set(Number(v.id), row.id);
      }
    }
    const byProduct = new Map<number, number[]>();
    for (const vid of selectedVariantIds) {
      const pid = variantToProduct.get(vid);
      if (pid == null) continue;
      const list = byProduct.get(pid) ?? [];
      list.push(vid);
      byProduct.set(pid, list);
    }
    const selections = [...byProduct.entries()].map(([productId, variantIds]) => ({
      productId,
      variantIds,
    }));
    if (selections.length === 0) {
      toast({ title: "เลือกแพ็กที่ต้องการเพิ่มใน Clearance" });
      return;
    }
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/clearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selections,
          discountPercent: normalizeClearanceDiscountPercent(addDiscountPercent),
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        added?: number;
        discountPercent?: number;
      };
      if (!res.ok) throw new Error(json.error ?? "เพิ่มไม่สำเร็จ");
      const pct = json.discountPercent ?? addDiscountPercent;
      toast({
        title: `เพิ่ม ${json.added ?? selectedVariantIds.length} แพ็กแล้ว`,
        description: `ตั้งราคา Clearance −${pct}%`,
      });
      setPickerOpen(false);
      await load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "เพิ่มไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBulkBusy(false);
    }
  };

  const resyncPrices = async () => {
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/clearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resync" }),
      });
      const json = (await res.json()) as { error?: string; synced?: number };
      if (!res.ok) throw new Error(json.error ?? "ซิงค์ไม่สำเร็จ");
      toast({
        title: "ซิงค์ราคาตาม % ของแต่ละสินค้าแล้ว",
        description: `${json.synced ?? 0} สินค้า · ลูกค้าที่ค้างในตะกร้าอาจต้องเพิ่มสินค้าใหม่ (ยอด checkout คิดจาก DB)`,
      });
      await load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "ซิงค์ไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBulkBusy(false);
    }
  };

  const setProductDiscountPercent = async (productId: number, raw: string) => {
    const pct = normalizeClearanceDiscountPercent(Number(raw));
    if (!Number.isInteger(Number(raw)) || Number(raw) < 1 || Number(raw) > 99) {
      toast({
        variant: "destructive",
        title: "ส่วนลดต้องเป็นจำนวนเต็ม 1–99",
      });
      return;
    }
    setPercentBusyId(productId);
    try {
      const res = await fetch("/api/admin/clearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setDiscountPercent",
          productId,
          discountPercent: pct,
        }),
      });
      const json = (await res.json()) as { error?: string; cartNote?: string };
      if (!res.ok) throw new Error(json.error ?? "เปลี่ยน % ไม่สำเร็จ");
      toast({
        title: `ตั้ง −${pct}% แล้ว`,
        description: json.cartNote,
      });
      setRowPercentDraft((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      await load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "เปลี่ยน % ไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setPercentBusyId(null);
    }
  };

  const upsertBanner = async (
    breederId: number,
    patch: {
      imageUrl?: string | null;
      titleTh?: string;
      titleEn?: string | null;
      isActive?: boolean;
      sortOrder?: number;
    }
  ) => {
    setBannerBusyId(breederId);
    try {
      const res = await fetch("/api/admin/clearance/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ breederId, ...patch }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "บันทึกแบนเนอร์ไม่สำเร็จ");
      await load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "บันทึกแบนเนอร์ไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBannerBusyId(null);
    }
  };

  const uploadBanner = async (breederId: number, file: File) => {
    setBannerBusyId(breederId);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("key", `clearance-banner-${breederId}`);
      form.append("bucket", "brand-assets");
      const up = await fetch("/api/admin/settings/upload?preset=clearance_banner", {
        method: "POST",
        body: form,
      });
      const upJson = (await up.json()) as { url?: string; error?: string };
      if (!up.ok || !upJson.url) throw new Error(upJson.error ?? "อัปโหลดไม่สำเร็จ");
      await upsertBanner(breederId, { imageUrl: upJson.url, isActive: true });
      toast({ title: "อัปโหลดแบนเนอร์แล้ว" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "อัปโหลดไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
      setBannerBusyId(null);
    }
  };

  const moveBreeder = async (breederId: number, dir: -1 | 1) => {
    const movable = breederSummary;
    const idx = movable.findIndex((b) => b.breederId === breederId);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= movable.length) return;
    const next = [...movable];
    const tmp = next[idx]!;
    next[idx] = next[swapIdx]!;
    next[swapIdx] = tmp;
    setBreederSummary(next);

    for (const [i, row] of next.entries()) {
      if (!row.banner) {
        await upsertBanner(row.breederId, { sortOrder: i, isActive: true });
      }
    }
    const orderedBreederIds = next.map((b) => b.breederId);
    setBannerBusyId(breederId);
    try {
      const res = await fetch("/api/admin/clearance/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedBreederIds }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "เรียงลำดับไม่สำเร็จ");
      await load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "เรียงลำดับไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
      await load();
    } finally {
      setBannerBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">สินค้า Clearance</h1>
          <p className="text-sm text-zinc-500">
            {viewPercent == null
              ? "เลือกกลุ่มส่วนลด % ก่อน แล้วจัดการค่าย/สินค้า · หน้าลูกค้า "
              : `กลุ่ม −${viewPercent}% · คลิกค่ายเพื่อดู/นำออกสินค้า · หน้าลูกค้า `}
            <Link href="/clearance" className="text-emerald-800 underline-offset-2 hover:underline">
              /clearance
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={bulkBusy || products.length === 0}
            onClick={() => void resyncPrices()}
          >
            {bulkBusy ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-4 w-4" />
            )}
            ซิงค์ราคาตาม % ของแต่ละสินค้า
          </Button>
          <Button
            onClick={openAddPicker}
            className="bg-emerald-800 hover:bg-emerald-900"
          >
            <Plus className="mr-1.5 h-4 w-4" /> เพิ่มสินค้า
            {viewPercent != null ? ` (−${viewPercent}%)` : ""}
          </Button>
        </div>
      </div>

      {viewPercent == null ? (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">กลุ่มส่วนลด ({percentBuckets.length})</CardTitle>
            <p className="text-xs text-zinc-500">
              คลิกก้อน % เพื่อดูค่ายและสินค้าในกลุ่มนั้น
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลด…
              </div>
            ) : percentBuckets.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                ยังไม่มีสินค้า Clearance — กด “เพิ่มสินค้า” เพื่อเริ่ม
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {percentBuckets.map((bucket) => (
                  <button
                    key={bucket.percent}
                    type="button"
                    onClick={() => enterPercent(bucket.percent)}
                    className="flex min-h-[7.5rem] flex-col items-start justify-between rounded-xl border border-zinc-200 bg-gradient-to-br from-emerald-50 to-white p-4 text-left shadow-sm transition hover:border-emerald-700/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                  >
                    <span className="text-2xl font-bold tabular-nums text-emerald-900 sm:text-3xl">
                      −{bucket.percent}%
                    </span>
                    <span className="mt-3 space-y-0.5 text-xs text-zinc-600">
                      <span className="block font-medium text-zinc-800">
                        {bucket.productCount} สินค้า
                      </span>
                      <span className="block">{bucket.breederCount} ค่าย</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardHeader className="py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              onClick={exitPercent}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              กลับกลุ่ม %
            </Button>
            <CardTitle className="text-base">
              Clearance −{viewPercent}% · ค่าย ({boxRows.filter((r) => r.breederId !== NO_BREEDER_KEY).length})
            </CardTitle>
          </div>
          <p className="text-xs text-zinc-500">
            คลิกแถวค่ายเพื่อขยายรายการสินค้าด้านล่าง · อัปโหลดแบนเนอร์สำหรับหน้า /clearance
          </p>
          <p className="mt-1 text-xs font-medium text-emerald-800">
            {clearanceBreederBannerSizeLabel("th")}
          </p>
          <p className="text-[11px] text-zinc-400">{CLEARANCE_BREEDER_BANNER.safeZoneNoteTh}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลด…
            </div>
          ) : boxRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              ไม่มีสินค้าในกลุ่ม −{viewPercent}% — เพิ่มสินค้าหรือกลับไปเลือกกลุ่มอื่น
            </p>
          ) : (
            boxRows.map((box) => {
              const b = box.summary;
              const busy = bannerBusyId === box.breederId;
              const preview = b?.banner?.imageUrl || box.logoUrl;
              const expanded = expandedBreederId === box.breederId;
              const count = box.products.length;
              const canReorder = box.breederId !== NO_BREEDER_KEY;
              const summaryIndex = canReorder
                ? breederSummary.findIndex((x) => x.breederId === box.breederId)
                : -1;

              return (
                <div
                  key={box.breederId}
                  className={cn(
                    "overflow-hidden rounded-xl border border-zinc-200 bg-white",
                    expanded && "ring-1 ring-emerald-700/20"
                  )}
                >
                  <div className="grid gap-4 p-4 md:grid-cols-[11rem_minmax(0,1fr)_auto] md:items-center">
                    <button
                      type="button"
                      className="flex min-w-0 items-start gap-3 text-left md:col-span-2 md:contents"
                      onClick={() => toggleExpand(box.breederId)}
                      aria-expanded={expanded}
                    >
                      <span className="mt-1 hidden text-zinc-400 md:inline" aria-hidden>
                        {expanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </span>
                      <div
                        className={cn(
                          "relative mx-auto w-full max-w-[11rem] overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50 md:mx-0",
                          CLEARANCE_BREEDER_BANNER.aspectClass
                        )}
                      >
                        {preview ? (
                          <Image
                            src={preview}
                            alt=""
                            fill
                            className="object-cover object-center"
                            sizes="176px"
                          />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-1 px-2 text-center text-[10px] leading-snug text-zinc-400">
                            <span>16:10</span>
                            <span>
                              {CLEARANCE_BREEDER_BANNER.recommendedWidth}×
                              {CLEARANCE_BREEDER_BANNER.recommendedHeight}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-center md:text-left">
                        <p className="flex items-center justify-center gap-1.5 font-semibold text-zinc-900 md:justify-start">
                          <span className="md:hidden" aria-hidden>
                            {expanded ? (
                              <ChevronDown className="inline h-4 w-4 text-zinc-400" />
                            ) : (
                              <ChevronRight className="inline h-4 w-4 text-zinc-400" />
                            )}
                          </span>
                          {box.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {count} สินค้า
                          {b?.banner?.isActive === false ? " · ซ่อนแบนเนอร์" : ""}
                          {" · "}
                          {expanded ? "คลิกเพื่อยุบ" : "คลิกเพื่อดูสินค้า"}
                        </p>
                      </div>
                    </button>

                    {canReorder && b ? (
                      <div
                        className="flex flex-wrap items-center justify-center gap-2 md:justify-end"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
                          <Upload className="h-3.5 w-3.5" />
                          อัปรูป
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            disabled={busy}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void uploadBanner(box.breederId, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                          <span>แสดง</span>
                          <Switch
                            checked={b.banner?.isActive ?? true}
                            disabled={busy}
                            onCheckedChange={(on) =>
                              void upsertBanner(box.breederId, { isActive: on })
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-9 w-9"
                          disabled={busy || summaryIndex <= 0}
                          onClick={() => void moveBreeder(box.breederId, -1)}
                          aria-label="Move up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-9 w-9"
                          disabled={
                            busy ||
                            summaryIndex < 0 ||
                            summaryIndex >= breederSummary.length - 1
                          }
                          onClick={() => void moveBreeder(box.breederId, 1)}
                          aria-label="Move down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                        ) : null}
                      </div>
                    ) : (
                      <div className="text-center text-xs text-zinc-400 md:text-right">—</div>
                    )}
                  </div>

                  {expanded ? (
                    <div className="border-t border-zinc-100 bg-zinc-50/60">
                      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                        <p className="text-xs font-medium text-zinc-600">
                          แพ็ก Clearance ({expandedPackRows.length}) · สินค้า {count}
                        </p>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={bulkBusy || selectedInExpanded === 0}
                          onClick={() => void removeSelectedFromList()}
                        >
                          {bulkBusy ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-1.5 h-4 w-4" />
                          )}
                          นำออกที่เลือก ({selectedInExpanded})
                        </Button>
                      </div>
                      {expandedPackRows.length === 0 ? (
                        <p className="px-4 pb-4 text-center text-sm text-zinc-500">
                          ไม่มีแพ็ก Clearance ในค่ายนี้
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-zinc-300"
                                  checked={allExpandedSelected}
                                  onChange={toggleListSelectAllInExpanded}
                                  aria-label="เลือกแพ็กทั้งหมดในค่ายนี้"
                                />
                              </TableHead>
                              <TableHead className="w-14" />
                              <TableHead>สินค้า / แพ็ก</TableHead>
                              <TableHead className="w-36">%</TableHead>
                              <TableHead>ราคา Clearance</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {expandedPackRows.map((pack) => {
                              const checked = listSelectedSet.has(pack.variantId);
                              const pid = pack.productId;
                              const pct = pack.discountPercent;
                              return (
                                <TableRow
                                  key={pack.variantId}
                                  className={checked ? "bg-emerald-50/50" : undefined}
                                  data-state={checked ? "selected" : undefined}
                                >
                                  <TableCell>
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-zinc-300"
                                      checked={checked}
                                      disabled={bulkBusy}
                                      onChange={() => toggleListSelect(pack.variantId)}
                                      aria-label={`เลือก ${pack.productName} ${pack.unitLabel}`}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {pack.imageUrl ? (
                                      <div className="relative h-11 w-11 overflow-hidden rounded-lg border border-zinc-200">
                                        <Image
                                          src={pack.imageUrl}
                                          alt=""
                                          fill
                                          className="object-cover"
                                          sizes="44px"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400">
                                        <PackageX className="h-4 w-4" />
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <p className="font-medium text-zinc-900">{pack.productName}</p>
                                    <p className="text-xs text-zinc-500">{pack.unitLabel}</p>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1.5">
                                      <Input
                                        type="number"
                                        min={1}
                                        max={99}
                                        step={1}
                                        className="h-9 w-16 px-2 tabular-nums"
                                        value={rowPercentDraft[pid] ?? String(pct)}
                                        disabled={bulkBusy || percentBusyId === pid}
                                        onChange={(e) =>
                                          setRowPercentDraft((prev) => ({
                                            ...prev,
                                            [pid]: e.target.value,
                                          }))
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            void setProductDiscountPercent(
                                              pid,
                                              rowPercentDraft[pid] ?? String(pct)
                                            );
                                          }
                                        }}
                                        aria-label={`ส่วนลด % ของ ${pack.productName}`}
                                      />
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-9 px-2 text-xs"
                                        disabled={
                                          bulkBusy ||
                                          percentBusyId === pid ||
                                          (rowPercentDraft[pid] ?? String(pct)) === String(pct)
                                        }
                                        onClick={() =>
                                          void setProductDiscountPercent(
                                            pid,
                                            rowPercentDraft[pid] ?? String(pct)
                                          )
                                        }
                                      >
                                        {percentBusyId === pid ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          "ใช้"
                                        )}
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap items-baseline gap-2 text-sm">
                                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                                        −{pct}%
                                      </span>
                                      {pack.listPrice > 0 ? (
                                        <span className="tabular-nums text-zinc-400 line-through">
                                          {formatPrice(pack.listPrice)}
                                        </span>
                                      ) : null}
                                      <span className="font-semibold tabular-nums text-emerald-800">
                                        {formatPrice(pack.clearancePrice)}
                                      </span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
      )}

      <Dialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
      >
        <DialogContent className="flex max-h-[85vh] max-w-lg flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>เพิ่มสินค้าใน Clearance (−{addDiscountPercent}%)</DialogTitle>
          </DialogHeader>
          <div className="mb-3 min-w-0 space-y-2">
            <div className="space-y-1.5 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3">
              <label className="text-xs font-medium text-zinc-700" htmlFor="clearance-add-pct">
                ส่วนลด % (1–99)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="clearance-add-pct"
                  type="number"
                  min={1}
                  max={99}
                  step={1}
                  className="h-10 w-20 bg-white tabular-nums"
                  value={addDiscountPercent}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isFinite(n)) return;
                    setAddDiscountPercent(Math.min(99, Math.max(1, Math.trunc(n))));
                  }}
                />
                <div className="flex flex-wrap gap-1.5">
                  {CLEARANCE_DISCOUNT_PRESETS.map((p) => (
                    <Button
                      key={p}
                      type="button"
                      size="sm"
                      variant={addDiscountPercent === p ? "default" : "outline"}
                      className={cn(
                        "h-9 min-w-[48px] px-2.5 text-xs",
                        addDiscountPercent === p && "bg-emerald-800 hover:bg-emerald-900"
                      )}
                      onClick={() => setAddDiscountPercent(p)}
                    >
                      −{p}%
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <Select value={pickerBreederId} onValueChange={setPickerBreederId}>
              <SelectTrigger className="h-10 w-full min-w-0 border-zinc-200">
                <SelectValue placeholder="ทุกค่าย" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกค่าย</SelectItem>
                {breederOptions.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative w-full min-w-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                value={pickerQ}
                onChange={(e) => setPickerQ(e.target.value)}
                placeholder="ค้นหาชื่อสินค้า…"
                className="w-full pl-9"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {pickerLoading ? (
              <div className="flex justify-center py-8 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : pickerRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">ไม่พบสินค้าที่มีสต็อก</p>
            ) : (
              pickerRows.map((row) => {
                const packs = activePickerVariants(row);
                const expandable = packs.length > 1;
                const open = expandedPickerProductId === row.id;
                const selectable = packs.filter(
                  (v) => !(Number(v.clearance_price ?? 0) > 0)
                );
                const selectedCount = selectable.filter((v) =>
                  selectedVariantSet.has(Number(v.id))
                ).length;
                const allOnClearance =
                  packs.length > 0 && selectable.length === 0;

                const onProductClick = () => {
                  if (packs.length === 0) return;
                  if (packs.length === 1) {
                    const only = packs[0]!;
                    if (Number(only.clearance_price ?? 0) > 0) return;
                    toggleVariantSelect(Number(only.id));
                    return;
                  }
                  setExpandedPickerProductId((prev) =>
                    prev === row.id ? null : row.id
                  );
                };

                return (
                  <div
                    key={row.id}
                    className={cn(
                      "rounded-lg border",
                      selectedCount > 0
                        ? "border-emerald-700/30 bg-emerald-50/40"
                        : "border-zinc-100"
                    )}
                  >
                    <button
                      type="button"
                      disabled={allOnClearance || packs.length === 0}
                      onClick={onProductClick}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="text-zinc-400" aria-hidden>
                        {expandable ? (
                          open ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )
                        ) : selectedCount > 0 ? (
                          <Check className="h-4 w-4 text-emerald-800" />
                        ) : (
                          <Plus className="h-4 w-4 text-zinc-400" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {row.name}
                      </span>
                      <span className="shrink-0 text-xs text-zinc-500">
                        {row.breeders?.name ?? ""}
                      </span>
                      {allOnClearance ? (
                        <span className="text-[10px] font-semibold uppercase text-amber-700">
                          อยู่แล้ว
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500">
                          {packs.length} แพ็ก
                          {selectedCount > 0 ? ` · เลือก ${selectedCount}` : ""}
                        </span>
                      )}
                    </button>
                    {expandable && open ? (
                      <div className="space-y-1 border-t border-zinc-100 px-3 py-2">
                        {packs.map((v) => {
                          const vid = Number(v.id);
                          const onClearance = Number(v.clearance_price ?? 0) > 0;
                          const on = selectedVariantSet.has(vid);
                          return (
                            <button
                              key={vid}
                              type="button"
                              disabled={onClearance}
                              onClick={() => toggleVariantSelect(vid)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm disabled:opacity-50",
                                on ? "bg-emerald-100/80" : "hover:bg-zinc-50"
                              )}
                            >
                              <span className="min-w-0 flex-1 truncate">
                                {packLabel(v.unit_label)}
                              </span>
                              <span className="tabular-nums text-xs text-zinc-500">
                                {formatPrice(Number(v.price ?? 0))}
                              </span>
                              {onClearance ? (
                                <span className="text-[10px] font-semibold text-amber-700">
                                  อยู่แล้ว
                                </span>
                              ) : on ? (
                                <Check className="h-4 w-4 text-emerald-800" />
                              ) : (
                                <Plus className="h-4 w-4 text-zinc-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter className="mt-3 gap-2 sm:justify-between">
            <p className="text-xs text-zinc-500">เลือกแล้ว {selectedVariantIds.length} แพ็ก</p>
            <Button
              type="button"
              disabled={bulkBusy || selectedVariantIds.length === 0}
              className="bg-emerald-800 hover:bg-emerald-900"
              onClick={() => void addSelected()}
            >
              {bulkBusy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              เพิ่มที่เลือก (−{addDiscountPercent}%)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
