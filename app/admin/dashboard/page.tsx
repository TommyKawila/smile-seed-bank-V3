"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Loader2,
  TrendingUp,
  ShoppingBag,
  UserPlus,
  Search,
  BarChart3,
  ChevronRight,
  LineChart,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const LOOKER_STUDIO_EMBED_SRC =
  "https://datastudio.google.com/embed/reporting/ff254623-e183-4f49-a0a5-af491cd2deda/page/DFZwF";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice, cn } from "@/lib/utils";
import { FinancialScorecards } from "@/components/admin/dashboard/FinancialScorecards";
import { RevenueProfitChart } from "@/components/admin/dashboard/RevenueProfitChart";

type OverviewPayload = {
  range: { preset: string; start: string; end: string };
  totalSalesThb: number;
  totalOrders: number;
  newCustomers: number;
  orderVolumeByDay: { date: string; orders: number }[];
  userTypePie: { name: string; value: number; fill: string }[];
  topSearches: { term: string; count: number }[];
};

type FinancialStatsPayload = {
  range: { preset: "7d" | "30d"; start: string; end: string };
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  netProfit: number;
  totalOrders: number;
  totalInventoryValue: number;
  series: { date: string; revenue: number; profit: number }[];
};

function MetricCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <Card className="border-zinc-200/80 shadow-sm">
      <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500 sm:text-sm">{title}</p>
          <p className="mt-1 break-words text-xl font-bold tabular-nums tracking-tight text-zinc-900 sm:text-2xl">
            {value}
          </p>
        </div>
        <div className={cn("shrink-0 rounded-xl p-2.5 text-white", accent)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState<"7d" | "30d">("30d");
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [financialData, setFinancialData] = useState<FinancialStatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const overviewRange = range === "7d" ? "7" : "30";
      const [overviewRes, statsRes] = await Promise.all([
        fetch(`/api/admin/dashboard/overview?range=${overviewRange}`, { cache: "no-store" }),
        fetch(`/api/admin/dashboard/stats?range=${range}`, { cache: "no-store" }),
      ]);
      const overviewJson = await overviewRes.json();
      const statsJson = await statsRes.json();
      if (!overviewRes.ok) throw new Error(overviewJson.error ?? "โหลดไม่สำเร็จ");
      if (!statsRes.ok) throw new Error(statsJson.error ?? "โหลดข้อมูลการเงินไม่สำเร็จ");
      setData(overviewJson as OverviewPayload);
      setFinancialData(statsJson as FinancialStatsPayload);
    } catch (e) {
      setError(String(e));
      setData(null);
      setFinancialData(null);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartOrders = data?.orderVolumeByDay ?? [];
  const tickDate = (d: string) => d.slice(5);

  return (
    <div className="space-y-5 p-1 pb-10 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-zinc-900 sm:text-xl">Dashboard</h1>
          <p className="text-xs text-zinc-500 sm:text-sm">Sales · orders · customers · search</p>
          <Link
            href="/admin/analytics"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline sm:text-sm"
          >
            <BarChart3 className="h-3.5 w-3.5 shrink-0" />
            Executive analytics (revenue, strains, export)
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
          <SelectTrigger className="w-full border-zinc-200 sm:w-[200px]">
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 days</SelectItem>
            <SelectItem value="30d">30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : data && financialData ? (
        <>
          <FinancialScorecards stats={financialData} />
          <RevenueProfitChart data={financialData.series} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <MetricCard
              title="Total sales (THB)"
              value={formatPrice(data.totalSalesThb)}
              icon={TrendingUp}
              accent="bg-emerald-600"
            />
            <MetricCard
              title="Total orders"
              value={String(data.totalOrders)}
              icon={ShoppingBag}
              accent="bg-[#003366]"
            />
            <MetricCard
              title="New customers"
              value={String(data.newCustomers)}
              icon={UserPlus}
              accent="bg-amber-600"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card className="border-zinc-200/80 lg:col-span-3">
              <CardHeader className="pb-1 pt-4 sm:pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-800 sm:text-base">
                  Order volume by day
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[240px] px-2 pb-4 sm:h-[280px] sm:px-4">
                {chartOrders.every((d) => d.orders === 0) ? (
                  <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/80 text-sm text-zinc-500">
                    No orders in this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartOrders} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        tickFormatter={tickDate}
                        stroke="#71717a"
                        interval="preserveStartEnd"
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="#71717a" width={36} />
                      <Tooltip
                        labelFormatter={(l) => String(l)}
                        formatter={(v: number | string | undefined) => [`${Number(v ?? 0)} orders`, "Volume"]}
                      />
                      <Bar dataKey="orders" name="Orders" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80 lg:col-span-2">
              <CardHeader className="pb-1 pt-4 sm:pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-800 sm:text-base">
                  User type (paid orders)
                </CardTitle>
                <p className="text-[11px] leading-snug text-zinc-500">
                  Guest checkout vs LINE vs Google-linked accounts
                </p>
              </CardHeader>
              <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-3 px-2 pb-4 sm:min-h-[280px]">
                {data.userTypePie.length === 0 ? (
                  <p className="text-sm text-zinc-500">No paid orders in range</p>
                ) : (
                  <div className="h-[200px] w-full max-w-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.userTypePie}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={44}
                          outerRadius={72}
                          paddingAngle={2}
                        >
                          {data.userTypePie.map((entry, i) => (
                            <Cell key={`${entry.name}-${i}`} fill={entry.fill} stroke="#fff" strokeWidth={1} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number | string | undefined) => [`${Number(v ?? 0)} orders`, ""]} />
                        <Legend
                          wrapperStyle={{ fontSize: 12 }}
                          formatter={(value) => <span className="text-zinc-700">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-zinc-200/80">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-800 sm:text-base">
                <Search className="h-4 w-4 text-primary" />
                Top search terms
              </CardTitle>
              <p className="text-[11px] text-zinc-500">From search_logs in this date range</p>
            </CardHeader>
            <CardContent>
              {data.topSearches.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-500">
                  No searches logged yet — data appears after shoppers use the store search.
                </p>
              ) : (
                <ol className="divide-y divide-zinc-100">
                  {data.topSearches.map((row, i) => (
                    <li
                      key={`${row.term}-${i}`}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
                          {i + 1}
                        </span>
                        <span className="truncate font-medium text-zinc-900">{row.term}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-sm text-zinc-500">
                        {row.count.toLocaleString("th-TH")}×
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card className="border-zinc-200/80 shadow-sm">
        <CardHeader className="pb-2 pt-4 sm:pt-6">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-800 sm:text-base">
            <LineChart className="h-4 w-4 text-primary" aria-hidden />
            Website traffic & keywords
          </CardTitle>
          <CardDescription className="text-[11px] text-zinc-500 sm:text-xs">
            Looker Studio — live report (may require Google sign-in for your workspace).
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0 sm:px-6 sm:pb-6">
          <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-zinc-50/50 shadow-inner">
            <iframe
              title="Looker Studio — Website traffic and keywords"
              src={LOOKER_STUDIO_EMBED_SRC}
              className="block h-[min(80vh,800px)] w-full min-h-[400px] rounded-xl border-0 bg-white"
              loading="lazy"
              allowFullScreen
              sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
