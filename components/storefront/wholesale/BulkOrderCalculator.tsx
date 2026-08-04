"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WholesaleCatalogStrain } from "@/lib/wholesale-public-pricing";
import {
  formatThb,
  qtyNeedsNudge,
  resolveQuote,
  thbToEurDisplay,
  type BulkPricingConfig,
  type BulkQuoteLineInput,
  type CoaMode,
} from "@/lib/wholesale-bulk-pricing";
import { CoaAddonSection } from "./CoaAddonSection";
import { CoaOptionCards } from "./CoaOptionCards";
import { BulkOrderSummary } from "./BulkOrderSummary";

export type BulkOrderState = {
  lines: BulkQuoteLineInput[];
  coaMode: CoaMode;
  buyExtra: boolean;
  packageACount: number;
  packageBCount: number;
};

type Props = {
  catalog: WholesaleCatalogStrain[];
  config: BulkPricingConfig;
  currency: "THB" | "EUR";
  onStateChange?: (state: BulkOrderState) => void;
  onRequestQuote: (state: BulkOrderState) => void;
};

function money(thb: number, currency: "THB" | "EUR", fx: number): string {
  if (currency === "EUR") {
    return `€${thbToEurDisplay(thb, fx).toLocaleString("en-US")}`;
  }
  return formatThb(thb);
}

export function BulkOrderCalculator({
  catalog,
  config,
  currency,
  onStateChange,
  onRequestQuote,
}: Props) {
  const [lines, setLines] = useState<BulkQuoteLineInput[]>(() =>
    catalog.slice(0, 1).map((s) => ({
      strainId: s.id,
      name: s.name,
      quantity: 500,
    }))
  );
  const [coaMode, setCoaMode] = useState<CoaMode>("none");
  const [buyExtra, setBuyExtra] = useState(false);
  const [packageACount, setPackageACount] = useState(0);
  const [packageBCount, setPackageBCount] = useState(0);

  const emit = (next: BulkOrderState) => {
    onStateChange?.(next);
  };

  const setLinesAndEmit = (next: BulkQuoteLineInput[]) => {
    setLines(next);
    emit({
      lines: next,
      coaMode,
      buyExtra,
      packageACount,
      packageBCount,
    });
  };

  const quote = useMemo(
    () =>
      resolveQuote(lines, config, {
        mode: coaMode,
        buyExtra,
        packageACount,
        packageBCount,
      }),
    [lines, config, coaMode, buyExtra, packageACount, packageBCount]
  );

  const unused = catalog.filter(
    (c) => !lines.some((l) => l.strainId === c.id)
  );

  const addLine = () => {
    const nextStrain = unused[0] ?? catalog[0];
    if (!nextStrain) return;
    setLinesAndEmit([
      ...lines,
      { strainId: nextStrain.id, name: nextStrain.name, quantity: 500 },
    ]);
  };

  const updateLine = (idx: number, patch: Partial<BulkQuoteLineInput>) => {
    const next = lines.map((l, i) => (i === idx ? { ...l, ...patch } : l));
    setLinesAndEmit(next);
  };

  const removeLine = (idx: number) => {
    setLinesAndEmit(lines.filter((_, i) => i !== idx));
  };

  const state: BulkOrderState = {
    lines,
    coaMode,
    buyExtra,
    packageACount,
    packageBCount,
  };

  return (
    <section id="rfq" className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          B2B Bulk Order Calculator
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          ขั้นต่ำ 500 เมล็ด/สาย หรือแพ็คเกจ Smile Seed Bank 100 เมล็ด · ราคาเป็นจำนวนเต็ม
          THB
        </p>
      </div>

      <div className="space-y-4">
        {lines.map((line, idx) => {
          const resolved = quote.lines[idx];
          const nudge = qtyNeedsNudge(line.quantity, config);
          return (
            <div
              key={`${line.strainId}-${idx}`}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    สายพันธุ์
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                    value={line.strainId}
                    onChange={(e) => {
                      const s = catalog.find((c) => c.id === e.target.value);
                      if (s) {
                        updateLine(idx, { strainId: s.id, name: s.name });
                      }
                    }}
                  >
                    {catalog.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.typeLabel})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    จำนวนเมล็ด
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={line.quantity || ""}
                    onChange={(e) =>
                      updateLine(idx, {
                        quantity: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                      })
                    }
                    className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="min-h-12 min-w-12"
                  onClick={() => removeLine(idx)}
                  aria-label="Remove strain"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>

              {nudge && (
                <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                  <p>
                    ขั้นต่ำสำหรับเรทราคาส่ง B2B คือ 500 เมล็ดต่อสายพันธุ์ หรือเลือกสั่งซื้อ
                    &apos;แพ็คเกจ Smile Seed Bank (100 เมล็ด)&apos;
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-amber-400 bg-white text-slate-900 hover:bg-amber-50"
                    onClick={() =>
                      updateLine(idx, { quantity: config.microPackQty })
                    }
                  >
                    เปลี่ยนเป็นแพ็คเกจ Smile Seed Bank (100 เมล็ด)
                  </Button>
                </div>
              )}

              {resolved?.valid && (
                <p className="mt-2 text-sm text-slate-600">
                  {resolved.isMicroPack ? "SSB Branded Pack · " : ""}
                  {money(resolved.unitThb, currency, config.eurThb)}/seed · Line{" "}
                  {money(resolved.lineTotalThb, currency, config.eurThb)}
                </p>
              )}
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          onClick={addLine}
          disabled={!catalog.length}
          className="border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
        >
          <Plus className="mr-1 h-4 w-4" />
          เพิ่มสายพันธุ์
        </Button>
      </div>

      {quote.upsell && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          {quote.upsell}
        </div>
      )}

      {quote.freeCoaMessage && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          {quote.freeCoaMessage}
        </div>
      )}

      <CoaOptionCards
        mode={coaMode}
        onChange={(mode) => {
          setCoaMode(mode);
          emit({ ...state, coaMode: mode });
        }}
      />

      {coaMode === "with" && (
        <CoaAddonSection
          config={config}
          buyExtra={buyExtra}
          packageACount={packageACount}
          packageBCount={packageBCount}
          onBuyExtraChange={(v) => {
            setBuyExtra(v);
            emit({ ...state, buyExtra: v });
          }}
          onPackageAChange={(n) => {
            setPackageACount(n);
            emit({ ...state, packageACount: n });
          }}
          onPackageBChange={(n) => {
            setPackageBCount(n);
            emit({ ...state, packageBCount: n });
          }}
        />
      )}

      <BulkOrderSummary quote={quote} coaMode={coaMode} />

      <Button
        type="button"
        className="min-h-12 w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto"
        disabled={!quote.allValid || !quote.lines.length}
        onClick={() => onRequestQuote(state)}
      >
        ขอใบเสนอราคา (RFQ)
      </Button>
    </section>
  );
}
