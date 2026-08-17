"use client";

import { useMemo, useState } from "react";
import { Copy, Loader2, Target } from "lucide-react";
import { useGreenFutureCatalog } from "@/hooks/useGreenFutureCatalog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEFAULT_LANDED_PCT } from "@/lib/wholesale-bulk-pricing";
import {
  GACP_DOCUMENT_MATRIX,
  GACP_RETAIL_PACKAGES,
  GF_EXTRA_WORK,
  GF_PO_CHECKLIST_EN,
  GF_RFQ_QUESTIONS_EN,
  buildAllInvestmentResults,
  buildExportTierCosts,
  formatCellFlag,
  resolveCoaCosts,
} from "@/lib/green-future-gacp-strategy";

function fmt(n: number, digits = 0): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

const EMPTY_FILTERS = {
  q: "",
  format: "ALL" as const,
  stock: "ALL" as const,
  ista: "ALL" as const,
};

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="group flex w-full items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100"
    >
      <Copy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-slate-600" />
      <span className="whitespace-pre-wrap leading-relaxed">{text}</span>
      {copied ? (
        <span className="ml-auto shrink-0 text-emerald-600">Copied</span>
      ) : null}
    </button>
  );
}

export function GreenFutureGacpStrategyClient() {
  const { loading, priceList, error } = useGreenFutureCatalog(EMPTY_FILTERS);
  const [landedPct, setLandedPct] = useState(DEFAULT_LANDED_PCT);

  const coaA = Number(priceList?.coaServices?.[0]?.thbPerStrain ?? 8327.36);
  const coaB = Number(priceList?.coaServices?.[1]?.thbPerStrain ?? 16654.72);
  const { deltaB } = resolveCoaCosts(coaA, coaB);

  const exportTiers = useMemo(
    () => buildExportTierCosts(coaA, coaB),
    [coaA, coaB]
  );

  const investments = useMemo(
    () => buildAllInvestmentResults(coaA, landedPct),
    [coaA, landedPct]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-8">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-emerald-700" />
            GACP retail strategy · 50 seeds/pack
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-slate-600">
          <p>
            TH: เปรียบเทียบแพ็ก Domestic vs Export · ต้นทุน GF · break-even ·
            checklist ส่ง RFQ — ใช้วางกลยุทธ์ภายใน ไม่เปลี่ยนราคาหน้าเว็บอัตโนมัติ
          </p>
          <p>
            EN: Internal GACP pack comparison, GF cost estimates, break-even
            scenarios, and RFQ checklists. Does not change public storefront prices.
          </p>
          <div className="flex flex-wrap items-end gap-4 pt-1">
            <div className="space-y-1">
              <Label htmlFor="gacp-landed">Landed %</Label>
              <Input
                id="gacp-landed"
                type="number"
                min={0}
                max={99}
                step={1}
                value={landedPct}
                onChange={(e) => setLandedPct(Number(e.target.value))}
                className="w-24"
              />
            </div>
            <p className="text-xs text-slate-500">
              COA A {fmt(coaA)} THB · COA B {fmt(coaB)} THB · Δ moisture{" "}
              {fmt(deltaB)} THB
              {priceList?.refCode ? ` · ${priceList.refCode}` : ""}
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Retail packages · แพ็กขายปลีก
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {GACP_RETAIL_PACKAGES.map((pkg) => (
            <Card key={pkg.code} className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{pkg.labelEn}</CardTitle>
                <p className="text-xs text-slate-500">{pkg.labelTh}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-semibold tabular-nums text-slate-900">
                  {fmt(pkg.retailThb)} <span className="text-sm font-normal">THB</span>
                </p>
                <p className="text-xs leading-relaxed text-slate-600">
                  {pkg.includesEn}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Export incremental cost · ต้นทุนเพิ่ม vs Domestic (per strain/lot)
        </h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Cost + (mid)</TableHead>
                <TableHead className="text-right">Pass-through sell (+20% GM)</TableHead>
                <TableHead className="text-right">Retail 50-pack</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exportTiers.map((row) => (
                <TableRow key={row.tier}>
                  <TableCell>
                    <div className="font-medium">{row.labelEn}</div>
                    <div className="text-xs text-slate-500">{row.labelTh}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.incrementalCostMidThb > 0
                      ? `+${fmt(row.incrementalCostMidThb)}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.incrementalSellThb > 0
                      ? `+${fmt(row.incrementalSellThb)}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {fmt(row.retailThb)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-amber-800">
          Export Standard/Full mid costs include GF estimates (phytosanitary, lab
          panels) — confirm with Green Future RFQ below.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Document matrix · ✓ included · ◐ recommended/optional · — not required
        </h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead className="text-center">Domestic</TableHead>
                <TableHead className="text-center">Export</TableHead>
                <TableHead>Party</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GACP_DOCUMENT_MATRIX.map((row) => {
                const d = formatCellFlag(row.domestic);
                const e = formatCellFlag(row.export);
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.labelEn}</div>
                      <div className="text-xs text-slate-500">{row.labelTh}</div>
                    </TableCell>
                    <TableCell
                      className={`text-center ${
                        d.tone === "yes"
                          ? "text-emerald-700"
                          : d.tone === "maybe"
                            ? "text-amber-700"
                            : "text-slate-400"
                      }`}
                    >
                      {d.symbol}
                    </TableCell>
                    <TableCell
                      className={`text-center ${
                        e.tone === "yes"
                          ? "text-emerald-700"
                          : e.tone === "maybe"
                            ? "text-amber-700"
                            : "text-slate-400"
                      }`}
                    >
                      {e.symbol}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{row.party}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Green Future extra work · Domestic vs Export
        </h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead className="text-center">Domestic</TableHead>
                <TableHead className="text-center">Export</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GF_EXTRA_WORK.map((row) => (
                <TableRow key={row.taskEn}>
                  <TableCell>
                    <div>{row.taskEn}</div>
                    <div className="text-xs text-slate-500">{row.taskTh}</div>
                  </TableCell>
                  <TableCell className="text-center text-emerald-700">
                    {row.domestic ? "✓" : "—"}
                  </TableCell>
                  <TableCell className="text-center text-emerald-700">
                    {row.export ? "✓" : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Investment & break-even · ลงทุน & คืนทุน
        </h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario</TableHead>
                <TableHead className="text-right">Invest</TableHead>
                <TableHead className="text-right">Advance 50%</TableHead>
                <TableHead className="text-right">Packs</TableHead>
                <TableHead className="text-right">BE @ 7,990</TableHead>
                <TableHead className="text-right">BE @ 9,490</TableHead>
                <TableHead className="text-right">Profit all @ 7,990</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.map((row) => (
                <TableRow key={row.code}>
                  <TableCell>
                    <div className="font-medium">{row.labelEn}</div>
                    <div className="text-xs text-slate-500">{row.labelTh}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmt(row.totalInvestThb)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-600">
                    {fmt(row.advance50Thb)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.packs}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.breakEvenDomestic}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.breakEvenExportLite}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-800">
                    {fmt(row.profitAllDomestic)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-slate-500">
          Recommended first batch: 500 seeds + 1 COA (~30k THB) · BE ~4 packs @
          7,990. Scale at 2,500 MOQ Package when validated.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">
            GF RFQ questions (copy to email)
          </h3>
          <ol className="space-y-2">
            {GF_RFQ_QUESTIONS_EN.map((q, i) => (
              <li key={q}>
                <CopyBlock text={`${i + 1}. ${q}`} />
              </li>
            ))}
          </ol>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">
            GF PO checklist (copy to order)
          </h3>
          <ol className="space-y-2">
            {GF_PO_CHECKLIST_EN.map((item, i) => (
              <li key={item}>
                <CopyBlock text={`${i + 1}. ${item}`} />
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
