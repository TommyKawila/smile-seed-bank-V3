"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, Loader2, Truck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  SHIPPING_ADMIN_DEFAULT_FEE,
  SHIPPING_ADMIN_DEFAULT_FREE_THRESHOLD,
} from "@/lib/validations/shipping-admin";
import { SHIPPING_RULES_BROADCAST_CHANNEL } from "@/lib/storefront-shipping";
import { bangkokTodayYmd, resolveShippingPause } from "@/lib/shipping-pause";

export default function ShippingSettingsPage() {
  const { toast } = useToast();
  const [baseFee, setBaseFee] = useState(String(SHIPPING_ADMIN_DEFAULT_FEE));
  const [threshold, setThreshold] = useState(String(SHIPPING_ADMIN_DEFAULT_FREE_THRESHOLD));
  const [pauseEnabled, setPauseEnabled] = useState(false);
  const [pauseFrom, setPauseFrom] = useState("");
  const [pauseUntil, setPauseUntil] = useState("");
  const [pauseMessageTh, setPauseMessageTh] = useState("");
  const [pauseMessageEn, setPauseMessageEn] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/shipping", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
      setBaseFee(String(data.base_fee ?? SHIPPING_ADMIN_DEFAULT_FEE));
      setThreshold(String(data.free_shipping_threshold ?? SHIPPING_ADMIN_DEFAULT_FREE_THRESHOLD));
      setPauseEnabled(Boolean(data.shipping_pause_enabled));
      setPauseFrom(data.shipping_pause_from ?? "");
      setPauseUntil(data.shipping_pause_until ?? "");
      setPauseMessageTh(data.shipping_pause_message_th ?? "");
      setPauseMessageEn(data.shipping_pause_message_en ?? "");
    } catch (e) {
      toast({
        title: "โหลดไม่สำเร็จ",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/shipping", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_fee: Number(baseFee),
          free_shipping_threshold: Number(threshold),
          shipping_pause_enabled: pauseEnabled,
          shipping_pause_from: pauseFrom,
          shipping_pause_until: pauseUntil,
          shipping_pause_message_th: pauseMessageTh,
          shipping_pause_message_en: pauseMessageEn,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");

      if (typeof BroadcastChannel !== "undefined") {
        const ch = new BroadcastChannel(SHIPPING_RULES_BROADCAST_CHANNEL);
        ch.postMessage({ type: "updated" });
        ch.close();
      }

      toast({
        title: "บันทึกแล้ว",
        description: "ค่าจัดส่งและแจ้งหยุดส่งอัปเดตแล้ว",
      });
    } catch (e) {
      toast({
        title: "บันทึกไม่สำเร็จ",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const previewPause = resolveShippingPause({
    shipping_pause_enabled: pauseEnabled ? "true" : "false",
    shipping_pause_from: pauseFrom,
    shipping_pause_until: pauseUntil,
    shipping_pause_message_th: pauseMessageTh,
    shipping_pause_message_en: pauseMessageEn,
  });

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 px-4 py-8">
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        ตั้งค่าร้านค้า
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">ค่าจัดส่ง</h1>
        <p className="mt-1 text-sm text-zinc-500">
          กำหนดค่าส่งมาตรฐาน · ส่งฟรี · แจ้งหยุดจัดส่งชั่วคราว
        </p>
      </div>

      <Card className="border-zinc-200/80 shadow-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Truck className="h-4 w-4 text-primary" />
            Shipping rules
          </CardTitle>
          <CardDescription className="text-xs">
            ลูกค้าที่มียอดรวม (หลังส่วนลด) ต่ำกว่าเกณฑ์จะถูกคิดค่าส่งมาตรฐาน
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="base_fee" className="text-sm font-medium text-zinc-700">
              ค่าจัดส่งมาตรฐาน (บาท)
            </Label>
            <Input
              id="base_fee"
              type="number"
              min={0}
              step={1}
              className="max-w-xs"
              value={baseFee}
              onChange={(e) => setBaseFee(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="threshold" className="text-sm font-medium text-zinc-700">
              ยอดขั้นต่ำส่งฟรี (บาท)
            </Label>
            <Input
              id="threshold"
              type="number"
              min={0}
              step={1}
              className="max-w-xs"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
            <p className="text-xs text-zinc-400">เมื่อยอดรวม &ge; ค่านี้ ค่าจัดส่ง = 0</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200/80 shadow-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            แจ้งหยุดจัดส่งชั่วคราว
          </CardTitle>
          <CardDescription className="text-xs">
            แสดงแถบทั้งร้าน + ตะกร้า + Checkout · ยังรับออเดอร์ได้ · ปิดอัตโนมัติเมื่อถึงวันเริ่มส่ง
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="pause_enabled" className="text-sm font-medium text-zinc-700">
              เปิดแจ้งเตือน
            </Label>
            <Switch id="pause_enabled" checked={pauseEnabled} onCheckedChange={setPauseEnabled} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pause_from" className="text-sm font-medium text-zinc-700">
                วันเริ่มหยุด (ไม่บังคับ)
              </Label>
              <Input
                id="pause_from"
                type="date"
                value={pauseFrom}
                onChange={(e) => setPauseFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pause_until" className="text-sm font-medium text-zinc-700">
                วันเริ่มส่งอีกครั้ง *
              </Label>
              <Input
                id="pause_until"
                type="date"
                value={pauseUntil}
                onChange={(e) => setPauseUntil(e.target.value)}
                required={pauseEnabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pause_message_th" className="text-sm font-medium text-zinc-700">
              ข้อความ TH (ว่าง = ใช้เทมเพลตจากวันที่)
            </Label>
            <Textarea
              id="pause_message_th"
              rows={2}
              value={pauseMessageTh}
              onChange={(e) => setPauseMessageTh(e.target.value)}
              placeholder="ช่วงนี้ยังรับออเดอร์ได้ แต่ยังไม่จัดส่ง · จะเริ่มส่งอีกครั้งวันที่ …"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pause_message_en" className="text-sm font-medium text-zinc-700">
              ข้อความ EN (ว่าง = ใช้เทมเพลตจากวันที่)
            </Label>
            <Textarea
              id="pause_message_en"
              rows={2}
              value={pauseMessageEn}
              onChange={(e) => setPauseMessageEn(e.target.value)}
              placeholder="We're still accepting orders, but shipping is paused · Resumes …"
            />
          </div>

          {pauseEnabled && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
              <p className="font-medium">ตัวอย่างที่ลูกค้าเห็น (วันนี้ {bangkokTodayYmd()}):</p>
              <p className="mt-1">{previewPause?.messageTh ?? "— ยังไม่แสดง (ตรวจวันที่หรือปิดโหมด)"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        className="min-w-[140px] gap-2"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {saving ? "กำลังบันทึก..." : "Save Changes"}
      </Button>
    </div>
  );
}
