"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, HelpCircle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { useToast } from "@/hooks/use-toast";
import { toastErrorMessage } from "@/lib/admin-toast";
import { cn } from "@/lib/utils";

type Phase = "idle" | "optimizing" | "uploading";

type Row = {
  id: string;
  name: string;
  image_url_desktop: string;
  image_url_mobile: string;
  image_width: number | null;
  image_height: number | null;
  target_url: string;
  save_to_profile: boolean;
  display_delay_ms: number;
  display_mode: "POPUP" | "EASTER_EGG";
  probability: number;
  promo_code: string;
  discount_type: string;
  discount_value: string;
  target_paths: string[];
  start_at: string;
  end_at: string;
  total_limit: number;
  usage_count: number;
  per_user_limit: number;
  is_active: boolean;
};

function toLocal(dt: string): string {
  try {
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return "";
    const off = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - off).toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export default function PromotionCampaignsPage() {
  const { toast } = useToast();
  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [phaseD, setPhaseD] = useState<Phase>("idle");
  const [phaseM, setPhaseM] = useState<Phase>("idle");
  const uploadBusy = phaseD !== "idle" || phaseM !== "idle";
  const [deleteRow, setDeleteRow] = useState<Row | null>(null);
  const [pathsText, setPathsText] = useState("/\n/shop");
  const [form, setForm] = useState({
    name: "",
    image_url_desktop: "",
    image_url_mobile: "",
    image_width: "" as string,
    image_height: "" as string,
    target_url: "",
    save_to_profile: false,
    display_mode: "POPUP" as "POPUP" | "EASTER_EGG",
    display_delay_ms: "3000",
    probability: 1,
    promo_code: "",
    discount_type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    discount_value: "",
    start_date: "",
    end_date: "",
    total_limit: "0",
    per_user_limit: "1",
    is_active: true,
  });

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promotion-campaigns", { cache: "no-store" });
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

  const openAdd = () => {
    setEditing(null);
    const t = new Date().toISOString().slice(0, 16);
    const e = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16);
    setForm({
      name: "",
      image_url_desktop: "",
      image_url_mobile: "",
      image_width: "",
      image_height: "",
      target_url: "",
      save_to_profile: false,
      display_mode: "POPUP",
      display_delay_ms: "3000",
      probability: 1,
      promo_code: "",
      discount_type: "PERCENTAGE",
      discount_value: "",
      start_date: t,
      end_date: e,
      total_limit: "100",
      per_user_limit: "1",
      is_active: true,
    });
    setPhaseD("idle");
    setPhaseM("idle");
    setPathsText("/\n/shop");
    setModal(true);
  };

  const openEdit = (r: Row) => {
    setEditing(r);
    setForm({
      name: r.name,
      image_url_desktop: r.image_url_desktop,
      image_url_mobile: r.image_url_mobile ?? "",
      image_width: r.image_width != null ? String(r.image_width) : "",
      image_height: r.image_height != null ? String(r.image_height) : "",
      target_url: r.target_url ?? "",
      save_to_profile: !!r.save_to_profile,
      display_mode: r.display_mode === "EASTER_EGG" ? "EASTER_EGG" : "POPUP",
      display_delay_ms: String(r.display_delay_ms ?? 3000),
      probability: typeof r.probability === "number" ? r.probability : 1,
      promo_code: r.promo_code,
      discount_type: r.discount_type === "FIXED" ? "FIXED" : "PERCENTAGE",
      discount_value: String(r.discount_value),
      start_date: toLocal(r.start_at),
      end_date: toLocal(r.end_at),
      total_limit: String(r.total_limit),
      per_user_limit: String(r.per_user_limit),
      is_active: r.is_active,
    });
    setPhaseD("idle");
    setPhaseM("idle");
    setPathsText(r.target_paths?.length ? r.target_paths.join("\n") : "/");
    setModal(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.image_url_desktop || !form.promo_code.trim()) {
      toast({ title: "กรอกชื่อ รูปเดสก์ท็อป และโค้ด", variant: "destructive" });
      return;
    }
    if (uploadBusy) {
      toast({ title: "รออัปโหลดรูปให้เสร็จ", variant: "destructive" });
      return;
    }
    const paths = pathsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (paths.length === 0) {
      toast({ title: "ระบุ path อย่างน้อย 1 บรรทัด", variant: "destructive" });
      return;
    }
    const dv = Number(form.discount_value);
    if (Number.isNaN(dv) || dv < 0) {
      toast({ title: "ส่วนลดไม่ถูกต้อง", variant: "destructive" });
      return;
    }
    if (form.discount_type === "PERCENTAGE" && dv > 100) {
      toast({ title: "เปอร์เซ็นต์ไม่เกิน 100", variant: "destructive" });
      return;
    }
    const tl = parseInt(form.total_limit, 10);
    const pul = parseInt(form.per_user_limit, 10);
    if (Number.isNaN(tl) || tl < 0 || Number.isNaN(pul) || pul < 1) {
      toast({ title: "โควต้าไม่ถูกต้อง (total_limit ≥ 0, per_user ≥ 1)", variant: "destructive" });
      return;
    }
    const ddm = parseInt(form.display_delay_ms, 10);
    if (Number.isNaN(ddm) || ddm < 0) {
      toast({ title: "ดีเลย์ (ms) ไม่ถูกต้อง", variant: "destructive" });
      return;
    }

    const iw = form.image_width.trim() ? parseInt(form.image_width, 10) : null;
    const ih = form.image_height.trim() ? parseInt(form.image_height, 10) : null;
    if ((form.image_width.trim() && Number.isNaN(iw!)) || (form.image_height.trim() && Number.isNaN(ih!))) {
      toast({ title: "ความกว้าง/สูง ต้องเป็นตัวเลข", variant: "destructive" });
      return;
    }

    const mobile = form.image_url_mobile.trim();
    if (mobile && !/^https?:\/\//i.test(mobile)) {
      toast({ title: "URL รูปมือถือไม่ถูกต้อง", variant: "destructive" });
      return;
    }
    const tgt = form.target_url.trim();
    if (tgt && tgt.toLowerCase() !== "action:save" && !/^https?:\/\//i.test(tgt)) {
      toast({ title: "ลิงก์ปลายทางต้องเป็น http(s) หรือ action:save", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        image_url_desktop: form.image_url_desktop,
        image_url_mobile: mobile,
        image_width: iw,
        image_height: ih,
        target_url: tgt,
        save_to_profile: form.save_to_profile,
        display_mode: form.display_mode,
        display_delay_ms: ddm,
        probability: form.probability,
        promo_code: form.promo_code.trim(),
        discount_type: form.discount_type,
        discount_value: dv,
        target_paths: paths,
        start_at: new Date(form.start_date).toISOString(),
        end_at: new Date(form.end_date).toISOString(),
        total_limit: tl,
        per_user_limit: pul,
        is_active: form.is_active,
      };
      const url = editing
        ? `/api/admin/promotion-campaigns/${editing.id}`
        : "/api/admin/promotion-campaigns";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof j.error === "string" ? j.error : "บันทึกไม่สำเร็จ");
      setModal(false);
      fetchList();
      toast({ title: "บันทึกแล้ว" });
    } catch (e) {
      toast({ title: "Error", description: toastErrorMessage(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!deleteRow) return;
    try {
      const res = await fetch(`/api/admin/promotion-campaigns/${deleteRow.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("ลบไม่สำเร็จ");
      setDeleteRow(null);
      fetchList();
      toast({ title: "ลบแล้ว" });
    } catch (e) {
      toast({ title: "Error", description: toastErrorMessage(e), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/promotions"
            className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> กลับไปกฎโปรโมชั่น (POS)
          </Link>
          <h1 className="text-xl font-bold text-zinc-900">แคมเปญป๊อปอัพ</h1>
          <p className="text-sm text-zinc-500">
            แบนเนอร์ + โค้ด — รูปแคมเปญไม่มีลายน้ำ รองรับ PNG โปร่งใส
          </p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground">
          <Plus className="mr-1.5 h-4 w-4" /> เพิ่มแคมเปญ
        </Button>
      </div>

      <Card className="border-zinc-200/80">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-semibold tracking-tight">รายการ</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-200 bg-zinc-50/80 hover:bg-zinc-50/80">
                <TableHead>ชื่อ</TableHead>
                <TableHead>โหมด</TableHead>
                <TableHead>โค้ด</TableHead>
                <TableHead>ใช้แล้ว / โควต้า</TableHead>
                <TableHead>สถานะ</TableHead>
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
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-zinc-400">
                    ยังไม่มีแคมเปญ
                  </TableCell>
                </TableRow>
              ) : (
                list.map((r) => (
                  <TableRow key={r.id} className="border-zinc-100">
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-zinc-200 font-normal text-zinc-600">
                        {r.display_mode === "EASTER_EGG" ? "Easter Egg" : "Popup"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.promo_code}</TableCell>
                    <TableCell className="text-sm tabular-nums text-zinc-600">
                      {r.usage_count} / {r.total_limit === 0 ? "∞" : r.total_limit}
                    </TableCell>
                    <TableCell>
                      {r.is_active ? (
                        <Badge className="bg-emerald-100 font-normal text-emerald-800">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="font-normal">
                          ปิด
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => setDeleteRow(r)}
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

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto border-zinc-200 p-0 gap-0 sm:max-w-2xl">
          <div className="border-b border-zinc-100 px-6 py-4">
            <DialogHeader>
              <DialogTitle className="text-lg">{editing ? "แก้ไขแคมเปญ" : "เพิ่มแคมเปญ"}</DialogTitle>
            </DialogHeader>
          </div>
          <div className="space-y-6 px-6 py-5">
            <div className="space-y-1.5">
              <Label className="text-zinc-700">ชื่อแคมเปญ *</Label>
              <Input
                className="border-zinc-200"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">รูปภาพ</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageUploadField
                  label="Desktop *"
                  value={form.image_url_desktop}
                  onChange={(url) => setForm((f) => ({ ...f, image_url_desktop: url }))}
                  onPhaseChange={setPhaseD}
                  campaignTransparency
                />
                <ImageUploadField
                  label="Mobile (optional)"
                  value={form.image_url_mobile}
                  onChange={(url) => setForm((f) => ({ ...f, image_url_mobile: url }))}
                  onPhaseChange={setPhaseM}
                  campaignTransparency
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-zinc-700">ความกว้าง (px)</Label>
                  <Input
                    className="border-zinc-200"
                    inputMode="numeric"
                    value={form.image_width}
                    onChange={(e) => setForm((f) => ({ ...f, image_width: e.target.value }))}
                    placeholder="720"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-700">ความสูง (px)</Label>
                  <Input
                    className="border-zinc-200"
                    inputMode="numeric"
                    value={form.image_height}
                    onChange={(e) => setForm((f) => ({ ...f, image_height: e.target.value }))}
                    placeholder="400"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-zinc-100" />

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">พฤติกรรมการแสดง</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-zinc-700">โหมดแสดง</Label>
                  <Select
                    value={form.display_mode}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, display_mode: v as "POPUP" | "EASTER_EGG" }))
                    }
                  >
                    <SelectTrigger className="border-zinc-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POPUP">Popup (กลางจอ)</SelectItem>
                      <SelectItem value="EASTER_EGG">Easter Egg (มุมล่างขวา)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-700">ดีเลย์ก่อนแสดง (ms)</Label>
                  <Input
                    type="number"
                    min={0}
                    className="border-zinc-200"
                    value={form.display_delay_ms}
                    onChange={(e) => setForm((f) => ({ ...f, display_delay_ms: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-zinc-700">โอกาสแสดง (probability)</Label>
                  <span
                    className="inline-flex cursor-help text-zinc-400"
                    title="1.0 = แสดงทุกครั้งที่เข้าเงื่อนไข · 0.5 = ประมาณ 50% · 0 = ไม่แสดง"
                  >
                    <HelpCircle className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={form.probability}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, probability: parseFloat(e.target.value) }))
                    }
                    className={cn(
                      "h-2 w-full flex-1 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-primary",
                      "sm:max-w-xs"
                    )}
                  />
                  <span className="shrink-0 text-sm tabular-nums text-zinc-600">
                    {(form.probability * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-400">
                  1.0 = 100% · 0.5 = 50% · สุ่มฝั่งลูกค้าเมื่อโหลดหน้า
                </p>
              </div>
              <div className="mt-4 space-y-1.5">
                <Label className="text-zinc-700">ลิงก์เมื่อคลิกแบนเนอร์ (optional)</Label>
                <Input
                  className="border-zinc-200"
                  placeholder="https:// หรือ action:save"
                  value={form.target_url}
                  onChange={(e) => setForm((f) => ({ ...f, target_url: e.target.value }))}
                />
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300"
                  checked={form.save_to_profile}
                  onChange={(e) => setForm((f) => ({ ...f, save_to_profile: e.target.checked }))}
                />
                คลิกแล้วบันทึกโค้ดลงโปรไฟล์ (เก็บคูปอง)
              </label>
            </div>

            <Separator className="bg-zinc-100" />

            <div className="space-y-1.5">
              <Label className="text-zinc-700">โค้ดส่วนลด *</Label>
              <Input
                className="border-zinc-200 font-mono uppercase"
                value={form.promo_code}
                onChange={(e) => setForm((f) => ({ ...f, promo_code: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-zinc-700">ประเภทส่วนลด</Label>
                <Select
                  value={form.discount_type}
                  onValueChange={(v) => setForm((f) => ({ ...f, discount_type: v as "PERCENTAGE" | "FIXED" }))}
                >
                  <SelectTrigger className="border-zinc-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">เปอร์เซ็นต์</SelectItem>
                    <SelectItem value="FIXED">จำนวนเงิน (฿)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-700">ค่าส่วนลด</Label>
                <Input
                  type="number"
                  min={0}
                  className="border-zinc-200"
                  value={form.discount_value}
                  onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-700">Target paths (บรรทัดละ 1 path)</Label>
              <textarea
                className="flex min-h-[88px] w-full rounded-md border border-zinc-200 bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                value={pathsText}
                onChange={(e) => setPathsText(e.target.value)}
                placeholder={"/\n/shop"}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-zinc-700">เริ่ม</Label>
                <Input
                  type="datetime-local"
                  className="border-zinc-200"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-700">สิ้นสุด</Label>
                <Input
                  type="datetime-local"
                  className="border-zinc-200"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-zinc-700">โควต้ารวม (0 = ไม่จำกัด)</Label>
                <Input
                  type="number"
                  min={0}
                  className="border-zinc-200"
                  value={form.total_limit}
                  onChange={(e) => setForm((f) => ({ ...f, total_limit: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-700">ต่อผู้ใช้</Label>
                <Input
                  type="number"
                  min={1}
                  className="border-zinc-200"
                  value={form.per_user_limit}
                  onChange={(e) => setForm((f) => ({ ...f, per_user_limit: e.target.value }))}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-300"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              เปิดใช้งาน
            </label>
          </div>
          <DialogFooter className="gap-2 border-t border-zinc-100 px-6 py-4 sm:justify-end">
            <Button variant="outline" className="border-zinc-200" onClick={() => setModal(false)}>
              ยกเลิก
            </Button>
            <Button onClick={save} disabled={saving} className="bg-primary">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteRow} onOpenChange={() => setDeleteRow(null)}>
        <DialogContent className="border-zinc-200">
          <DialogHeader>
            <DialogTitle>ลบแคมเปญ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600">{deleteRow?.name}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRow(null)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={del}>
              ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
