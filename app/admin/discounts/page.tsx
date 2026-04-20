"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Plus,
  Pencil,
  Tag,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  formatCouponValueDisplay,
  isCouponPercentageType,
} from "@/lib/discount-utils";

type CouponRow = {
  id: number;
  code: string;
  discount_type: string;
  discount_value: number;
  min_spend: number | null;
  expiry_date?: string | null;
  is_active: boolean;
  used_count: number;
  usage_limit_per_user?: number | null;
  requires_auth?: boolean | null;
  first_order_only?: boolean | null;
};

function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
}

function formatExpiryTable(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

function expiryBadge(iso: string | null | undefined): "none" | "active" | "expired" {
  if (!iso) return "none";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "none";
  return Date.now() > t ? "expired" : "active";
}

export default function AdminDiscountsPage() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<CouponRow | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<CouponRow | null>(null);

  const [addForm, setAddForm] = useState({
    code: "",
    discount_type: "PERCENTAGE" as const,
    discount_value: 10,
    min_spend: "" as string | number,
    expiry_datetime: "",
    is_active: true,
    usage_limit_per_user: 1,
    requires_auth: false,
    first_order_only: false,
  });
  const [editForm, setEditForm] = useState({
    code: "",
    discount_value: 10,
    min_spend: "" as string | number,
    expiry_datetime: "",
    is_active: true,
    usage_limit_per_user: 1,
    requires_auth: false,
    first_order_only: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const couponsRes = await fetch("/api/admin/discounts/coupons");
      const couponsData = await couponsRes.json();
      if (Array.isArray(couponsData)) setCoupons(couponsData);
      else setCoupons([]);
    } catch {
      setCoupons([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreateCoupon = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/discounts/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: addForm.code.trim().toUpperCase(),
          discount_type: addForm.discount_type,
          discount_value: addForm.discount_value,
          min_spend: addForm.min_spend === "" ? null : Number(addForm.min_spend),
          expiry_date: addForm.expiry_datetime.trim()
            ? new Date(addForm.expiry_datetime).toISOString()
            : null,
          is_active: addForm.is_active,
          usage_limit_per_user: addForm.usage_limit_per_user ?? 1,
          requires_auth: addForm.requires_auth ?? false,
          first_order_only: addForm.first_order_only ?? false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setAddOpen(false);
      setAddForm({
        code: "",
        discount_type: "PERCENTAGE",
        discount_value: 10,
        min_spend: "",
        expiry_datetime: "",
        is_active: true,
        usage_limit_per_user: 1,
        requires_auth: false,
        first_order_only: false,
      });
      await fetchAll();
    } catch (e) {
      setError(String(e).replace("Error: ", ""));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCoupon = async () => {
    if (!editCoupon) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/discounts/coupons/${editCoupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editForm.code.trim().toUpperCase(),
          discount_value: editForm.discount_value,
          min_spend: editForm.min_spend === "" ? null : Number(editForm.min_spend),
          expiry_date: editForm.expiry_datetime.trim()
            ? new Date(editForm.expiry_datetime).toISOString()
            : null,
          is_active: editForm.is_active,
          usage_limit_per_user: editForm.usage_limit_per_user ?? 1,
          requires_auth: editForm.requires_auth ?? false,
          first_order_only: editForm.first_order_only ?? false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setEditCoupon(null);
      await fetchAll();
    } catch (e) {
      setError(String(e).replace("Error: ", ""));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCouponActive = async (row: CouponRow) => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/discounts/coupons/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !row.is_active }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setConfirmDeactivate(null);
      await fetchAll();
    } catch (e) {
      setError(String(e).replace("Error: ", ""));
    }
  };

  const openEdit = (row: CouponRow) => {
    setEditCoupon(row);
    setEditForm({
      code: row.code,
      discount_value: row.discount_value,
      min_spend: row.min_spend ?? "",
      expiry_datetime: isoToDatetimeLocal(row.expiry_date),
      is_active: row.is_active,
      usage_limit_per_user: row.usage_limit_per_user ?? 1,
      requires_auth: row.requires_auth ?? false,
      first_order_only: row.first_order_only ?? false,
    });
    setError(null);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">ส่วนลด & คูปอง</h1>
        <p className="mt-1 text-sm text-zinc-500">
          จัดการโค้ดส่วนลด (คูปอง) — ส่วนลดขั้นบันไดย้ายไปที่{" "}
          <Link href="/admin/promotions" className="text-primary font-medium hover:underline">
            โปรโมชั่น
          </Link>
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* ── Manual Coupons ───────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag className="h-5 w-5 text-primary" />
                โค้ดส่วนลด (คูปอง)
              </CardTitle>
              <Button onClick={() => { setAddOpen(true); setError(null); }} className="gap-1.5">
                <Plus className="h-4 w-4" /> เพิ่มโค้ด
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>โค้ด</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>มูลค่า</TableHead>
                    <TableHead>ขั้นต่ำ (฿)</TableHead>
                    <TableHead>หมดอายุ</TableHead>
                    <TableHead className="text-center">ใช้แล้ว</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                    <TableHead className="w-24">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-zinc-500 py-8">
                        ยังไม่มีโค้ดส่วนลด
                      </TableCell>
                    </TableRow>
                  ) : (
                    coupons.map((row) => (
                      <TableRow
                        key={row.id}
                        className={row.code === "WELCOME10" ? "bg-primary/5 border-l-4 border-l-primary" : ""}
                      >
                        <TableCell className="font-mono font-semibold">
                          {row.code}
                          {row.code === "WELCOME10" && (
                            <Badge className="ml-2 bg-primary text-xs">ลูกค้าใหม่</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isCouponPercentageType(row.discount_type) ? "%" : "บาท"}
                        </TableCell>
                        <TableCell>
                          {formatCouponValueDisplay(row.discount_type, row.discount_value)}
                        </TableCell>
                        <TableCell>{row.min_spend != null ? row.min_spend.toLocaleString("th-TH") : "—"}</TableCell>
                        <TableCell className="text-sm text-zinc-600">
                          <div className="flex flex-col gap-1">
                            <span>{formatExpiryTable(row.expiry_date)}</span>
                            {expiryBadge(row.expiry_date) === "expired" && (
                              <Badge variant="secondary" className="w-fit bg-zinc-200 text-zinc-700">
                                หมดอายุ
                              </Badge>
                            )}
                            {expiryBadge(row.expiry_date) === "active" && row.expiry_date && (
                              <Badge variant="secondary" className="w-fit border-primary/30 bg-primary/10 text-primary">
                                ยังใช้ได้
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-zinc-500">{row.used_count}</TableCell>
                        <TableCell className="text-center">
                          <span className={row.is_active ? "text-primary font-medium" : "text-zinc-400"}>
                            {row.is_active ? "เปิด" : "ปิด"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(row)} className="h-8 w-8 p-0">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmDeactivate(row)}
                              className="h-8 w-8 p-0 text-zinc-500 hover:text-red-600"
                            >
                              {row.is_active ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Add Coupon Modal ─────────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่มโค้ดส่วนลด</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}
            <div className="space-y-2">
              <Label>โค้ด</Label>
              <Input
                value={addForm.code}
                onChange={(e) => setAddForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="WELCOME10"
              />
            </div>
            <div className="space-y-2">
              <Label>ส่วนลด (%)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={addForm.discount_value}
                onChange={(e) => setAddForm((p) => ({ ...p, discount_value: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>ยอดขั้นต่ำ (฿) — ว่างได้</Label>
              <Input
                type="number"
                min={0}
                value={addForm.min_spend}
                onChange={(e) => setAddForm((p) => ({ ...p, min_spend: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>วันหมดอายุ (ว่างได้)</Label>
              <Input
                type="datetime-local"
                value={addForm.expiry_datetime}
                onChange={(e) => setAddForm((p) => ({ ...p, expiry_datetime: e.target.value }))}
                className="rounded-md border-zinc-200"
              />
              <p className="text-xs text-zinc-500">เวลาหมดอายุตามเครื่องของคุณ — ว่างไว้ถ้าไม่จำกัด</p>
            </div>
            <div className="space-y-2">
              <Label>จำกัดต่อคน (ครั้ง)</Label>
              <Input
                type="number"
                min={1}
                max={999}
                value={addForm.usage_limit_per_user}
                onChange={(e) => setAddForm((p) => ({ ...p, usage_limit_per_user: Number(e.target.value) || 1 }))}
              />
              <p className="text-xs text-zinc-500">จำนวนครั้งที่ลูกค้าสามารถใช้โค้ดนี้ได้ (ต่ออีเมล/บัญชี)</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="add-requires-auth"
                  checked={addForm.requires_auth}
                  onChange={(e) => setAddForm((p) => ({ ...p, requires_auth: e.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <Label htmlFor="add-requires-auth">ต้องเข้าสู่ระบบเพื่อใช้โค้ด</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="add-first-order"
                  checked={addForm.first_order_only}
                  onChange={(e) => setAddForm((p) => ({ ...p, first_order_only: e.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <Label htmlFor="add-first-order">ลูกค้าใหม่เท่านั้น (ยังไม่มีออเดอร์ซื้อสำเร็จ)</Label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="add-active"
                checked={addForm.is_active}
                onChange={(e) => setAddForm((p) => ({ ...p, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-300"
              />
              <Label htmlFor="add-active">เปิดใช้งานทันที</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>ยกเลิก</Button>
            <Button onClick={() => void handleCreateCoupon()} disabled={saving || !addForm.code.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Coupon Modal ────────────────────────────────────────────────── */}
      <Dialog open={!!editCoupon} onOpenChange={(o) => !o && setEditCoupon(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขโค้ดส่วนลด</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}
            <div className="space-y-2">
              <Label>โค้ด</Label>
              <Input
                value={editForm.code}
                onChange={(e) => setEditForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-2">
              <Label>ส่วนลด (%)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={editForm.discount_value}
                onChange={(e) => setEditForm((p) => ({ ...p, discount_value: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>ยอดขั้นต่ำ (฿)</Label>
              <Input
                type="number"
                min={0}
                value={editForm.min_spend}
                onChange={(e) => setEditForm((p) => ({ ...p, min_spend: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>วันหมดอายุ (ว่างได้)</Label>
              <Input
                type="datetime-local"
                value={editForm.expiry_datetime}
                onChange={(e) => setEditForm((p) => ({ ...p, expiry_datetime: e.target.value }))}
                className="rounded-md border-zinc-200"
              />
            </div>
            <div className="space-y-2">
              <Label>จำกัดต่อคน (ครั้ง)</Label>
              <Input
                type="number"
                min={1}
                max={999}
                value={editForm.usage_limit_per_user}
                onChange={(e) => setEditForm((p) => ({ ...p, usage_limit_per_user: Number(e.target.value) || 1 }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-requires-auth"
                  checked={editForm.requires_auth}
                  onChange={(e) => setEditForm((p) => ({ ...p, requires_auth: e.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <Label htmlFor="edit-requires-auth">ต้องเข้าสู่ระบบเพื่อใช้โค้ด</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-first-order"
                  checked={editForm.first_order_only}
                  onChange={(e) => setEditForm((p) => ({ ...p, first_order_only: e.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <Label htmlFor="edit-first-order">ลูกค้าใหม่เท่านั้น</Label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={editForm.is_active}
                onChange={(e) => setEditForm((p) => ({ ...p, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-300"
              />
              <Label htmlFor="edit-active">เปิดใช้งาน</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCoupon(null)}>ยกเลิก</Button>
            <Button onClick={() => void handleUpdateCoupon()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Deactivate ───────────────────────────────────────────────── */}
      <Dialog open={!!confirmDeactivate} onOpenChange={(o) => !o && setConfirmDeactivate(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>ยืนยันการเปลี่ยนสถานะ</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600">
            {confirmDeactivate?.is_active
              ? `ปิดการใช้งานโค้ด "${confirmDeactivate.code}" หรือไม่? ลูกค้าจะใช้โค้ดนี้ไม่ได้จนกว่าคุณจะเปิดกลับ`
              : `เปิดการใช้งานโค้ด "${confirmDeactivate?.code}" กลับหรือไม่?`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeactivate(null)}>ยกเลิก</Button>
            <Button
              variant={confirmDeactivate?.is_active ? "destructive" : "default"}
              onClick={() => confirmDeactivate && handleToggleCouponActive(confirmDeactivate)}
            >
              {confirmDeactivate?.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
