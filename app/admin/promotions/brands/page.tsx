"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { toastErrorMessage } from "@/lib/admin-toast";

type BrandRow = {
  id: string;
  brand_name: string;
  discount_percent: number;
  is_active: boolean;
};

type BreederOption = { id: string; name: string };

export default function AdminBrandPromotionsPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [breeders, setBreeders] = useState<BreederOption[]>([]);
  const [breedersLoading, setBreedersLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newPct, setNewPct] = useState("10");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/promotions/brands", { cache: "no-store" });
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as BrandRow[];
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({ variant: "destructive", title: "โหลดรายการไม่สำเร็จ", description: toastErrorMessage(e) });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadBreeders = useCallback(async () => {
    setBreedersLoading(true);
    try {
      const r = await fetch("/api/admin/promotions/brands/breeders", { cache: "no-store" });
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as BreederOption[];
      setBreeders(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "โหลดรายชื่อ breeder ไม่สำเร็จ",
        description: toastErrorMessage(e),
      });
      setBreeders([]);
    } finally {
      setBreedersLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadBreeders();
  }, [loadBreeders]);

  useEffect(() => {
    if (!newName.trim()) return;
    if (rows.some((r) => r.brand_name.trim().toLowerCase() === newName.trim().toLowerCase())) {
      setNewName("");
    }
  }, [rows, newName]);

  const addRow = async () => {
    const pct = Number(newPct);
    if (!newName.trim()) {
      toast({ variant: "destructive", title: "เลือกแบรนด์จากรายการ" });
      return;
    }
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      toast({ variant: "destructive", title: "เปอร์เซ็นต์ 0–100" });
      return;
    }
    setAdding(true);
    try {
      const r = await fetch("/api/admin/promotions/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: newName.trim(),
          discount_percent: Math.trunc(pct),
          is_active: true,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(typeof j?.error === "string" ? j.error : await r.text());
      }
      setNewName("");
      setNewPct("10");
      toast({ title: "บันทึกแล้ว" });
      await load();
    } catch (e) {
      toast({ variant: "destructive", title: "เพิ่มไม่สำเร็จ", description: toastErrorMessage(e) });
    } finally {
      setAdding(false);
    }
  };

  const patchRow = async (id: string, patch: Partial<{ discount_percent: number; is_active: boolean; brand_name: string }>) => {
    setSavingId(id);
    try {
      const r = await fetch(`/api/admin/promotions/brands/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(typeof j?.error === "string" ? j.error : await r.text());
      }
      toast({ title: "อัปเดตแล้ว" });
      await load();
    } catch (e) {
      toast({ variant: "destructive", title: "บันทึกไม่สำเร็จ", description: toastErrorMessage(e) });
    } finally {
      setSavingId(null);
    }
  };

  const deleteRow = async (id: string) => {
    if (!confirm("ลบกฎแบรนด์นี้?")) return;
    setSavingId(id);
    try {
      const r = await fetch(`/api/admin/promotions/brands/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: "ลบแล้ว" });
      await load();
    } catch (e) {
      toast({ variant: "destructive", title: "ลบไม่สำเร็จ", description: toastErrorMessage(e) });
    } finally {
      setSavingId(null);
    }
  };

  const usedBrandKeys = new Set(rows.map((r) => r.brand_name.trim().toLowerCase()));
  const breedersForAdd = breeders.filter((b) => !usedBrandKeys.has(b.name.trim().toLowerCase()));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Brand promotions (checkout)</h1>
          <p className="mt-1 text-sm text-zinc-600">
            จับคู่ชื่อกับ{" "}
            <Link href="/admin/breeders" className="text-emerald-700 underline-offset-2 hover:underline">
              breeders.name
            </Link>{" "}
            (ไม่สนตัวพิมพ์) — หัก % จากราคา variant ก่อนคำนวณคูปองและค่าส่ง • กฎ 0% หรือไม่มีแถวที่ตรงกัน =
            แสดงราคาเต็มตามคอลัมน์ <code className="rounded bg-zinc-100 px-1">price</code> (ไม่ใช้{" "}
            <code className="rounded bg-zinc-100 px-1">product_variants.discount_percent</code>)
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/promotions">← โปรโมชั่น</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">เพิ่มแบรนด์</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1 space-y-1.5">
            <Label htmlFor="bn">แบรนด์ (จาก Breeders)</Label>
            <Select
              value={newName || undefined}
              onValueChange={setNewName}
              disabled={breedersLoading || breedersForAdd.length === 0}
            >
              <SelectTrigger id="bn" className="w-full">
                <SelectValue
                  placeholder={
                    breedersLoading
                      ? "กำลังโหลดรายชื่อ…"
                      : breeders.length === 0
                        ? "ไม่มี breeder ที่ใช้งาน"
                        : breedersForAdd.length === 0
                          ? "ทุกแบรนด์ในรายการมีกฎแล้ว"
                          : "เลือกชื่อ breeder"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {breedersForAdd.map((b) => (
                  <SelectItem key={b.id} value={b.name}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-28 space-y-1.5">
            <Label htmlFor="bp">% ส่วนลด</Label>
            <Input
              id="bp"
              type="number"
              min={0}
              max={100}
              value={newPct}
              onChange={(e) => setNewPct(e.target.value)}
            />
          </div>
          <Button
            type="button"
            onClick={() => void addRow()}
            disabled={adding || breedersLoading || !newName.trim() || breedersForAdd.length === 0}
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span className="ml-2">เพิ่ม</span>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการ ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12 text-zinc-500">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">ยังไม่มีกฎ — เพิ่มแบรนด์ด้านบน</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>แบรนด์</TableHead>
                  <TableHead className="w-28">% ส่วนลด</TableHead>
                  <TableHead className="w-28">ใช้งาน</TableHead>
                  <TableHead className="w-24 text-right">ลบ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.brand_name}</TableCell>
                    <TableCell>
                      <Input
                        className="h-9 w-20"
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={r.discount_percent}
                        key={`${r.id}-${r.discount_percent}`}
                        disabled={savingId === r.id}
                        onBlur={(e) => {
                          const v = Math.trunc(Number(e.target.value));
                          if (!Number.isFinite(v) || v === r.discount_percent) return;
                          void patchRow(r.id, { discount_percent: Math.max(0, Math.min(100, v)) });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={r.is_active !== false}
                          disabled={savingId === r.id}
                          onCheckedChange={(c) => void patchRow(r.id, { is_active: c })}
                        />
                        <span className="text-xs text-zinc-500">{r.is_active !== false ? "เปิด" : "ปิด"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                        disabled={savingId === r.id}
                        onClick={() => void deleteRow(r.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
