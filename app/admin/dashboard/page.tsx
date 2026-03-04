"use client";

import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, BarChart2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RevenueBarChart } from "@/components/admin/charts/RevenueBarChart";
import { ChannelPieChart } from "@/components/admin/charts/ChannelPieChart";
import { LowStockWidget } from "@/components/admin/LowStockWidget";
import { useDashboard } from "@/hooks/useDashboard";
import { formatPrice } from "@/lib/utils";

// ─── Scorecard Component ──────────────────────────────────────────────────────

function Scorecard({
  title,
  value,
  sub,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">{value}</p>
            {sub && (
              <div className="mt-1 flex items-center gap-1">
                {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />}
                {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
                <span
                  className={
                    trend === "up"
                      ? "text-xs text-emerald-600"
                      : trend === "down"
                      ? "text-xs text-red-500"
                      : "text-xs text-zinc-400"
                  }
                >
                  {sub}
                </span>
              </div>
            )}
          </div>
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { summary, revenueSeries, channelBreakdown, inventory, isLoading, dateRange, setDateRange, period, setPeriod } =
    useDashboard();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Financial Dashboard</h1>
          <p className="text-sm text-zinc-500">ภาพรวมรายได้และกำไร</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.from ?? ""}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-sm text-zinc-400">–</span>
          <input
            type="date"
            value={dateRange.to ?? ""}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as "daily" | "monthly")}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="monthly">รายเดือน</option>
            <option value="daily">รายวัน</option>
          </select>
        </div>
      </div>

      {/* Scorecards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="h-16 animate-pulse rounded-lg bg-zinc-100" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Scorecard
            title="ยอดขายรวม"
            value={formatPrice(summary?.totalRevenue ?? 0)}
            sub={`${summary?.totalOrders ?? 0} ออเดอร์`}
            icon={DollarSign}
            trend="neutral"
          />
          <Scorecard
            title="กำไรสุทธิ"
            value={formatPrice(summary?.netProfit ?? 0)}
            sub={`Margin ${summary?.profitMarginPercent ?? 0}%`}
            icon={TrendingUp}
            trend={(summary?.netProfit ?? 0) >= 0 ? "up" : "down"}
          />
          <Scorecard
            title="มูลค่าสินค้าคงคลัง"
            value={formatPrice(inventory?.totalValue ?? 0)}
            sub={
              (inventory?.lowStockCount ?? 0) > 0
                ? `⚠️ ${inventory!.lowStockCount} รายการสต็อกต่ำ`
                : "สต็อกปกติ"
            }
            icon={Package}
            trend={
              (inventory?.lowStockCount ?? 0) > 0 ? "down" : "up"
            }
          />
          <Scorecard
            title="ต้นทุนรวม (COGS)"
            value={formatPrice(summary?.totalCOGS ?? 0)}
            sub="ต้นทุนสินค้าที่ขายไป"
            icon={ShoppingCart}
            trend="neutral"
          />
        </div>
      )}

      {/* Low Stock Alert */}
      {(inventory?.lowStockCount ?? 0) > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <span className="text-sm font-medium text-red-700">
            ⚠️ มีสินค้า {inventory!.lowStockCount} รายการที่สต็อกเหลือน้อย (≤ 5 ชิ้น)
          </span>
          <Badge variant="destructive" className="ml-auto text-xs">
            ต้องดำเนินการ
          </Badge>
        </div>
      )}

      <Separator />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Bar Chart - Revenue vs COGS */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart2 className="h-4 w-4 text-primary" />
              ยอดขาย vs ต้นทุน
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-72 animate-pulse rounded-lg bg-zinc-100" />
            ) : (
              <RevenueBarChart data={revenueSeries} />
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Channel Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">สัดส่วนช่องทางขาย</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-72 animate-pulse rounded-lg bg-zinc-100" />
            ) : (
              <ChannelPieChart data={channelBreakdown} />
            )}
          </CardContent>
        </Card>
        {/* Low Stock Widget - full width below on lg */}
        <div className="lg:col-span-5">
          <LowStockWidget />
        </div>
      </div>
    </div>
  );
}
