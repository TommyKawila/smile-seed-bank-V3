"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Activity, DollarSign, Loader2, ShieldAlert, Sparkles, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useGrowerToolsUsage } from "@/hooks/useGrowerToolsUsage";

const DynamicChart = dynamic(
  () =>
    import("@/components/admin/grower-tools/GrowerToolsUsageChart").then((m) => ({
      default: m.GrowerToolsUsageChart,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] animate-pulse rounded-md bg-zinc-100" aria-hidden />
    ),
  }
);

function MetricCard({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="border-zinc-200/80 shadow-sm">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-zinc-500">{title}</p>
          <p className="text-lg font-semibold text-zinc-900">{value}</p>
          {sub ? <p className="text-[11px] text-zinc-400">{sub}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

const ACTION_LABELS: Record<string, string> = {
  "soil-mixer": "Soil Mixer",
  fertilizer: "Fertilizer",
  "plant-doctor": "Plant Doctor",
};

export default function GrowerToolsUsagePage() {
  const [range, setRange] = useState<"7" | "30" | "month">("30");
  const { data, loading, error } = useGrowerToolsUsage(range);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900">
            <Sparkles className="h-6 w-6 text-emerald-700" />
            Grower Tools — Usage & Cost
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            สถิติการเรียก AI · tokens · ประมาณการ USD
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={(v) => setRange(v as "7" | "30" | "month")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 วัน</SelectItem>
              <SelectItem value="30">30 วัน</SelectItem>
              <SelectItem value="month">เดือนนี้</SelectItem>
            </SelectContent>
          </Select>
          <Link
            href="/admin/settings/grower-tools"
            className="text-sm text-emerald-700 hover:underline"
          >
            ตั้งค่างบ / เปิด AI
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : data ? (
        <>
          {data.budget.trippedAt ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              งบ API เกินเพดาน — AI ถูกปิดอัตโนมัติเมื่อ{" "}
              {new Date(data.budget.trippedAt).toLocaleString("th-TH")}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Calls"
              value={String(data.totals.calls)}
              sub={`OK ${data.totals.okCalls}`}
              icon={Activity}
            />
            <MetricCard
              title="Tokens"
              value={data.totals.tokens.toLocaleString()}
              icon={Zap}
            />
            <MetricCard
              title="Est. USD"
              value={`$${data.totals.estimatedUsd.toFixed(4)}`}
              sub={`วันนี้ $${data.budget.dailySpend.toFixed(4)} / $${data.budget.dailyUsd}`}
              icon={DollarSign}
            />
            <MetricCard
              title="429 / Blocked"
              value={String(data.totals.rateLimited + data.totals.budgetBlocked)}
              sub={`429: ${data.totals.rateLimited} · budget: ${data.totals.budgetBlocked}`}
              icon={ShieldAlert}
            />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Calls & cost by day</CardTitle>
            </CardHeader>
            <CardContent>
              <DynamicChart data={data.byDay} />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">By tool</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead className="text-right">Calls</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-right">USD</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.byAction.map((row) => (
                      <TableRow key={row.action}>
                        <TableCell>{ACTION_LABELS[row.action] ?? row.action}</TableCell>
                        <TableCell className="text-right">{row.calls}</TableCell>
                        <TableCell className="text-right">
                          {row.tokens.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">${row.usd.toFixed(4)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent calls</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[320px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Tool</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">USD</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recent.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-xs">
                          {new Date(row.createdAt).toLocaleString("th-TH", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-xs">
                          {ACTION_LABELS[row.action] ?? row.action}
                        </TableCell>
                        <TableCell className="text-xs">{row.status}</TableCell>
                        <TableCell className="text-right text-xs">
                          ${row.usd.toFixed(4)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
