"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Percent,
  Loader2,
  Printer,
  Calendar,
  ShoppingBag,
  RotateCcw,
  Camera,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { toastErrorMessage } from "@/lib/admin-toast";

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "เงินสด",
  TRANSFER: "โอนเงิน",
  COD: "COD",
  CRYPTO: "Crypto",
};

type ReportData = {
  date: string;
  totalSales: number;
  orderCount: number;
  paymentBreakdown: Record<string, number>;
  pointsDiscountAmount: number;
  pointsRedeemed: number;
  wholesaleDiscountAmount: number;
  orders: {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string | null;
    total_amount: number;
    payment_method: string | null;
    status: string | null;
    created_at: string | null;
  }[];
  topProducts: { product_name: string; quantity: number }[];
};

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function DailyReportPage() {
  const { toast } = useToast();
  const [date, setDate] = useState(() => toDateStr(new Date()));
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [printMode, setPrintMode] = useState(false);
  const [voidModal, setVoidModal] = useState<{ orderId: string } | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);
  const [takingSnapshot, setTakingSnapshot] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/daily?date=${date}`);
      if (!res.ok) throw new Error("โหลดไม่สำเร็จ");
      const j = await res.json();
      setData(j);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePrint = () => {
    window.print();
  };

  const handleTakeSnapshot = async () => {
    setTakingSnapshot(true);
    try {
      const res = await fetch("/api/admin/inventory/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "บันทึก Snapshot ไม่สำเร็จ");
      toast({
        title: "สำเร็จ (Success)",
        description: `บันทึก Snapshot วันที่ ${date} สำเร็จ (${j.count} รายการ)`,
        variant: "default",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "เกิดข้อผิดพลาด (Error)",
        description: toastErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setTakingSnapshot(false);
    }
  };

  const handleVoidSubmit = async () => {
    if (!voidModal) return;
    setVoiding(true);
    try {
      const res = await fetch(`/api/admin/orders/${voidModal.orderId}/void`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ void_reason: voidReason || undefined }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "ยกเลิกไม่สำเร็จ");
      setVoidModal(null);
      setVoidReason("");
      fetchReport();
    } catch (e) {
      console.error(e);
      toast({
        title: "เกิดข้อผิดพลาด (Error)",
        description: toastErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setVoiding(false);
    }
  };

  const totalDiscounts = (data?.pointsDiscountAmount ?? 0) + (data?.wholesaleDiscountAmount ?? 0);

  return (
    <div className="space-y-6">
      <div className="hidden print:block text-center py-4 border-b border-zinc-200">
        <h1 className="text-xl font-bold">รายงานยอดขายรายวัน — Smile Seed Bank</h1>
        <p className="text-sm text-zinc-600 mt-1">
          วันที่ {data ? new Date(data.date + "T00:00:00").toLocaleDateString("th-TH", { dateStyle: "long" }) : date}
        </p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">รายงานยอดขายรายวัน</h1>
          <p className="text-sm text-zinc-500">สรุปยอดขายและสินค้าขายดี</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="report-date" className="text-sm text-zinc-600">
              วันที่
            </Label>
            <Input
              id="report-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchReport} disabled={loading} className="print:hidden">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
            รีเฟรช
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTakeSnapshot}
            disabled={takingSnapshot}
            className="print:hidden"
            title="ปิดวัน (Close Day) — บันทึกสต็อก ณ เวลาปัจจุบัน">
            {takingSnapshot ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            บันทึก Snapshot
          </Button>
          <Button variant="outline" size="sm" asChild className="print:hidden">
            <Link href="/admin/inventory/snapshots">Stock Audit</Link>
          </Button>
          <Button size="sm" onClick={handlePrint} className="bg-primary text-white hover:bg-primary/90 print:hidden">
            <Printer className="mr-1.5 h-4 w-4" />
            พิมพ์รายงาน
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !data ? (
        <Card>
          <CardContent className="py-12 text-center text-zinc-500">ไม่พบข้อมูล</CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">ยอดขายรวม</p>
                    <p className="mt-1 text-2xl font-bold text-zinc-900">{formatPrice(data.totalSales)}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">{data.orderCount} ออเดอร์</p>
                  </div>
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-zinc-500">แยกตามช่องทางชำระ</p>
                <div className="mt-2 space-y-1">
                  {Object.entries(data.paymentBreakdown)
                    .filter(([, v]) => v > 0)
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-zinc-600">{PAYMENT_LABELS[k] ?? k}</span>
                        <span className="font-medium">{formatPrice(v)}</span>
                      </div>
                    ))}
                  {Object.keys(data.paymentBreakdown).length === 0 && (
                    <p className="text-sm text-zinc-400">—</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">ส่วนลดที่ให้</p>
                    <p className="mt-1 text-lg font-bold text-primary">
                      {formatPrice(totalDiscounts)}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      คะแนน {data.pointsRedeemed} pts · {formatPrice(data.pointsDiscountAmount)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-accent p-2.5">
                    <Percent className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">จำนวนออเดอร์</p>
                    <p className="mt-1 text-2xl font-bold text-zinc-900">{data.orderCount}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-100 p-2.5">
                    <ShoppingBag className="h-5 w-5 text-zinc-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Orders Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">รายการออเดอร์ ({data.date})</CardTitle>
              </CardHeader>
              <CardContent>
                {data.orders.length === 0 ? (
                  <p className="py-8 text-center text-sm text-zinc-400">ไม่มีออเดอร์</p>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-zinc-200">
                          <th className="py-2 text-left font-medium text-zinc-600">เวลา</th>
                          <th className="py-2 text-left font-medium text-zinc-600">ลูกค้า</th>
                          <th className="py-2 text-right font-medium text-zinc-600">ยอด</th>
                          <th className="py-2 text-right font-medium text-zinc-600 print:hidden">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.orders.map((o) => (
                          <tr key={o.id} className="border-b border-zinc-100">
                            <td className="py-2 text-zinc-600">
                              {o.created_at
                                ? new Date(o.created_at).toLocaleTimeString("th-TH", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </td>
                            <td className="py-2">
                              <span className="font-medium">{o.customer_name}</span>
                            </td>
                            <td className="py-2 text-right font-medium">{formatPrice(o.total_amount)}</td>
                            <td className="py-2 text-right print:hidden">
                              {o.status === "COMPLETED" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => setVoidModal({ orderId: o.id })}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" title="ยกเลิกออเดอร์" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">สินค้าขายดี Top 5</CardTitle>
              </CardHeader>
              <CardContent>
                {data.topProducts.length === 0 ? (
                  <p className="py-8 text-center text-sm text-zinc-400">ไม่มีข้อมูล</p>
                ) : (
                  <div className="space-y-2">
                    {data.topProducts.map((p, i) => (
                      <div
                        key={p.product_name}
                        className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {i + 1}
                          </span>
                          <span className="font-medium text-zinc-800">{p.product_name}</span>
                        </div>
                        <span className="text-sm font-semibold text-primary">{p.quantity} ชิ้น</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Void Dialog */}
          <Dialog open={!!voidModal} onOpenChange={(o) => !o && setVoidModal(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-700">
                  <RotateCcw className="h-5 w-5" />
                  ยกเลิกออเดอร์ (Void)
                </DialogTitle>
              </DialogHeader>
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                แน่ใจหรือไม่? การยกเลิกจะคืนสต็อกและปรับคะแนนลูกค้าอัตโนมัติ
              </p>
              <Textarea
                placeholder="เหตุผล (ไม่บังคับ)"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                rows={2}
                className="resize-none"
              />
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setVoidModal(null)}>
                  ยกเลิก
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void handleVoidSubmit()}
                  disabled={voiding}
                >
                  {voiding ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยันยกเลิก"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

    </div>
  );
}
