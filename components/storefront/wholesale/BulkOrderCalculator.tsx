"use client";

import { useMemo, useState } from "react";
import { Download, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import {
  GF_PILOT_PACK_DESC_EN,
  GF_PILOT_PACK_DESC_TH,
  gfAcceptsPublicDeposits,
} from "@/lib/green-future-approved-marketing";
import {
  GF_PILOT_DEFAULT_QTY,
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
import { gfFulfillmentTier, wholesaleCatalogCsv, wholesaleCatalogShareText } from "@/lib/wholesale-fulfillment";
import { BulkOrderSummary } from "./BulkOrderSummary";
import { WholesaleStrainPicker } from "./WholesaleStrainPicker";

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
  return Math.max(1, gfPilotPouchCount(qty));
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
          onClick={() => onChange(pouches + 1)}
          aria-label={t("เพิ่มจำนวนซอง", "Increase pouches")}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <p className="text-xs leading-snug text-slate-500">
        {t(
          `ซองละ ${GF_PILOT_POUCH_QTY} เมล็ด · บรรจุแพ็กจากโรงงานผู้ผลิต`,
          `${GF_PILOT_POUCH_QTY} seeds per sealed pouch · factory-packed`
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
  const { t, locale } = useLanguage();
  const depositsOpen = gfAcceptsPublicDeposits();
  const defaultQty = depositsOpen
    ? GF_PILOT_POUCH_QTY
    : pilotMode
      ? GF_PILOT_DEFAULT_QTY
      : 500;
  const [lines, setLines] = useState<BulkQuoteLineInput[]>(() =>
    catalog.slice(0, 1).map((s) => ({
      strainId: s.id,
      name: s.name,
      quantity: defaultQty,
      fulfillmentTier: s.fulfillmentTier ?? gfFulfillmentTier(s.varietyCode ?? s.id),
    }))
  );

  const emit = (next: BulkOrderState) => {
    onStateChange?.(next);
  };

  const setLinesAndEmit = (next: BulkQuoteLineInput[]) => {
    setLines(next);
    emit({
      lines: next,
      coaMode: "none",
      buyExtra: false,
      packageACount: 0,
      packageBCount: 0,
    });
  };

  const quote = useMemo(
    () =>
      resolveQuote(lines, config, {
        mode: "none",
        buyExtra: false,
        packageACount: 0,
        packageBCount: 0,
        pilotMode,
      }),
    [lines, config, pilotMode]
  );

  const unused = catalog.filter(
    (c) => !lines.some((l) => l.strainId === c.id)
  );
  const autoCount = catalog.filter((c) => c.seedFormat === "AUTO_FEM").length;
  const photoCount = catalog.filter((c) => c.seedFormat === "FEM").length;

  const addLine = () => {
    const nextStrain = unused[0] ?? catalog[0];
    if (!nextStrain) return;
    setLinesAndEmit([
      ...lines,
      {
        strainId: nextStrain.id,
        name: nextStrain.name,
        quantity: defaultQty,
        fulfillmentTier:
          nextStrain.fulfillmentTier ??
          gfFulfillmentTier(nextStrain.varietyCode ?? nextStrain.id),
      },
    ]);
  };

  const updateLine = (idx: number, patch: Partial<BulkQuoteLineInput>) => {
    const next = lines.map((l, i) => (i === idx ? { ...l, ...patch } : l));
    setLinesAndEmit(next);
  };

  const removeLine = (idx: number) => {
    setLinesAndEmit(lines.filter((_, i) => i !== idx));
  };

  const saveCatalogToPhone = async () => {
    const csv = wholesaleCatalogCsv(catalog);
    const filename = "sgf-seeds-catalog.csv";
    const file = new File([`\uFEFF${csv}`], filename, {
      type: "text/csv;charset=utf-8",
    });
    try {
      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: t("ลิสต์เมล็ด SGF SEEDS", "SGF SEEDS strain list"),
          files: [file],
        });
        return;
      }
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          title: t("ลิสต์เมล็ด SGF SEEDS", "SGF SEEDS strain list"),
          text: wholesaleCatalogShareText(catalog, locale),
        });
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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

  return (
    <section id="rfq" className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          {depositsOpen
            ? t("สั่งเมล็ดขายส่ง · มัดจำ 50%", "Order wholesale seeds · 50% deposit")
            : t(
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
        {depositsOpen ? (
          <p className="mt-2 text-sm">
            <a href="/wholesale/transfer" className="text-emerald-700 underline">
              {t(
                "มีเลขอ้างอิงแล้ว? แจ้งโอนและแนบสลิป",
                "Already have a reference? Notify transfer and attach slip"
              )}
            </a>
          </p>
        ) : null}
        <p className="mt-3 text-sm text-slate-700">
          {t(
            `เลือกได้ ${catalog.length.toLocaleString("en-US")} สาย · Auto ${autoCount} · Photo ${photoCount}`,
            `${catalog.length.toLocaleString("en-US")} strains available · Auto ${autoCount} · Photo ${photoCount}`
          )}
        </p>
        <button
          type="button"
          onClick={() => void saveCatalogToPhone()}
          className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-900"
        >
          <Download className="h-4 w-4" aria-hidden />
          {t("บันทึกลิสต์ลงเครื่อง", "Save list to phone")}
        </button>
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
                <WholesaleStrainPicker
                  catalog={catalog}
                  valueId={line.strainId}
                  onSelect={(s) =>
                    updateLine(idx, {
                      strainId: s.id,
                      name: s.name,
                      fulfillmentTier:
                        s.fulfillmentTier ??
                        gfFulfillmentTier(s.varietyCode ?? s.id),
                    })
                  }
                />
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
                          `จำนวนต้องเป็นทวีคูณของ ${GF_PILOT_POUCH_QTY} เมล็ด (ซองซีล ${GF_PILOT_POUCH_QTY} เมล็ด)`,
                          `Quantity must be a multiple of ${GF_PILOT_POUCH_QTY} seeds (sealed ${GF_PILOT_POUCH_QTY}-seed pouches)`
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

      <BulkOrderSummary
        quote={quote}
        currency={currency}
        fx={config.eurThb}
        pilotMode={pilotMode}
      />

      <Button
        type="button"
        className="min-h-12 w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto"
        disabled={!quote.allValid || !quote.lines.length}
        onClick={() =>
          onRequestQuote({
            lines,
            coaMode: "none",
            buyExtra: false,
            packageACount: 0,
            packageBCount: 0,
          })
        }
      >
        {depositsOpen
          ? t("สั่งจองมัดจำ 50%", "Place 50% deposit order")
          : t("ขอใบเสนอราคา (ไม่ผูกพัน)", "Request quotation (non-binding)")}
      </Button>
    </section>
  );
}
