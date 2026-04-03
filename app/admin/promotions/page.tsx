"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Pencil, Loader2, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { toastErrorMessage } from "@/lib/admin-toast";

type PromotionType = "DISCOUNT" | "BUY_X_GET_Y" | "FREEBIES" | "BUNDLE";

type Promotion = {
  id: string;
  name: string;
  type: PromotionType;
  description: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  conditions: Record<string, unknown> | string | null;
  discount_value: string | number | null;
};

const TYPE_OPTIONS: { value: PromotionType; label: string }[] = [
  { value: "BUY_X_GET_Y", label: "ซื้อ X แถม Y (เช่น ซื้อเมล็ด แถมกระดาษโรล)" },
  { value: "DISCOUNT", label: "ส่วนลด" },
  { value: "FREEBIES", label: "ของแถม" },
  { value: "BUNDLE", label: "ชุดโปรโมชั่น" },
];

function formatDate(s: string | null | undefined): string {
  if (s == null || s === "") return "No Date";
  try {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? "No Date" : d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "No Date";
  }
}

function formatDiscount(p: Promotion, breeders: { id: number; name: string }[]): string {
  if (p.type === "FREEBIES") {
    const cond = typeof p.conditions === "string" ? (() => { try { return JSON.parse(p.conditions); } catch { return {}; } })() : (p.conditions ?? {});
    if (cond?.gift_product_id != null && cond?.gift_product_label) return `แถม ${cond.gift_product_label}`;
    if (cond?.gift_manual_name) return `แถม ${cond.gift_manual_name}`;
    const bid = cond?.target_breeder_id != null ? String(cond.target_breeder_id) : null;
    const name = bid ? breeders.find((b) => String(b.id) === bid)?.name ?? bid : null;
    return name ? `แถม ${name}` : "—";
  }
  if (p.type === "BUY_X_GET_Y") {
    const cond = typeof p.conditions === "string" ? (() => { try { return JSON.parse(p.conditions); } catch { return {}; } })() : (p.conditions ?? {});
    const buyQty = cond?.buy_qty != null ? String(cond.buy_qty) : "?";
    const bid = cond?.target_breeder_id != null ? String(cond.target_breeder_id) : null;
    const breederName = bid ? breeders.find((b) => String(b.id) === bid)?.name ?? bid : "ทุกสายพันธุ์";
    const giftLabel = cond?.gift_product_label ?? cond?.gift_manual_name ?? null;
    return `ซื้อ ${buyQty} ${breederName} แถม ${giftLabel ?? "—"}`;
  }
  const cond = typeof p.conditions === "string" ? (() => { try { return JSON.parse(p.conditions); } catch { return {}; } })() : (p.conditions ?? {});
  const rawVal = p.discount_value ?? cond?.discount_value;
  const val = rawVal != null && rawVal !== "" ? Number(rawVal) : 0;
  if (val <= 0 || Number.isNaN(val)) return "—";
  const type = (cond?.discount_type ?? "PERCENTAGE") as string;
  return type === "FIXED" ? `${val.toLocaleString()} ฿` : `${val}%`;
}

function statusBadge(p: Promotion) {
  const now = new Date();
  const start = p.start_date ? new Date(p.start_date) : null;
  const end = p.end_date ? new Date(p.end_date) : null;
  if (!p.is_active) return <Badge variant="secondary">ปิดใช้งาน</Badge>;
  if (start && !Number.isNaN(start.getTime()) && now < start) return <Badge className="bg-amber-100 text-amber-800">รอเริ่ม</Badge>;
  if (end && !Number.isNaN(end.getTime()) && now > end) return <Badge className="bg-zinc-200 text-zinc-600">หมดอายุ</Badge>;
  return <Badge className="bg-accent text-primary">Active</Badge>;
}

export default function PromotionsPage() {
  const { toast } = useToast();
  const [list, setList] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "DISCOUNT" as PromotionType,
    description: "",
    start_date: "",
    end_date: "",
    is_active: true,
    discount_value: "",
    discount_type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    min_spend: "",
    buy_qty: "",
    get_qty: "",
    target_breeder_id: "",
    gift_source: "stock" as "stock" | "manual",
    gift_product_id: "",
    gift_product_label: "",
    gift_manual_name: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Promotion | null>(null);
  const [breeders, setBreeders] = useState<{ id: number; name: string }[]>([]);
  const [giftProductSearch, setGiftProductSearch] = useState("");
  const [giftProductResults, setGiftProductResults] = useState<{ id: number; name: string; variants: { id: number; unit_label: string }[] }[]>([]);
  const [giftProductSearchOpen, setGiftProductSearchOpen] = useState(false);
  const giftProductRef = useRef<HTMLDivElement>(null);
  const [breederSearch, setBreederSearch] = useState("");
  const [breederSearchOpen, setBreederSearchOpen] = useState(false);
  const breederSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/breeders")
      .then((r) => r.ok ? r.json() : [])
      .then((data: { id: number; name: string }[]) => setBreeders(Array.isArray(data) ? data : []))
      .catch(() => setBreeders([]));
  }, []);

  useEffect(() => {
    if (!giftProductSearch.trim() || giftProductSearch.length < 2) {
      setGiftProductResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/admin/inventory/search?q=${encodeURIComponent(giftProductSearch)}`)
        .then((r) => r.ok ? r.json() : [])
        .then((data: { id: number; name: string; variants: { id: number; unit_label: string }[] }[]) => setGiftProductResults(Array.isArray(data) ? data : []))
        .catch(() => setGiftProductResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [giftProductSearch]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promotions");
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (giftProductRef.current && !giftProductRef.current.contains(e.target as Node)) setGiftProductSearchOpen(false);
      if (breederSearchRef.current && !breederSearchRef.current.contains(e.target as Node)) setBreederSearchOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const openAdd = () => {
    setEditing(null);
    const today = new Date().toISOString().slice(0, 16);
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    setForm({
      name: "",
      type: "BUY_X_GET_Y",
      description: "",
      start_date: today,
      end_date: nextMonth,
      is_active: true,
      discount_value: "",
      discount_type: "PERCENTAGE",
      min_spend: "",
      buy_qty: "",
      get_qty: "",
      target_breeder_id: "",
      gift_source: "stock",
      gift_product_id: "",
      gift_product_label: "",
      gift_manual_name: "",
    });
    setBreederSearch("");
    setBreederSearchOpen(false);
    setError(null);
    setModalOpen(true);
  };

  const toDatetimeLocal = (v: unknown): string => {
    if (!v) return "";
    try {
      const d = new Date(v as string | number | Date);
      if (Number.isNaN(d.getTime())) return "";
      const offset = d.getTimezoneOffset() * 60000;
      const localDate = new Date(d.getTime() - offset);
      return localDate.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  const openEdit = (p: Promotion) => {
    setEditing(p);
    let cond: Record<string, unknown>;
    try {
      cond = typeof p.conditions === "string" ? JSON.parse(p.conditions) : (p.conditions ?? {});
    } catch {
      cond = {};
    }
    const toStr = (v: unknown) => (v != null ? String(v) : "");
    const rawDiscount = p.discount_value ?? cond?.discount_value;
    const discountStr = rawDiscount != null && rawDiscount !== "" ? (() => {
      const n = Number(rawDiscount);
      return Number.isNaN(n) ? "" : String(n);
    })() : "";
    const hasGiftProduct = cond.gift_product_id != null && cond.gift_product_id !== "";
    setForm({
      name: p.name ?? "",
      type: p.type,
      description: p.description ?? "",
      start_date: toDatetimeLocal(p.start_date),
      end_date: toDatetimeLocal(p.end_date),
      is_active: p.is_active ?? true,
      discount_value: discountStr,
      discount_type: (cond.discount_type === "FIXED" ? "FIXED" : "PERCENTAGE") as "PERCENTAGE" | "FIXED",
      min_spend: toStr(cond.min_spend),
      buy_qty: toStr(cond.buy_qty),
      get_qty: toStr(cond.get_qty),
      target_breeder_id: toStr(cond.target_breeder_id),
      gift_source: (cond.gift_manual_name ? "manual" : "stock") as "stock" | "manual",
      gift_product_id: toStr(cond.gift_product_id),
      gift_product_label: toStr(cond.gift_product_label),
      gift_manual_name: toStr(cond.gift_manual_name),
    });
    setBreederSearch("");
    setBreederSearchOpen(false);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("กรุณากรอกชื่อโปรโมชั่น");
      return;
    }
    if (!form.start_date || !form.end_date) {
      setError("กรุณาระบุระยะเวลา");
      return;
    }
    if (new Date(form.end_date) <= new Date(form.start_date)) {
      setError("วันสิ้นสุดต้องหลังวันเริ่มต้น");
      return;
    }
    const minSpendNum = form.min_spend && !Number.isNaN(Number(form.min_spend)) ? Number(form.min_spend) : 0;
    const isMinSpendGift = form.type === "FREEBIES" && minSpendNum > 0;
    if (form.type === "BUY_X_GET_Y" && (!form.buy_qty || !form.get_qty || Number(form.buy_qty) < 1 || Number(form.get_qty) < 1)) {
      setError("กรุณาระบุ ซื้อจำนวน และ แถมจำนวน");
      return;
    }
    if (form.type === "FREEBIES" && !isMinSpendGift && (!form.buy_qty || !form.get_qty || Number(form.buy_qty) < 1 || Number(form.get_qty) < 1)) {
      setError("กรุณาระบุ ซื้อจำนวน และ แถมจำนวน");
      return;
    }
    if (form.type === "FREEBIES" && isMinSpendGift && (!form.get_qty || Number(form.get_qty) < 1)) {
      setError("กรุณาระบุ แถมจำนวน");
      return;
    }
    if ((form.type === "FREEBIES" || form.type === "BUY_X_GET_Y") && form.gift_source === "stock" && !form.gift_product_id) {
      setError("กรุณาเลือกสินค้าของแถม");
      return;
    }
    if ((form.type === "FREEBIES" || form.type === "BUY_X_GET_Y") && form.gift_source === "manual" && !form.gift_manual_name?.trim()) {
      setError("กรุณาระบุชื่อของแถม");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const discountVal = form.type === "DISCOUNT" && form.discount_value && !Number.isNaN(Number(form.discount_value)) ? Number(form.discount_value) : null;
      const minSpendVal = form.min_spend && !Number.isNaN(Number(form.min_spend)) ? Number(form.min_spend) : null;
      const isMinSpendGift = form.type === "FREEBIES" && (minSpendVal ?? 0) > 0;
      const buyQtyVal = (form.type === "FREEBIES" || form.type === "BUY_X_GET_Y")
        ? (isMinSpendGift ? 1 : (form.buy_qty && !Number.isNaN(Number(form.buy_qty)) ? Number(form.buy_qty) : 1))
        : null;
      const getQtyVal = (form.type === "FREEBIES" || form.type === "BUY_X_GET_Y")
        ? (form.get_qty && !Number.isNaN(Number(form.get_qty)) ? Number(form.get_qty) : 1)
        : null;
      const conditions: Record<string, unknown> = {
        discount_type: form.type === "DISCOUNT" ? (form.discount_type || "PERCENTAGE") : null,
        discount_value: discountVal,
        min_spend: minSpendVal,
        buy_qty: buyQtyVal,
        get_qty: getQtyVal,
        target_breeder_id: form.target_breeder_id?.trim() || null,
        gift_source: (form.type === "FREEBIES" || form.type === "BUY_X_GET_Y") ? form.gift_source : null,
        gift_product_id: (form.type === "FREEBIES" || form.type === "BUY_X_GET_Y") && form.gift_source === "stock" && form.gift_product_id ? Number(form.gift_product_id) : null,
        gift_product_label: (form.type === "FREEBIES" || form.type === "BUY_X_GET_Y") && form.gift_source === "stock" && form.gift_product_label ? form.gift_product_label : null,
        gift_manual_name: (form.type === "FREEBIES" || form.type === "BUY_X_GET_Y") && form.gift_source === "manual" && form.gift_manual_name?.trim() ? form.gift_manual_name.trim() : null,
      };
      const payload = {
        name: form.name.trim(),
        type: form.type,
        description: form.description.trim() || null,
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString(),
        is_active: Boolean(form.is_active),
        discount_value: discountVal,
        conditions,
      };
      if (editing) {
        const res = await fetch(`/api/admin/promotions/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error ?? "บันทึกไม่สำเร็จ");
      } else {
        const res = await fetch("/api/admin/promotions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error ?? "สร้างไม่สำเร็จ");
      }
      setModalOpen(false);
      fetchList();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/admin/promotions/${deleteConfirm.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("ลบไม่สำเร็จ");
      setDeleteConfirm(null);
      fetchList();
    } catch (e) {
      console.error(e);
      toast({
        title: "เกิดข้อผิดพลาด (Error)",
        description: toastErrorMessage(e),
        variant: "destructive",
      });
    }
  };

  const filtered = list.filter((p) => {
    if (statusFilter === "all") return true;
    const now = new Date();
    const start = new Date(p.start_date);
    const end = new Date(p.end_date);
    if (statusFilter === "active") return p.is_active && now >= start && now <= end;
    if (statusFilter === "expired") return now > end;
    if (statusFilter === "upcoming") return now < start;
    return true;
  });

  const typeLabel = (t: PromotionType) => TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">จัดการโปรโมชั่น</h1>
          <p className="text-sm text-zinc-500">กำหนดกฎส่วนลดและของแถม (สำหรับ Phase ถัดไป: นำไปใช้กับ POS)</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-white hover:bg-primary/90">
          <Plus className="mr-1.5 h-4 w-4" /> เพิ่มโปรโมชั่น
        </Button>
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">กรอง</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label className="text-xs">สถานะ</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">หมดอายุ</SelectItem>
                <SelectItem value="upcoming">รอเริ่ม</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">รายการโปรโมชั่น</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50">
                <TableHead>ชื่อ</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>ระยะเวลา</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">ส่วนลด</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-400" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <Tag className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
                    <p className="text-sm text-zinc-400">
                      {statusFilter !== "all" ? "ไม่พบโปรโมชั่นที่ตรงกับกรอง" : "ยังไม่มีโปรโมชั่น"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id} className="hover:bg-zinc-50">
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {typeLabel(p.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">
                      {formatDate(p.start_date)} – {formatDate(p.end_date)}
                    </TableCell>
                    <TableCell>{statusBadge(p)}</TableCell>
                    <TableCell className="text-right">
                      {formatDiscount(p, breeders)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => setDeleteConfirm(p)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "แก้ไขโปรโมชั่น" : "เพิ่มโปรโมชั่น"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label>ชื่อโปรโมชั่น *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="เช่น ซื้อ 2 แถม 1"
              />
            </div>
            <div className="space-y-2">
              <Label>ประเภท</Label>
              <Select
                value={form.type}
                onValueChange={(v) => {
                  const t = v as PromotionType;
                  setForm((f) => ({
                    ...f,
                    type: t,
                    ...(t === "FREEBIES" && (!f.buy_qty || !f.get_qty) ? { buy_qty: f.buy_qty || "1", get_qty: f.get_qty || "1" } : {}),
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>คำอธิบาย</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="รายละเอียดโปรโมชั่น"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>วันเริ่ม *</Label>
                <Input
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>วันสิ้นสุด *</Label>
                <Input
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-300"
              />
              <Label htmlFor="is_active">เปิดใช้งาน</Label>
            </div>

            {form.type === "DISCOUNT" && (
              <div className="space-y-2">
                <Label>ประเภทส่วนลด</Label>
                <Select
                  value={form.discount_type}
                  onValueChange={(v) => setForm((f) => ({ ...f, discount_type: v as "PERCENTAGE" | "FIXED" }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">เปอร์เซ็นต์ (%) — สำหรับส่วนลดขั้นบันได</SelectItem>
                    <SelectItem value="FIXED">จำนวนเงิน (฿)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {form.type === "DISCOUNT" && (
              <>
                <div className="space-y-2">
                  <Label>{form.discount_type === "PERCENTAGE" ? "ส่วนลด (%)" : "ส่วนลด (฿)"}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={form.discount_type === "PERCENTAGE" ? 100 : undefined}
                    value={form.discount_value}
                    onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                    placeholder={form.discount_type === "PERCENTAGE" ? "เช่น 10" : "เช่น 100"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ยอดซื้อขั้นต่ำ (฿)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.min_spend}
                    onChange={(e) => setForm((f) => ({ ...f, min_spend: e.target.value }))}
                    placeholder="เช่น 2000"
                  />
                </div>
              </>
            )}

            {(form.type === "FREEBIES" || form.type === "BUY_X_GET_Y") && (
              <>
                <div className={`grid gap-4 ${(form.type === "FREEBIES" && (form.min_spend ? Number(form.min_spend) : 0) > 0) ? "grid-cols-1" : "grid-cols-2"}`}>
                  {!(form.type === "FREEBIES" && (form.min_spend ? Number(form.min_spend) : 0) > 0) && (
                    <div className="space-y-2">
                      <Label>ซื้อจำนวนเท่าไหร่ *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={form.buy_qty}
                        onChange={(e) => setForm((f) => ({ ...f, buy_qty: e.target.value }))}
                        placeholder="เช่น 2"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>แถมจำนวนเท่าไหร่ *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.get_qty}
                      onChange={(e) => setForm((f) => ({ ...f, get_qty: e.target.value }))}
                      placeholder="เช่น 1"
                    />
                  </div>
                </div>
                {form.type === "BUY_X_GET_Y" && (
                  <div className="space-y-2">
                    <Label>สายพันธุ์ (Breeder) — Trigger</Label>
                    <Select
                      value={form.target_breeder_id || "__none__"}
                      onValueChange={(v) => setForm((f) => ({ ...f, target_breeder_id: v === "__none__" ? "" : v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="เลือกสายพันธุ์" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— ทุกสายพันธุ์</SelectItem>
                        {breeders.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {(form.type === "FREEBIES" || form.type === "BUY_X_GET_Y") && (
                  <>
                    <div className="space-y-2">
                      <Label>แหล่งของแถม</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gift_source"
                            checked={form.gift_source === "stock"}
                            onChange={() => setForm((f) => ({ ...f, gift_source: "stock", gift_product_id: "", gift_product_label: "", gift_manual_name: "" }))}
                            className="h-4 w-4"
                          />
                          <span className="text-sm">เลือกจากสินค้าในร้าน</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gift_source"
                            checked={form.gift_source === "manual"}
                            onChange={() => setForm((f) => ({ ...f, gift_source: "manual", gift_product_id: "", gift_product_label: "" }))}
                            className="h-4 w-4"
                          />
                          <span className="text-sm">ระบุชื่อของแถมเอง</span>
                        </label>
                      </div>
                    </div>
                    {form.gift_source === "stock" && (
                      <div className="space-y-2" ref={giftProductRef}>
                        <Label>เลือกสินค้า *</Label>
                        <div className="relative">
                          <Input
                            placeholder="ค้นหาสินค้า..."
                            value={form.gift_product_id ? form.gift_product_label : giftProductSearch}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (form.gift_product_id) return;
                              setGiftProductSearch(v);
                              setGiftProductSearchOpen(true);
                            }}
                            onFocus={() => !form.gift_product_id && setGiftProductSearchOpen(true)}
                          />
                          {form.gift_product_id && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
                              onClick={() => { setForm((f) => ({ ...f, gift_product_id: "", gift_product_label: "" })); setGiftProductSearch(""); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {giftProductSearchOpen && giftProductResults.length > 0 && (
                            <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-48 overflow-auto">
                              {giftProductResults.map((prod) =>
                                prod.variants?.map((v) => (
                                  <button
                                    key={v.id}
                                    type="button"
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100"
                                    onClick={() => {
                                      setForm((f) => ({ ...f, gift_product_id: String(v.id), gift_product_label: `${prod.name} — ${v.unit_label}` }));
                                      setGiftProductSearch("");
                                      setGiftProductSearchOpen(false);
                                    }}
                                  >
                                    {prod.name} — {v.unit_label}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {form.gift_source === "manual" && (
                      <div className="space-y-2">
                        <Label>ชื่อของแถม *</Label>
                        <Input
                          placeholder="เช่น Grinder, T-Shirt"
                          value={form.gift_manual_name}
                          onChange={(e) => setForm((f) => ({ ...f, gift_manual_name: e.target.value }))}
                        />
                      </div>
                    )}
                    {form.type === "FREEBIES" && (
                      <div className="space-y-2">
                        <Label>ยอดซื้อขั้นต่ำเพื่อรับของแถม (฿)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={form.min_spend}
                          onChange={(e) => {
                            const v = e.target.value;
                            setForm((f) => ({
                              ...f,
                              min_spend: v,
                              ...(v && Number(v) > 0 && !f.get_qty ? { get_qty: "1" } : {}),
                            }));
                          }}
                          placeholder="เช่น 2000"
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {form.type === "BUNDLE" && (
              <div className="space-y-2" ref={breederSearchRef}>
                <Label>สายพันธุ์ (Breeder)</Label>
                <div className="relative">
                  <Input
                    placeholder="ค้นหาหรือเลือกแบรนด์..."
                    value={form.target_breeder_id ? (breeders.find((b) => String(b.id) === form.target_breeder_id)?.name ?? form.target_breeder_id) : breederSearch}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (form.target_breeder_id) {
                        setForm((f) => ({ ...f, target_breeder_id: "" }));
                      }
                      setBreederSearch(v);
                      setBreederSearchOpen(true);
                    }}
                    onFocus={() => setBreederSearchOpen(true)}
                  />
                  {form.target_breeder_id && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
                      onClick={() => { setForm((f) => ({ ...f, target_breeder_id: "" })); setBreederSearch(""); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {breederSearchOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-48 overflow-auto">
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100"
                        onClick={() => { setForm((f) => ({ ...f, target_breeder_id: "" })); setBreederSearch(""); setBreederSearchOpen(false); }}
                      >
                        — ทุกสายพันธุ์
                      </button>
                      {breeders
                        .filter((b) => !breederSearch.trim() || b.name.toLowerCase().includes(breederSearch.toLowerCase()))
                        .map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100"
                            onClick={() => { setForm((f) => ({ ...f, target_breeder_id: String(b.id) })); setBreederSearch(""); setBreederSearchOpen(false); }}
                          >
                            {b.name}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              {editing ? "บันทึก" : "เพิ่ม"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600">
            ลบโปรโมชั่น "{deleteConfirm?.name}" ใช่หรือไม่?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>ยกเลิก</Button>
            <Button variant="destructive" onClick={handleDelete}>ลบ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
