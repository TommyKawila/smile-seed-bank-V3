"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, Truck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  SHIPPING_ADMIN_DEFAULT_FEE,
  SHIPPING_ADMIN_DEFAULT_FREE_THRESHOLD,
} from "@/lib/validations/shipping-admin";
import { SHIPPING_RULES_BROADCAST_CHANNEL } from "@/lib/storefront-shipping";

export default function ShippingSettingsPage() {
  const { toast } = useToast();
  const [baseFee, setBaseFee] = useState(String(SHIPPING_ADMIN_DEFAULT_FEE));
  const [threshold, setThreshold] = useState(String(SHIPPING_ADMIN_DEFAULT_FREE_THRESHOLD));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/shipping", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
      setBaseFee(String(data.base_fee ?? SHIPPING_ADMIN_DEFAULT_FEE));
      setThreshold(String(data.free_shipping_threshold ?? SHIPPING_ADMIN_DEFAULT_FREE_THRESHOLD));
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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");

      if (typeof BroadcastChannel !== "undefined") {
        const ch = new BroadcastChannel(SHIPPING_RULES_BROADCAST_CHANNEL);
        ch.postMessage({ type: "updated" });
        ch.close();
      }

      toast({ title: "บันทึกแล้ว", description: "ค่าจัดส่งอัปเดตแล้ว — หน้าร้านจะดึงค่าใหม่เมื่อโหลดหรือเปิดแท็บอื่น" });
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
          กำหนดค่าส่งมาตรฐานและยอดขั้นต่ำสำหรับส่งฟรี (หมวด Seeds)
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
        <CardContent className="space-6">
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
            <p className="text-xs text-zinc-400">
              เมื่อยอดรวม &ge; ค่านี้ ค่าจัดส่ง = 0
            </p>
          </div>

          <div className="pt-2">
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
        </CardContent>
      </Card>
    </div>
  );
}
