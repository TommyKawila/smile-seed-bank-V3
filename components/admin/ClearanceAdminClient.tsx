"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, PackageX, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
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
import { formatPrice } from "@/lib/utils";
import type { ProductFull } from "@/types/supabase";

type PickerRow = {
  id: number;
  name: string;
  image_url: string | null;
  breeders?: { name: string } | null;
  is_clearance?: boolean | null;
};

type VariantDraft = {
  unit_label: string;
  price: number;
  clearance_price: number | null;
};

export function ClearanceAdminClient() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQ, setPickerQ] = useState("");
  const [pickerDebounced, setPickerDebounced] = useState("");
  const [pickerRows, setPickerRows] = useState<PickerRow[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, VariantDraft[]>>({});
  const [pendingId, setPendingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clearance", { cache: "no-store" });
      const json = (await res.json()) as { products?: ProductFull[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "โหลดไม่สำเร็จ");
      const list = json.products ?? [];
      setProducts(list);
      setDrafts(
        Object.fromEntries(
          list.map((p) => [
            p.id,
            (p.product_variants ?? []).map((v) => ({
              unit_label: v.unit_label,
              price: Number(v.price ?? 0),
              clearance_price:
                (v as { clearance_price?: number | null }).clearance_price != null
                  ? Number((v as { clearance_price?: number | null }).clearance_price)
                  : null,
            })),
          ])
        )
      );
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
    setPickerLoading(true);
    const params = new URLSearchParams({ limit: "30", isActive: "true" });
    if (pickerDebounced) params.set("q", pickerDebounced);
    fetch(`/api/admin/products?${params}`)
      .then((r) => r.json())
      .then((data: { products?: PickerRow[] }) => {
        if (!cancelled) setPickerRows(data.products ?? []);
      })
      .finally(() => {
        if (!cancelled) setPickerLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pickerOpen, pickerDebounced]);

  const addProduct = async (productId: number) => {
    setPendingId(productId);
    try {
      const res = await fetch("/api/admin/clearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "เพิ่มไม่สำเร็จ");
      toast({ title: "เพิ่มใน Clearance แล้ว", description: "กรอกราคาเซลแต่ละแพ็กด้านล่าง" });
      setPickerOpen(false);
      await load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "เพิ่มไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setPendingId(null);
    }
  };

  const removeProduct = async (productId: number, name: string) => {
    if (!window.confirm(`นำ "${name}" ออกจาก Clearance?`)) return;
    setPendingId(productId);
    try {
      const res = await fetch(`/api/admin/clearance/${productId}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "ลบไม่สำเร็จ");
      toast({ title: "นำออกจาก Clearance แล้ว" });
      await load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "นำออกไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setPendingId(null);
    }
  };

  const setDraftPrice = (productId: number, index: number, value: number | null) => {
    setDrafts((prev) => {
      const rows = [...(prev[productId] ?? [])];
      const row = rows[index];
      if (!row) return prev;
      rows[index] = { ...row, clearance_price: value };
      return { ...prev, [productId]: rows };
    });
  };

  const savePrices = async (productId: number) => {
    const variants = drafts[productId] ?? [];
    setPendingId(productId);
    try {
      const res = await fetch(`/api/admin/clearance/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variants: variants.map((v) => ({
            unit_label: v.unit_label,
            clearance_price: v.clearance_price,
          })),
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "บันทึกไม่สำเร็จ");
      toast({ title: "บันทึกราคาเซลแล้ว" });
      await load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "บันทึกไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">สินค้า Clearance</h1>
          <p className="text-sm text-zinc-500">
            จัดการสินค้าล้างสต็อกแยกจากหน้าแก้ไขสินค้า · แสดงที่{" "}
            <Link href="/seeds?quick=clearance" className="text-primary underline-offset-2 hover:underline">
              /seeds?quick=clearance
            </Link>
          </p>
        </div>
        <Button onClick={() => setPickerOpen(true)} className="bg-amber-700 hover:bg-amber-800">
          <Plus className="mr-1.5 h-4 w-4" /> เพิ่มสินค้า
        </Button>
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">รายการ Clearance ({products.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลด…
            </div>
          ) : products.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-zinc-500">
              ยังไม่มีสินค้า Clearance — กด «เพิ่มสินค้า» เพื่อเริ่ม
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14" />
                  <TableHead>สินค้า</TableHead>
                  <TableHead>แพ็ก / ราคาเซล</TableHead>
                  <TableHead className="w-36 text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const pid = p.id as number;
                  const rows = drafts[pid] ?? [];
                  const busy = pendingId === pid;
                  return (
                    <TableRow key={pid}>
                      <TableCell>
                        {p.image_url ? (
                          <div className="relative h-11 w-11 overflow-hidden rounded-lg border border-zinc-200">
                            <Image src={p.image_url} alt="" fill className="object-cover" sizes="44px" />
                          </div>
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400">
                            <PackageX className="h-4 w-4" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-zinc-900">{p.name}</p>
                        <p className="text-xs text-zinc-500">{p.breeders?.name ?? "—"}</p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {rows.map((v, i) => (
                            <div key={v.unit_label} className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="min-w-[4.5rem] font-medium text-zinc-700">{v.unit_label}</span>
                              <span className="text-zinc-400">ขาย {formatPrice(v.price)}</span>
                              <Input
                                type="number"
                                min={0}
                                step={1}
                                placeholder="ราคาเซล"
                                disabled={busy}
                                value={v.clearance_price ?? ""}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw === "") {
                                    setDraftPrice(pid, i, null);
                                    return;
                                  }
                                  const n = parseInt(raw, 10);
                                  setDraftPrice(pid, i, Number.isFinite(n) ? n : null);
                                }}
                                className="h-8 w-24 border-amber-200 bg-amber-50/40 text-sm"
                              />
                            </div>
                          ))}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            className="mt-1 h-8 text-xs"
                            onClick={() => void savePrices(pid)}
                          >
                            {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                            บันทึกราคาเซล
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => void removeProduct(pid, p.name)}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          นำออก
                        </Button>
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
        <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>เพิ่มสินค้าใน Clearance</DialogTitle>
          </DialogHeader>
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              value={pickerQ}
              onChange={(e) => setPickerQ(e.target.value)}
              placeholder="ค้นหาชื่อสินค้า…"
              className="pl-9"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto space-y-1">
            {pickerLoading ? (
              <div className="flex justify-center py-8 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : pickerRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">ไม่พบสินค้า</p>
            ) : (
              pickerRows.map((row) => {
                const inList = Boolean(row.is_clearance);
                return (
                  <button
                    key={row.id}
                    type="button"
                    disabled={inList || pendingId === row.id}
                    onClick={() => void addProduct(row.id)}
                    className="flex w-full items-center gap-3 rounded-lg border border-zinc-100 px-3 py-2 text-left hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.name}</span>
                    <span className="shrink-0 text-xs text-zinc-500">{row.breeders?.name ?? ""}</span>
                    {inList ? (
                      <span className="text-[10px] font-semibold uppercase text-amber-700">อยู่แล้ว</span>
                    ) : pendingId === row.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                    ) : (
                      <Plus className="h-4 w-4 text-primary" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
