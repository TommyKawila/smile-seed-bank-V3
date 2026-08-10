"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  PackageX,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  NEW_SEEDS_BREEDER_BANNER,
  newSeedsBreederBannerSizeLabel,
  type NewSeedsBreederSummary,
} from "@/lib/new-seeds";
import { cn } from "@/lib/utils";
import type { ProductFull } from "@/types/supabase";

type PickerRow = {
  id: number;
  name: string;
  image_url: string | null;
  stock?: number | null;
  breeders?: { name: string } | null;
  is_pinned_new_arrival?: boolean | null;
  product_variants?: { stock: number | null; is_active?: boolean | null }[] | null;
};

const NO_BREEDER_KEY = -1;

function pickerRowHasStock(row: PickerRow): boolean {
  if (row.product_variants?.length) {
    return row.product_variants.some(
      (v) => v.is_active !== false && Number(v.stock ?? 0) > 0
    );
  }
  return Number(row.stock ?? 0) > 0;
}

function productBreederId(p: ProductFull): number {
  const raw = p.breeder_id ?? p.breeders?.id;
  return Number(raw ?? 0);
}

export function NewSeedsAdminClient() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductFull[]>([]);
  const [breederSummary, setBreederSummary] = useState<NewSeedsBreederSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQ, setPickerQ] = useState("");
  const [pickerDebounced, setPickerDebounced] = useState("");
  const [pickerRows, setPickerRows] = useState<PickerRow[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerBreederId, setPickerBreederId] = useState("all");
  const [breederOptions, setBreederOptions] = useState<{ id: number; name: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [listSelectedIds, setListSelectedIds] = useState<number[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [expandedBreederId, setExpandedBreederId] = useState<number | null>(null);
  const [bannerBusyId, setBannerBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/new-seeds", { cache: "no-store" });
      const json = (await res.json()) as {
        products?: ProductFull[];
        breederSummary?: NewSeedsBreederSummary[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "โหลดไม่สำเร็จ");
      setProducts(json.products ?? []);
      setBreederSummary(json.breederSummary ?? []);
      setListSelectedIds([]);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "โหลด New Seeds ไม่สำเร็จ",
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
    const params = new URLSearchParams({
      limit: "40",
      isActive: "true",
      stockStatus: "sellable",
    });
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
      setSelectedIds([]);
    }
  }, [pickerOpen]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const listSelectedSet = useMemo(() => new Set(listSelectedIds), [listSelectedIds]);

  const productsByBreederId = useMemo(() => {
    const map = new Map<number, ProductFull[]>();
    for (const p of products) {
      const bid = productBreederId(p);
      const prev = map.get(bid);
      if (prev) prev.push(p);
      else map.set(bid, [p]);
    }
    return map;
  }, [products]);

  const boxRows = useMemo(() => {
    const rows: {
      breederId: number;
      name: string;
      logoUrl: string | null;
      summary: NewSeedsBreederSummary | null;
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
    const orphans = products.filter((p) => !known.has(productBreederId(p)));
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
  }, [breederSummary, products, productsByBreederId]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleListSelect = (id: number) => {
    setListSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleExpand = (breederId: number) => {
    setExpandedBreederId((prev) => {
      if (prev === breederId) return null;
      setListSelectedIds([]);
      return breederId;
    });
  };

  const removeSelectedFromList = async () => {
    if (listSelectedIds.length === 0) {
      toast({ title: "เลือกสินค้าที่ต้องการนำออกก่อน" });
      return;
    }
    if (
      !window.confirm(`นำสินค้าออกจาก New Seeds ${listSelectedIds.length} รายการ?`)
    ) {
      return;
    }
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/new-seeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", productIds: listSelectedIds }),
      });
      const json = (await res.json()) as { error?: string; removed?: number };
      if (!res.ok) throw new Error(json.error ?? "นำออกไม่สำเร็จ");
      toast({ title: `นำออก ${json.removed ?? listSelectedIds.length} รายการแล้ว` });
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
    const ids = selectedIds.filter((id) => {
      const row = pickerRows.find((r) => r.id === id);
      return row && !row.is_pinned_new_arrival;
    });
    if (ids.length === 0) {
      toast({ title: "เลือกสินค้าที่ยังไม่อยู่ใน New Seeds" });
      return;
    }
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/new-seeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: ids }),
      });
      const json = (await res.json()) as { error?: string; added?: number };
      if (!res.ok) throw new Error(json.error ?? "เพิ่มไม่สำเร็จ");
      toast({ title: `เพิ่ม ${json.added ?? ids.length} สินค้าในกล่อง New Seeds แล้ว` });
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

  const moveProduct = async (productId: number, delta: -1 | 1) => {
    const idx = products.findIndex((p) => Number(p.id) === productId);
    if (idx < 0) return;
    const next = idx + delta;
    if (next < 0 || next >= products.length) return;
    const ordered = products.map((p) => Number(p.id));
    const [item] = ordered.splice(idx, 1);
    ordered.splice(next, 0, item!);
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/new-seeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", productIds: ordered }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "จัดลำดับไม่สำเร็จ");
      await load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "จัดลำดับไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBulkBusy(false);
    }
  };

  const upsertBanner = async (
    breederId: number,
    patch: { imageUrl?: string | null; isActive?: boolean }
  ) => {
    setBannerBusyId(breederId);
    try {
      const res = await fetch("/api/admin/new-seeds/banners", {
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
      form.append("key", `new-seeds-banner-${breederId}`);
      const up = await fetch("/api/admin/settings/upload?preset=new_seeds_banner", {
        method: "POST",
        body: form,
      });
      const upJson = (await up.json()) as { url?: string; error?: string };
      if (!up.ok || !upJson.url) throw new Error(upJson.error ?? "อัปโหลดไม่สำเร็จ");
      await upsertBanner(breederId, { imageUrl: upJson.url });
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

  const moveBreeder = async (breederId: number, delta: -1 | 1) => {
    const movable = breederSummary;
    const idx = movable.findIndex((b) => b.breederId === breederId);
    if (idx < 0) return;
    const next = idx + delta;
    if (next < 0 || next >= movable.length) return;
    const ordered = movable.map((b) => b.breederId);
    const [item] = ordered.splice(idx, 1);
    ordered.splice(next, 0, item!);
    setBannerBusyId(breederId);
    try {
      for (const id of ordered) {
        const row = movable.find((b) => b.breederId === id);
        if (!row?.banner) {
          await fetch("/api/admin/new-seeds/banners", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ breederId: id }),
          });
        }
      }
      const res = await fetch("/api/admin/new-seeds/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedBreederIds: ordered }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "จัดลำดับไม่สำเร็จ");
      await load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "จัดลำดับค่ายไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBannerBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-zinc-900">
            <Sparkles className="h-5 w-5 text-violet-600" />
            กล่อง New Seeds
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            เพิ่มสินค้าเข้ากล่อง · จัดค่ายและแบนเนอร์สำหรับหน้า /new (เลือกค่ายก่อนดูสินค้า)
          </p>
        </div>
        <Button
          onClick={() => setPickerOpen(true)}
          className="bg-violet-700 hover:bg-violet-800"
        >
          <Plus className="mr-1.5 h-4 w-4" /> เพิ่มสินค้า
        </Button>
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">
            ค่ายในกล่อง ({boxRows.filter((r) => r.breederId !== NO_BREEDER_KEY).length})
          </CardTitle>
          <p className="text-xs text-zinc-500">
            คลิกแถวค่ายเพื่อขยายรายการสินค้า · อัปโหลดแบนเนอร์สำหรับหน้า /new
          </p>
          <p className="mt-1 text-xs font-medium text-violet-800">
            {newSeedsBreederBannerSizeLabel("th")}
          </p>
          <p className="text-[11px] text-zinc-400">{NEW_SEEDS_BREEDER_BANNER.safeZoneNoteTh}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลด…
            </div>
          ) : boxRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              ยังไม่มีสินค้าในกล่อง — กด «เพิ่มสินค้า» เพื่อเริ่ม
            </p>
          ) : (
            boxRows.map((box) => {
              const b = box.summary;
              const busy = bannerBusyId === box.breederId;
              const preview = b?.banner?.imageUrl || box.logoUrl;
              const expanded = expandedBreederId === box.breederId;
              const canReorder = box.breederId !== NO_BREEDER_KEY;
              const summaryIndex = canReorder
                ? breederSummary.findIndex((x) => x.breederId === box.breederId)
                : -1;

              return (
                <div
                  key={box.breederId}
                  className={cn(
                    "overflow-hidden rounded-xl border border-zinc-200 bg-white",
                    expanded && "ring-1 ring-violet-700/20"
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
                          "relative mx-auto w-full max-w-[11rem] overflow-hidden rounded-lg border border-violet-100 bg-zinc-950 md:mx-0",
                          NEW_SEEDS_BREEDER_BANNER.aspectClass
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
                          <div className="flex h-full flex-col items-center justify-center gap-1 px-2 text-center text-[10px] leading-snug text-violet-300/70">
                            <Sparkles className="h-5 w-5" />
                            <span>4:3</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-center md:text-left">
                        <p className="flex items-center justify-center gap-1.5 font-semibold text-zinc-900 md:justify-start">
                          {box.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {box.products.length} สินค้า
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
                      </div>
                    ) : null}
                  </div>

                  {expanded ? (
                    <div className="border-t border-zinc-100 px-4 pb-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 pt-3">
                        <p className="text-xs text-zinc-500">
                          เลือกแล้ว {listSelectedIds.length} รายการ
                        </p>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={bulkBusy || listSelectedIds.length === 0}
                          onClick={() => void removeSelectedFromList()}
                        >
                          {bulkBusy ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-1.5 h-4 w-4" />
                          )}
                          นำออกที่เลือก
                        </Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12" />
                            <TableHead className="w-14" />
                            <TableHead>สินค้า</TableHead>
                            <TableHead className="w-28">ลำดับ</TableHead>
                            <TableHead className="w-28 text-right">จัดลำดับ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {box.products.map((p, index) => {
                            const pid = p.id as number;
                            const checked = listSelectedSet.has(pid);
                            const priority = Number(p.new_arrival_priority ?? 0);
                            const globalIndex = products.findIndex(
                              (x) => Number(x.id) === pid
                            );
                            return (
                              <TableRow
                                key={pid}
                                className={checked ? "bg-violet-50/50" : undefined}
                              >
                                <TableCell>
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-zinc-300"
                                    checked={checked}
                                    onChange={() => toggleListSelect(pid)}
                                    aria-label={`เลือก ${p.name}`}
                                  />
                                </TableCell>
                                <TableCell>
                                  {p.image_url ? (
                                    <div className="relative h-11 w-11 overflow-hidden rounded-lg border border-zinc-200">
                                      <Image
                                        src={p.image_url}
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
                                  <p className="font-medium text-zinc-900">{p.name}</p>
                                </TableCell>
                                <TableCell className="tabular-nums text-sm text-zinc-700">
                                  {priority}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="inline-flex gap-1">
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="outline"
                                      className="h-9 w-9"
                                      disabled={bulkBusy || globalIndex <= 0}
                                      onClick={() => void moveProduct(pid, -1)}
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
                                        bulkBusy || globalIndex >= products.length - 1
                                      }
                                      onClick={() => void moveProduct(pid, 1)}
                                      aria-label="Move down"
                                    >
                                      <ArrowDown className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="flex max-h-[85vh] max-w-lg flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>เพิ่มสินค้าใน New Seeds</DialogTitle>
          </DialogHeader>
          <div className="mb-3 min-w-0 space-y-2">
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
              <p className="py-8 text-center text-sm text-zinc-500">
                ไม่พบสินค้าที่มีสต็อก
              </p>
            ) : (
              pickerRows.map((row) => {
                const inList = Boolean(row.is_pinned_new_arrival);
                const on = selectedSet.has(row.id);
                return (
                  <button
                    key={row.id}
                    type="button"
                    disabled={inList}
                    onClick={() => toggleSelect(row.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-50 ${
                      on
                        ? "border-violet-700/30 bg-violet-50"
                        : "border-zinc-100 hover:bg-zinc-50"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {row.name}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {row.breeders?.name ?? ""}
                    </span>
                    {inList ? (
                      <span className="text-[10px] font-semibold uppercase text-amber-700">
                        อยู่แล้ว
                      </span>
                    ) : on ? (
                      <Check className="h-4 w-4 text-violet-800" />
                    ) : (
                      <Plus className="h-4 w-4 text-zinc-400" />
                    )}
                  </button>
                );
              })
            )}
          </div>
          <DialogFooter className="mt-3 gap-2 sm:justify-between">
            <p className="text-xs text-zinc-500">เลือกแล้ว {selectedIds.length} รายการ</p>
            <Button
              type="button"
              disabled={bulkBusy || selectedIds.length === 0}
              className="bg-violet-700 hover:bg-violet-800"
              onClick={() => void addSelected()}
            >
              {bulkBusy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              เพิ่มที่เลือก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
