"use client";

import { useMemo, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
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
import {
  B2B_GM_BY_TIER,
  DEFAULT_COA_GM_PCT,
  DEFAULT_LANDED_PCT,
  DEFAULT_RETAIL_GM_PCT,
  buildCoaResaleRow,
  buildSeedResaleRow,
} from "@/lib/green-future-resale-pricing";

function fmt(n: number, digits = 2): string {
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

export function GreenFutureResaleClient() {
  const { loading, priceList, error } = useGreenFutureCatalog(EMPTY_FILTERS);
  const [landedPct, setLandedPct] = useState(DEFAULT_LANDED_PCT);
  const [retailGm, setRetailGm] = useState(DEFAULT_RETAIL_GM_PCT);
  const [coaGm, setCoaGm] = useState(DEFAULT_COA_GM_PCT);
  const [gmOverride, setGmOverride] = useState("");

  const overrideNum = gmOverride.trim() === "" ? null : Number(gmOverride);

  const seedRows = useMemo(() => {
    if (!priceList) return [];
    return priceList.tiers.map((tier) =>
      buildSeedResaleRow({
        code: tier.code,
        label: tier.label,
        qtyDescription: tier.qtyDescription,
        costThb: Number(tier.thbPerSeed),
        landedPct,
        b2bGmOverride:
          overrideNum != null && Number.isFinite(overrideNum) ? overrideNum : null,
        retailGmPct: retailGm,
      })
    );
  }, [priceList, landedPct, overrideNum, retailGm]);

  const coaRows = useMemo(() => {
    if (!priceList) return [];
    return priceList.coaServices.map((svc) =>
      buildCoaResaleRow({
        code: svc.code,
        label: svc.label,
        costThb: Number(svc.thbPerStrain),
        gmPct: coaGm,
      })
    );
  }, [priceList, coaGm]);

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

  if (!priceList) {
    return (
      <p className="text-sm text-slate-500">No active Green Future price list.</p>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-amber-700" />
            Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed text-slate-600">
          <p>
            TH: ต้นทุนลงเรือ (landed) = ต้นทุน GF × (1 + landed %). ราคาขาย B2B =
            landed ÷ (1 − อัตรากำไรขั้นต้น). Markup บนต้นทุนเป็นตัวเลขสำรอง —
            อย่าสับสนกับ GM.
          </p>
          <p>
            EN: Landed cost = GF cost × (1 + landed %). B2B sell = landed / (1 −
            gross margin). Markup on cost is secondary. Does not change public
            wholesale prices.
          </p>
          <p className="text-xs text-amber-800">
            Internal only · {priceList.refCode ?? "—"} · {priceList.issuedAt ?? "—"}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs text-slate-600">Landed adder %</Label>
          <Input
            type="number"
            min={0}
            max={50}
            step={0.5}
            value={landedPct}
            onChange={(e) => setLandedPct(Number(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-600">
            Override all B2B GM % (blank = per-tier)
          </Label>
          <Input
            type="number"
            min={0}
            max={90}
            step={1}
            placeholder={Object.values(B2B_GM_BY_TIER)
              .slice(0, 3)
              .join(" / ")}
            value={gmOverride}
            onChange={(e) => setGmOverride(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-600">Retail GM %</Label>
          <Input
            type="number"
            min={0}
            max={90}
            step={1}
            value={retailGm}
            onChange={(e) => setRetailGm(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Landed</TableHead>
              <TableHead className="text-right">B2B sell</TableHead>
              <TableHead className="text-right">B2B GM</TableHead>
              <TableHead className="text-right">Markup</TableHead>
              <TableHead className="text-right">Retail sell</TableHead>
              <TableHead className="text-right">Live wholesale</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {seedRows.map((row) => (
              <TableRow key={row.code}>
                <TableCell>
                  <p className="text-sm font-medium">{row.label}</p>
                  <p className="text-[11px] text-slate-500">
                    {row.qtyDescription ?? row.code}
                  </p>
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {fmt(row.costThb)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {fmt(row.landedThb)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs font-semibold">
                  {fmt(row.b2bSellThb, 0)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {fmt(row.b2bGmPct, 0)}%
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {fmt(row.b2bMarkupPct, 0)}%
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {fmt(row.retailSellThb, 0)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-slate-500">
                  {row.currentWholesaleThb != null
                    ? fmt(row.currentWholesaleThb, 0)
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">
            COA add-on (pass-through + service GM)
          </h3>
          <div className="w-28 space-y-1">
            <Label className="text-xs text-slate-600">COA GM %</Label>
            <Input
              type="number"
              min={0}
              max={90}
              step={1}
              value={coaGm}
              onChange={(e) => setCoaGm(Number(e.target.value) || 0)}
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead className="text-right">Lab cost THB</TableHead>
                <TableHead className="text-right">Sell THB</TableHead>
                <TableHead className="text-right">GM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coaRows.map((row) => (
                <TableRow key={row.code}>
                  <TableCell className="text-sm">{row.label}</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {fmt(row.costThb, 0)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold">
                    {fmt(row.sellThb, 0)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {fmt(row.gmPct, 0)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
