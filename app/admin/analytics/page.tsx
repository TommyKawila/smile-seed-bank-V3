"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Package,
  Users,
  Percent,
  BarChart3,
  PieChart as PieChartIcon,
  Loader2,
  Download,
  PackageOpen,
  FilePlus,
  Sparkles,
  Leaf,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Pie,
  PieChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LowStockWidget } from "@/components/admin/LowStockWidget";
import { useExecutiveStats } from "@/hooks/useExecutiveStats";
import { exportOrdersToExcel, type OrderExportRow } from "@/lib/export-utils";
import { formatPrice, cn } from "@/lib/utils";

const EMERALD = "#059669";
const NAVY = "#003366";
const AMBER = "#d97706";

/** Distinct slice colors for top strains pie */
const STRAIN_PIE_COLORS = ["#059669", "#003366", "#ca8a04", "#7c3aed", "#e11d48"] as const;
const UNKNOWN_BREEDER_LABEL = "Unknown Breeder";

function StrainPieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: { strainName?: string; breederName?: string; value?: number };
  }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p?.strainName) return null;
  const breeder =
    (p.breederName ?? "").trim() || UNKNOWN_BREEDER_LABEL;
  const title = `${p.strainName} (${breeder})`;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="max-w-[240px] break-words font-semibold text-zinc-900">{title}</p>
      <p className="text-zinc-600">
        {Number(p.value ?? 0).toLocaleString("th-TH")} หน่วย
      </p>
    </div>
  );
}

function MetricCard({
  title,
  value,
  sub,
  icon: Icon,
  accentClass,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accentClass: string;
}) {
  return (
    <Card className="border-zinc-200/80 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-500">{title}</p>
            <p className="mt-1 truncate text-2xl font-bold tracking-tight text-zinc-900">{value}</p>
            {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
          </div>
          <div className={cn("shrink-0 rounded-xl p-2.5", accentClass)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function statusBadgeCls(status: string, paymentStatus?: string) {
  const s = (status ?? "").toUpperCase();
  const ps = (paymentStatus ?? "").toLowerCase();
  if (s === "PENDING" && ps === "paid")
    return "bg-emerald-100 text-emerald-800";
  if (["PAID", "COMPLETED", "SHIPPED", "DELIVERED"].includes(s))
    return "bg-emerald-100 text-emerald-800";
  if (s === "PENDING") return "bg-amber-100 text-amber-800";
  if (s === "CANCELLED" || s === "VOIDED") return "bg-zinc-200 text-zinc-700";
  return "bg-zinc-100 text-zinc-600";
}

type DashToast = { id: number; msg: string; type: "info" | "success" | "error" };

export default function DashboardPage() {
  const [range, setRange] = useState<"7" | "30" | "month">("30");
  const { data, loading, error } = useExecutiveStats(range);
  const [exporting, setExporting] = useState(false);
  const [toasts, setToasts] = useState<DashToast[]>([]);
  const toastSeq = useRef(0);
  const breederDisplayToastSent = useRef(false);

  const pushToast = (msg: string, type: DashToast["type"], ttl = 3800) => {
    const id = ++toastSeq.current;
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), ttl);
  };

  const handleExportReport = async () => {
    const loadingId = ++toastSeq.current;
    setToasts((p) => [...p, { id: loadingId, msg: "กำลังเตรียมไฟล์รายงานการเงิน...", type: "info" }]);
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/dashboard/orders-export?range=${range}`, { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "ส่งออกไม่สำเร็จ");
      const orders = (j.orders ?? []) as OrderExportRow[];
      exportOrdersToExcel(
        orders,
        `sales-report-${range}-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      setToasts((p) => p.filter((t) => t.id !== loadingId));
      pushToast("ส่งออกไฟล์รายงานเรียบร้อยแล้ว!", "success");
    } catch (e) {
      setToasts((p) => p.filter((t) => t.id !== loadingId));
      pushToast(String(e), "error");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (loading || !data || breederDisplayToastSent.current) return;
    if (data.metrics.totalRevenue === 0 && data.metrics.orderCount === 0) return;
    breederDisplayToastSent.current = true;
    pushToast("ปรับปรุงการแสดงผลชื่อค่ายเรียบร้อยแล้ว", "success");
  }, [loading, data]);

  const pieData =
    data?.topStrains.map((s, i) => {
      const strainName = s.name.trim() || "—";
      const breeder =
        (s.breederName ?? "").trim() || UNKNOWN_BREEDER_LABEL;
      const legendLabel = `${strainName} (${breeder})`;
      return {
        strainName,
        breederName: breeder,
        legendLabel,
        value: s.quantity,
        color: STRAIN_PIE_COLORS[i] ?? "#71717a",
      };
    }) ?? [];

  const isDashboardEmpty =
    !!data && data.metrics.totalRevenue === 0 && data.metrics.orderCount === 0;

  return (
    <div className="space-y-6 p-1">
      {toasts.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-[300] flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={cn(
                "rounded-xl px-4 py-3 text-sm font-medium shadow-lg",
                t.type === "success" && "bg-emerald-700 text-white",
                t.type === "info" && "bg-indigo-700 text-white",
                t.type === "error" && "bg-red-600 text-white"
              )}
            >
              {t.msg}
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Executive Sales</h1>
          <p className="text-sm text-zinc-500">ยอดขาย · ใบเสนอราคา · ลูกค้า VIP</p>
          <Link
            href="/admin/dashboard"
            className="mt-1 inline-block text-xs font-medium text-primary hover:underline sm:text-sm"
          >
            ← Simple dashboard
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
            <SelectTrigger className="w-[200px] border-zinc-200">
              <SelectValue placeholder="ช่วงเวลา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 วันล่าสุด</SelectItem>
              <SelectItem value="30">30 วันล่าสุด</SelectItem>
              <SelectItem value="month">เดือนนี้</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="default"
            disabled={exporting}
            className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => void handleExportReport()}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <Download className="h-4 w-4 shrink-0" />
            )}
            Export Report
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total Revenue"
              value={formatPrice(data.metrics.totalRevenue)}
              sub={
                isDashboardEmpty
                  ? "ยังไม่มียอดในช่วงที่เลือก — พร้อมนับทันทีที่มีออเดอร์"
                  : `ค่าส่ง ${formatPrice(data.metrics.totalShipping)} · ส่วนลด ${formatPrice(data.metrics.totalDiscount)}`
              }
              icon={TrendingUp}
              accentClass="bg-emerald-600"
            />
            <MetricCard
              title="Net Product Sales"
              value={formatPrice(data.metrics.netProductRevenue)}
              sub={
                isDashboardEmpty
                  ? "รายได้สุทธิจากสินค้าจะแสดงที่นี่"
                  : "รายได้สินค้า (หักค่าส่ง + คืนส่วนลด)"
              }
              icon={Package}
              accentClass="bg-[#003366]"
            />
            <MetricCard
              title="Orders (ชำระแล้ว)"
              value={String(data.metrics.orderCount)}
              sub={isDashboardEmpty ? "ออเดอร์ที่ชำระแล้วจะปรากฏในกราฟและตาราง" : undefined}
              icon={Users}
              accentClass="bg-emerald-700"
            />
            <MetricCard
              title="Conversion"
              value={`${data.metrics.conversionRate.toFixed(1)}%`}
              sub={`ใบเสนอราคา ${data.metrics.quotationsConverted}/${data.metrics.quotationsTotal}`}
              icon={Percent}
              accentClass="bg-[#003366]"
            />
          </div>

          {isDashboardEmpty && (
            <Card className="overflow-hidden border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 via-white to-[#003366]/[0.06] shadow-sm">
              <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center sm:py-12">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                    <Leaf className="h-7 w-7" />
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <div className="rounded-2xl bg-[#003366]/10 p-3 text-[#003366]">
                    <TrendingUp className="h-7 w-7" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-zinc-900">เริ่มต้นการเดินทางยอดขาย</p>
                  <p className="mx-auto max-w-md text-sm text-zinc-600">
                    สร้างใบเสนอราคาแรก หรือบันทึกออเดอร์จาก POS — แดชบอร์ดจะเติมกราฟและสถิติให้อัตโนมัติ
                  </p>
                </div>
                <Button
                  asChild
                  size="lg"
                  className="gap-2 rounded-xl bg-emerald-700 px-8 text-white shadow-md hover:bg-emerald-800"
                >
                  <Link href="/admin/quotations/new">
                    <FilePlus className="h-5 w-5 shrink-0" />
                    สร้างใบเสนอราคาแรก
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="border-zinc-200/80 lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-800">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                  แนวโน้มรายได้ / ค่าส่ง / ส่วนลด
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[320px] pt-0">
                {isDashboardEmpty ? (
                  <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 text-center">
                    <BarChart3 className="mb-3 h-10 w-10 text-zinc-300" aria-hidden />
                    <p className="text-sm font-medium text-zinc-600">รอรับออเดอร์แรกของคุณอยู่...</p>
                    <p className="mt-1 max-w-xs text-xs text-zinc-400">กราฟรายวันจะแสดงเมื่อมีออเดอร์ที่ชำระแล้วในช่วงเวลานี้</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.dailyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#71717a" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#71717a" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                      <Tooltip
                        formatter={(v: number | string) => formatPrice(Number(v))}
                        labelStyle={{ color: "#27272a" }}
                      />
                      <Legend />
                      <Bar dataKey="revenue" name="รายได้" fill={EMERALD} radius={[2, 2, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="shipping" name="ค่าจัดส่ง" fill={NAVY} radius={[2, 2, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="discount" name="ส่วนลด" fill={AMBER} radius={[2, 2, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-800">
                  <PieChartIcon className="h-4 w-4 text-[#003366]" />
                  Top 5 สายพันธุ์ (จำนวนหน่วย)
                </CardTitle>
              </CardHeader>
              <CardContent className="min-h-[320px]">
                {isDashboardEmpty || pieData.length === 0 ? (
                  <div className="flex h-[300px] flex-col items-center justify-center gap-4 px-4 text-center sm:h-[280px]">
                    <div
                      className="flex h-36 w-36 items-center justify-center rounded-full border-2 border-dashed border-zinc-200 bg-zinc-100/90"
                      aria-hidden
                    >
                      <PackageOpen className="h-14 w-14 text-zinc-400" />
                    </div>
                    <p className="max-w-[220px] text-sm font-medium leading-relaxed text-zinc-600">
                      ยังไม่มีข้อมูลการขายในล่วงเวลานี้
                    </p>
                  </div>
                ) : (
                  <div className="flex h-[300px] flex-col gap-4 sm:h-[280px] sm:flex-row sm:items-center">
                    <div className="h-[200px] min-h-[180px] w-full flex-1 sm:h-full sm:min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="legendLabel"
                            cx="50%"
                            cy="50%"
                            innerRadius={46}
                            outerRadius={82}
                            paddingAngle={2}
                            label={({ percent }) =>
                              typeof percent === "number" && percent > 0.08
                                ? `${Math.round(percent * 100)}%`
                                : ""
                            }
                            labelLine={false}
                          >
                            {pieData.map((entry, i) => (
                              <Cell key={`${entry.legendLabel}-${i}`} fill={entry.color} stroke="#fff" strokeWidth={1.5} />
                            ))}
                          </Pie>
                          <Tooltip content={<StrainPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="max-h-[200px] w-full shrink-0 space-y-2 overflow-y-auto text-xs sm:max-h-none sm:w-[min(100%,240px)] sm:border-l sm:border-zinc-100 sm:pl-3">
                      {pieData.map((d, li) => (
                        <li key={`${d.legendLabel}-${li}`} className="flex gap-2">
                          <span
                            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm ring-1 ring-white"
                            style={{ backgroundColor: d.color }}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1 leading-snug">
                            <p className="break-words font-medium text-zinc-800">{d.legendLabel}</p>
                            <p className="text-zinc-500">
                              {d.value.toLocaleString("th-TH")} หน่วย
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-zinc-200/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-zinc-800">ออเดอร์ล่าสุด</CardTitle>
              </CardHeader>
              <CardContent>
                {isDashboardEmpty || data.recentOrders.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-emerald-200/60 bg-emerald-50/30 px-6 py-10 text-center">
                    <PackageOpen className="h-10 w-10 text-emerald-600/70" aria-hidden />
                    <p className="max-w-sm text-sm font-medium leading-relaxed text-zinc-700">
                      ยังไม่มีประวัติการสั่งซื้อ เริ่มต้นสร้างความประทับใจให้ลูกค้าคนแรกของคุณเลย!
                    </p>
                    {isDashboardEmpty && (
                      <Button
                        asChild
                        variant="outline"
                        className="mt-1 border-[#003366]/30 text-[#003366] hover:bg-[#003366]/5"
                      >
                        <Link href="/admin/quotations/new" className="gap-2">
                          <FilePlus className="h-4 w-4" />
                          สร้างใบเสนอราคาแรก
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 text-left text-zinc-500">
                          <th className="pb-2 pr-2 font-medium">เลขที่</th>
                          <th className="pb-2 pr-2 font-medium">สถานะ</th>
                          <th className="pb-2 pr-2 font-medium text-right">ยอด</th>
                          <th className="pb-2 font-medium text-right">วันที่</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentOrders.map((o) => (
                          <tr key={o.orderNumber} className="border-b border-zinc-100">
                            <td className="py-2.5 font-mono text-zinc-800">{o.orderNumber}</td>
                            <td className="py-2.5">
                              <Badge
                                className={cn(
                                  "text-xs font-normal",
                                  statusBadgeCls(o.status, (o as { payment_status?: string }).payment_status)
                                )}
                              >
                                {o.status}
                              </Badge>
                            </td>
                            <td className="py-2.5 text-right font-medium text-emerald-700">{formatPrice(o.totalAmount)}</td>
                            <td className="py-2.5 text-right text-zinc-500">
                              {o.createdAt ? o.createdAt.slice(0, 10) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-zinc-800">Top Spenders</CardTitle>
              </CardHeader>
              <CardContent>
                {isDashboardEmpty || data.topSpenders.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-10 text-center">
                    <Users className="h-10 w-10 text-[#003366]/50" aria-hidden />
                    <p className="max-w-sm text-sm leading-relaxed text-zinc-600">
                      ยังไม่มีลูกค้าในช่วงนี้ — เมื่อมีออเดอร์ที่ชำระแล้ว รายชื่อผู้มียอดสูงจะแสดงที่นี่
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {data.topSpenders.map((c, i) => (
                      <li
                        key={`${c.name}-${i}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-zinc-800">{c.name}</p>
                          <p className="text-xs text-zinc-500">{c.orders} ออเดอร์</p>
                        </div>
                        <span className="shrink-0 font-semibold text-[#003366]">{formatPrice(c.spent)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      <LowStockWidget />
    </div>
  );
}
