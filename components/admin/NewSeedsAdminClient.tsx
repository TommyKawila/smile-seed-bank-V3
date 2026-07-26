"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Loader2,
  PackageX,
  Plus,
  Search,
  Sparkles,
  Trash2,
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

function pickerRowHasStock(row: PickerRow): boolean {
  if (row.product_variants?.length) {
    return row.product_variants.some(
      (v) => v.is_active !== false && Number(v.stock ?? 0) > 0
    );
  }
  return Number(row.stock ?? 0) > 0;
}

export function NewSeedsAdminClient() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductFull[]>([]);
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/new-seeds", { cache: "no-store" });
      const json = (await res.json()) as { products?: ProductFull[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "โหลดไม่สำเร็จ");
      setProducts(json.products ?? []);
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
  const allListSelected =
    products.length > 0 && listSelectedIds.length === products.length;

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

  const toggleListSelectAll = () => {
    if (allListSelected) {
      setListSelectedIds([]);
      return;
    }
    setListSelectedIds(products.map((p) => p.id as number));
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-zinc-900">
            <Sparkles className="h-5 w-5 text-violet-600" />
            กล่อง New Seeds
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            สินค้าที่หยิบใส่กล่องจะแสดงที่หน้า /new และโฮม (New Arrivals) — เรียงตามลำดับด้านล่าง
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
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 py-3">
          <CardTitle className="text-base">รายการในกล่อง ({products.length})</CardTitle>
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
            นำออกที่เลือก ({listSelectedIds.length})
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลด…
            </div>
          ) : products.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-zinc-500">
              ยังไม่มีสินค้าในกล่อง — กด «เพิ่มสินค้า» เพื่อเริ่ม
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-zinc-300"
                      checked={allListSelected}
                      onChange={toggleListSelectAll}
                      aria-label="เลือกทั้งหมด"
                    />
                  </TableHead>
                  <TableHead className="w-14" />
                  <TableHead>สินค้า</TableHead>
                  <TableHead>ค่าย</TableHead>
                  <TableHead className="w-28">ลำดับ</TableHead>
                  <TableHead className="w-28 text-right">จัดลำดับ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p, index) => {
                  const pid = p.id as number;
                  const checked = listSelectedSet.has(pid);
                  const priority = Number(p.new_arrival_priority ?? 0);
                  return (
                    <TableRow
                      key={pid}
                      className={checked ? "bg-violet-50/50" : undefined}
                      data-state={checked ? "selected" : undefined}
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
                        <p className="text-xs text-zinc-500">
                          {(p.product_variants ?? []).length} แพ็ก
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-600">
                        {p.breeders?.name ?? "—"}
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
                            disabled={bulkBusy || index === 0}
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
                            disabled={bulkBusy || index === products.length - 1}
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
