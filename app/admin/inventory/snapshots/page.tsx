"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Loader2, Camera, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { toastErrorMessage } from "@/lib/admin-toast";

type ReconciliationRow = {
  variant_id: string;
  product_name: string | null;
  unit_label: string;
  master_sku: string | null;
  breeder_name: string | null;
  starting_stock: number | null;
  units_sold: number;
  expected_stock: number | null;
  actual_stock: number;
  has_discrepancy: boolean;
};

type ReconciliationData = {
  date: string;
  prev_date: string;
  rows: ReconciliationRow[];
};

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function StockSnapshotsPage() {
  const [date, setDate] = useState(() => toDateStr(new Date()));
  const [data, setData] = useState<ReconciliationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [takingSnapshot, setTakingSnapshot] = useState(false);

  const fetchReconciliation = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/inventory/snapshot/reconciliation?date=${date}`
      );
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
    fetchReconciliation();
  }, [fetchReconciliation]);

  const handleTakeSnapshot = async () => {
    setTakingSnapshot(true);
    try {
      const res = await fetch("/api/admin/inventory/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "บันทึกไม่สำเร็จ");
      fetchReconciliation();
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

  const discrepancyCount = data?.rows.filter((r) => r.has_discrepancy).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Stock Audit / สต็อกประจำวัน</h1>
        <p className="text-sm text-zinc-500">
          เปรียบเทียบสต็อกเปิด-ขาย-คงเหลือ และตรวจสอบความคลาดเคลื่อน
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            เลือกวันที่
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="snap-date">วันที่</Label>
            <Input
              id="snap-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTakeSnapshot}
            disabled={takingSnapshot}
          >
            {takingSnapshot ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <><Camera className="mr-1.5 h-4 w-4" /> บันทึก Snapshot วันนี้</>
            )}
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !data ? (
        <Card>
          <CardContent className="py-12 text-center text-zinc-500">
            ไม่พบข้อมูล
          </CardContent>
        </Card>
      ) : (
        <>
          {discrepancyCount > 0 && (
            <div className="rounded-lg bg-amber-50 px-4 py-3 flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>
                พบความคลาดเคลื่อน {discrepancyCount} รายการ (Expected ≠ Actual)
              </span>
            </div>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Reconciliation — วันที่ {date}
              </CardTitle>
              <p className="text-xs text-zinc-500">
                Starting Stock จาก snapshot วันที่ {data.prev_date} · Units Sold
                จากออเดอร์วันที่ {date}
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white border-b border-zinc-200">
                    <tr>
                      <th className="py-2 text-left font-medium text-zinc-600">
                        สินค้า
                      </th>
                      <th className="py-2 text-left font-medium text-zinc-600">
                        Unit
                      </th>
                      <th className="py-2 text-right font-medium text-zinc-600">
                        เปิด
                      </th>
                      <th className="py-2 text-right font-medium text-zinc-600">
                        ขาย
                      </th>
                      <th className="py-2 text-right font-medium text-zinc-600">
                        คาดหวัง
                      </th>
                      <th className="py-2 text-right font-medium text-zinc-600">
                        จริง
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r) => (
                      <tr
                        key={r.variant_id}
                        className={`border-b border-zinc-100 ${
                          r.has_discrepancy ? "bg-amber-50" : ""
                        }`}
                      >
                        <td className="py-2">
                          <span className="font-medium">
                            {r.product_name ?? "—"}
                          </span>
                          {r.breeder_name && (
                            <span className="ml-1 text-xs text-zinc-500">
                              ({r.breeder_name})
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-zinc-600">{r.unit_label}</td>
                        <td className="py-2 text-right">
                          {r.starting_stock != null ? r.starting_stock : "—"}
                        </td>
                        <td className="py-2 text-right">{r.units_sold}</td>
                        <td className="py-2 text-right">
                          {r.expected_stock != null ? r.expected_stock : "—"}
                        </td>
                        <td className="py-2 text-right font-medium">
                          {r.actual_stock}
                          {r.has_discrepancy && (
                            <span className="ml-1 text-amber-600">⚠</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.rows.length === 0 && (
                <p className="py-8 text-center text-zinc-400">
                  ไม่มีข้อมูลสินค้า
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
