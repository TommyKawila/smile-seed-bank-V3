"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import { GF_PILOT_PACK_DESC_EN, GF_PILOT_PACK_DESC_TH } from "@/lib/green-future-approved-marketing";
import {
  GF_PILOT_DEFAULT_QTY,
  GF_PILOT_POUCHES_PER_STRAIN,
  GF_PILOT_POUCH_QTY,
  gfPilotPouchCount,
} from "@/lib/green-future-pilot-config";
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
  pilotMode?: boolean;
  onStateChange?: (state: BulkOrderState) => void;
  onRequestQuote: (state: BulkOrderState) => void;
};

function money(thb: number, currency: "THB" | "EUR", fx: number): string {
  if (currency === "EUR") {
    return `€${thbToEurDisplay(thb, fx).toLocaleString("en-US")}`;
  }
  return formatThb(thb);
}

function pilotPouchesFromQty(qty: number): number {
  const p = Math.floor(qty / GF_PILOT_POUCH_QTY);
  if (p < 1) return 1;
  if (p > GF_PILOT_POUCHES_PER_STRAIN) return GF_PILOT_POUCHES_PER_STRAIN;
  return p;
}

type PilotPouchStepperProps = {
  pouches: number;
  onChange: (pouches: number) => void;
  t: (th: string, en: string) => string;
};

const pouchStepBtnClass =
  "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300 disabled:opacity-100";

function PilotPouchStepper({ pouches, onChange, t }: PilotPouchStepperProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-500">
        {t("จำนวนซอง", "Pouches")}
      </label>
      <div className="flex min-h-12 items-center gap-2">
        <button
          type="button"
          className={pouchStepBtnClass}
          disabled={pouches <= 1}
          onClick={() => onChange(pouches - 1)}
          aria-label={t("ลดจำนวนซอง", "Decrease pouches")}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span
          className="min-w-[3rem] text-center text-lg font-semibold tabular-nums text-slate-900"
          aria-live="polite"
        >
          {pouches}
        </span>
        <button
          type="button"
          className={pouchStepBtnClass}
          disabled={pouches >= GF_PILOT_POUCHES_PER_STRAIN}
          onClick={() => onChange(pouches + 1)}
          aria-label={t("เพิ่มจำนวนซอง", "Increase pouches")}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <p className="text-xs leading-snug text-slate-500">
        {t(
          `ซองละ ${GF_PILOT_POUCH_QTY} เมล็ด · บรรจุแพ็กจากโรงงานผู้ผลิต (มาตรฐาน GACP) · สูงสุด ${GF_PILOT_POUCHES_PER_STRAIN} ซอง/สาย`,
          `${GF_PILOT_POUCH_QTY} seeds per sealed pouch · factory-packed at the GACP production site · max ${GF_PILOT_POUCHES_PER_STRAIN} pouches/strain`
        )}
      </p>
    </div>
  );
}

export function BulkOrderCalculator({
  catalog,
  config,
  currency,
  pilotMode = true,
  onStateChange,
  onRequestQuote,
}: Props) {
  const { t } = useLanguage();
  const defaultQty = pilotMode ? GF_PILOT_DEFAULT_QTY : 500;
  const [lines, setLines] = useState<BulkQuoteLineInput[]>(() =>
    catalog.slice(0, 1).map((s) => ({
      strainId: s.id,
      name: s.name,
      quantity: defaultQty,
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
        pilotMode,
      }),
    [lines, config, coaMode, buyExtra, packageACount, packageBCount, pilotMode]
  );

  const unused = catalog.filter(
    (c) => !lines.some((l) => l.strainId === c.id)
  );

  const addLine = () => {
    const nextStrain = unused[0] ?? catalog[0];
    if (!nextStrain) return;
    setLinesAndEmit([
      ...lines,
      { strainId: nextStrain.id, name: nextStrain.name, quantity: defaultQty },
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

  const upsellText =
    !pilotMode && quote.upsell
      ? t(
          `💡 เพิ่มอีก ${quote.upsell.needSeeds.toLocaleString("en-US")} เมล็ด เพื่อปลดล็อกเรทประมาณการ ${quote.upsell.nextThbPerSeed.toLocaleString("en-US")} บาท/เมล็ด${
            quote.upsell.nextFreeCoaCount > 0
              ? ` และสิทธิ์ COA ฟรีโดยประมาณ ${quote.upsell.nextFreeCoaCount} ใบ`
              : ""
          } (ขึ้นกับใบเสนอราคา)`,
          `💡 Add ${quote.upsell.needSeeds.toLocaleString("en-US")} more seeds to unlock estimated ${quote.upsell.nextThbPerSeed.toLocaleString("en-US")} THB/seed${
            quote.upsell.nextFreeCoaCount > 0
              ? ` and ~${quote.upsell.nextFreeCoaCount} free COA(s)`
              : ""
          } (subject to quotation)`
        )
      : null;

  const freeCoaText =
    !pilotMode && quote.freeCoaCount > 0
      ? t(
          `สิทธิ์ COA ฟรีโดยประมาณ ${quote.freeCoaCount} สายพันธุ์ (ประมาณ ${quote.freeCoaValueThb.toLocaleString("en-US")} บาท) — ขึ้นกับใบเสนอราคา สต็อกล็อต และค่าแล็บปัจจุบัน`,
          `Estimated eligibility for ${quote.freeCoaCount} free COA strain(s) (~${quote.freeCoaValueThb.toLocaleString("en-US")} THB) — subject to quotation, lot availability and current lab charges`
        )
      : null;

  return (
    <section id="rfq" className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          {t(
            "เครื่องประมาณการขอราคา B2B",
            "B2B quotation estimate calculator"
          )}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {pilotMode
            ? t(GF_PILOT_PACK_DESC_TH, GF_PILOT_PACK_DESC_EN)
            : t(
                "ขั้นต่ำ 500 เมล็ด/สาย หรือแพ็ค 100 เมล็ด (ผู้ผลิตบรรจุและซีล) · ราคาเป็นการประมาณการ",
                "Min. 500 seeds/strain or 100-seed pack (producer-packed & sealed) · indicative pricing"
              )}
        </p>
      </div>

      <div className="space-y-4">
        {lines.map((line, idx) => {
          const resolved = quote.lines[idx];
          const nudge = !pilotMode && qtyNeedsNudge(line.quantity, config, pilotMode);
          const pouches = pilotMode
            ? pilotPouchesFromQty(line.quantity)
            : gfPilotPouchCount(line.quantity);
          return (
            <div
              key={`${line.strainId}-${idx}`}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    {t("สายพันธุ์", "Strain")}
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
                  {pilotMode ? (
                    <PilotPouchStepper
                      pouches={pouches}
                      t={t}
                      onChange={(nextPouches) =>
                        updateLine(idx, {
                          quantity: nextPouches * GF_PILOT_POUCH_QTY,
                        })
                      }
                    />
                  ) : (
                    <>
                      <label className="text-xs font-medium text-slate-500">
                        {t("จำนวนเมล็ด", "Seed quantity")}
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={line.quantity || ""}
                        onChange={(e) =>
                          updateLine(idx, {
                            quantity: Math.max(
                              0,
                              Math.floor(Number(e.target.value) || 0)
                            ),
                          })
                        }
                        className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                      />
                    </>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="min-h-12 min-w-12"
                  onClick={() => removeLine(idx)}
                  aria-label={t("ลบสายพันธุ์", "Remove strain")}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>

              {nudge && (
                <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                  <p>
                    {pilotMode
                      ? t(
                          `จำนวนต้องเป็นทวีคูณของ ${GF_PILOT_POUCH_QTY} เมล็ด สูงสุด ${GF_PILOT_DEFAULT_QTY} เมล็ดต่อสาย (ซองซีล ${GF_PILOT_POUCH_QTY} เมล็ด)`,
                          `Quantity must be a multiple of ${GF_PILOT_POUCH_QTY} seeds, up to ${GF_PILOT_DEFAULT_QTY} per strain (sealed ${GF_PILOT_POUCH_QTY}-seed pouches)`
                        )
                      : t(
                          "ขั้นต่ำสำหรับเรทราคาส่ง B2B คือ 500 เมล็ดต่อสายพันธุ์ หรือเลือกแพ็ค 100 เมล็ด (ผู้ผลิตบรรจุและซีล)",
                          "B2B wholesale rate requires 500 seeds per strain, or a 100-seed pack (producer-packed & sealed)"
                        )}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-amber-400 bg-white text-slate-900 hover:bg-amber-50"
                    onClick={() =>
                      updateLine(idx, {
                        quantity: pilotMode
                          ? GF_PILOT_DEFAULT_QTY
                          : config.microPackQty,
                      })
                    }
                  >
                    {pilotMode
                      ? t(
                          `ตั้งเป็น ${GF_PILOT_DEFAULT_QTY} เมล็ด (4 ซอง)`,
                          `Set to ${GF_PILOT_DEFAULT_QTY} seeds (4 pouches)`
                        )
                      : t(
                          "เปลี่ยนเป็นแพ็ค 100 เมล็ด (ผู้ผลิตบรรจุ)",
                          "Switch to 100-seed pack (producer-packed)"
                        )}
                  </Button>
                </div>
              )}

              {resolved?.valid && (
                <p className="mt-2 text-sm text-slate-600">
                  {pilotMode && pouches > 0
                    ? t(
                        `${pouches * GF_PILOT_POUCH_QTY} เมล็ด (${pouches} ซอง) · ราคารวมสายนี้ `,
                        `${pouches * GF_PILOT_POUCH_QTY} seeds (${pouches} pouches) · Line `
                      )
                    : resolved.isMicroPack
                      ? t("แพ็คผู้ผลิตบรรจุ · ราคารวมสายนี้ ", "Producer-packed · Line ")
                      : t("ราคารวมสายนี้ ", "Line ")}
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
          {t("เพิ่มสายพันธุ์", "Add strain")}
        </Button>
      </div>

      {upsellText && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          {upsellText}
        </div>
      )}

      {freeCoaText && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          {freeCoaText}
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

      <BulkOrderSummary
        quote={quote}
        coaMode={coaMode}
        currency={currency}
        fx={config.eurThb}
        pilotMode={pilotMode}
      />

      <Button
        type="button"
        className="min-h-12 w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto"
        disabled={!quote.allValid || !quote.lines.length}
        onClick={() => onRequestQuote(state)}
      >
        {t("ขอใบเสนอราคา (ไม่ผูกพัน)", "Request quotation (non-binding)")}
      </Button>
    </section>
  );
}
