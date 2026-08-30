"use client";

import { useLanguage } from "@/context/LanguageContext";
import {
  GF_CONDITIONAL_DEPOSIT_SHORT_EN,
  GF_CONDITIONAL_DEPOSIT_SHORT_TH,
  GF_DISPATCH_AFTER_PO_EN,
  GF_DISPATCH_AFTER_PO_TH,
  GF_OPTION1_DISPATCH_EN,
  GF_OPTION1_DISPATCH_TH,
  GF_WITH_COA_DISPATCH_EN,
  GF_WITH_COA_DISPATCH_TH,
  gfShowPaymentTerms,
} from "@/lib/green-future-approved-marketing";
import {
  GF_PILOT_POUCH_QTY,
  gfPilotNextTier,
  gfPilotPouchCount,
} from "@/lib/green-future-pilot-config";
import type { BulkQuoteResult, CoaMode } from "@/lib/wholesale-bulk-pricing";
import { formatThb, thbToEurDisplay } from "@/lib/wholesale-bulk-pricing";

type Props = {
  quote: BulkQuoteResult;
  coaMode: CoaMode;
  currency?: "THB" | "EUR";
  fx?: number;
  pilotMode?: boolean;
};

function money(thb: number, currency: "THB" | "EUR", fx: number): string {
  if (currency === "EUR") {
    return `€${thbToEurDisplay(thb, fx).toLocaleString("en-US")}`;
  }
  return formatThb(thb);
}

export function BulkOrderSummary({
  quote,
  coaMode,
  currency = "THB",
  fx = 38.44,
  pilotMode = true,
}: Props) {
  const { t } = useLanguage();
  const showPayment = gfShowPaymentTerms();
  const pouches = gfPilotPouchCount(quote.totalSeeds);
  const nextTier = pilotMode ? gfPilotNextTier(quote.totalSeeds) : null;
  const rateThb = quote.unitThbForBulk ?? 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">
        {t("ประมาณการใบเสนอราคา", "Quotation estimate")}
      </h3>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">
            {t("ยอดเมล็ดรวม", "Total seeds")}
          </dt>
          <dd className="font-medium tabular-nums text-slate-900">
            {pilotMode && pouches > 0
              ? t(
                  `${quote.totalSeeds.toLocaleString("en-US")} เมล็ด (${pouches} ซอง)`,
                  `${quote.totalSeeds.toLocaleString("en-US")} seeds (${pouches} pouches)`
                )
              : t(
                  `${quote.totalSeeds.toLocaleString("en-US")} เมล็ด`,
                  `${quote.totalSeeds.toLocaleString("en-US")} seeds`
                )}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">
            {t("ราคาต่อเมล็ด (ตามยอดรวม)", "Price per seed (by cart total)")}
          </dt>
          <dd className="font-semibold tabular-nums text-slate-900">
            {rateThb > 0
              ? `${money(rateThb, currency, fx)}${t("/เมล็ด", "/seed")}`
              : "—"}
          </dd>
        </div>
      </dl>
      {pilotMode ? (
        <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
          {t(
            "เรทลดตามยอดรวมทั้งคำขอ: 50–200 → 125 · 250–450 → 100 · 500–1,000 → 80 บาท/เมล็ด",
            "Cart-total tiers: 50–200 → 125 · 250–450 → 100 · 500–1,000 → 80 THB/seed"
          )}
          {nextTier
            ? t(
                ` · เพิ่มอีก ${nextTier.needSeeds.toLocaleString("en-US")} เมล็ด (${Math.ceil(nextTier.needSeeds / GF_PILOT_POUCH_QTY)} ซอง) เพื่อเรท ${nextTier.nextThbPerSeed.toLocaleString("en-US")} บาท/เมล็ด`,
                ` · add ${nextTier.needSeeds.toLocaleString("en-US")} seeds (${Math.ceil(nextTier.needSeeds / GF_PILOT_POUCH_QTY)} pouches) to reach ${nextTier.nextThbPerSeed.toLocaleString("en-US")} THB/seed`
              )
            : ""}
        </p>
      ) : null}
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">
            {t("ค่าเมล็ดรวม", "Total Seed Cost")}
          </dt>
          <dd className="font-medium tabular-nums text-slate-900">
            {money(quote.seedTotalThb, currency, fx)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">
            {t("ค่า COA เพิ่มเติม", "Extra COA Cost")}
          </dt>
          <dd className="font-medium text-slate-900">
            {money(quote.extraCoaThb, currency, fx)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">{t("ค่าจัดส่ง", "Shipping")}</dt>
          <dd className="font-medium text-slate-700">
            {t("คำนวณในใบเสนอราคาสุดท้าย", "Calculated in final quotation")}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 text-base">
          <dt className="font-semibold text-slate-900">
            {t("ยอดรวมประมาณการ", "Estimated total")}
          </dt>
          <dd className="font-bold text-slate-900">
            {money(quote.grandTotalThb, currency, fx)}
          </dd>
        </div>
      </dl>

      {showPayment ? (
        <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
          <p className="font-semibold text-slate-900">
            {t("มัดจำจองสิทธิ์แบบมีเงื่อนไข", "Conditional reservation deposit")}
          </p>
          <p className="text-slate-700">
            {t(GF_CONDITIONAL_DEPOSIT_SHORT_TH, GF_CONDITIONAL_DEPOSIT_SHORT_EN)}
          </p>
          <p className="text-slate-700">
            {t("มัดจำ 50% ต่อรายการ:", "50% deposit per line:")}{" "}
            <strong>{money(quote.depositThb, currency, fx)}</strong>
          </p>
          <p className="text-slate-700">
            {t("ยอดค้าง 50% (ก่อนจัดส่ง):", "Balance 50% (before shipment):")}{" "}
            <strong>{money(quote.balanceThb, currency, fx)}</strong>
          </p>
        </div>
      ) : null}

      <p className="mt-3 text-xs text-amber-700">
        {t(
          "* ราคาข้างต้นเป็นการประมาณการ — ผูกพันเมื่อยืนยันในใบเสนอราคา",
          "* Prices above are indicative estimates — binding only when confirmed in a quotation"
        )}
      </p>

      <p className="mt-4 text-sm text-slate-700">
        <span className="font-semibold">
          {t("ประมาณการจัดส่ง:", "Estimated Delivery:")}{" "}
        </span>
        {coaMode === "with"
          ? t(GF_WITH_COA_DISPATCH_TH, GF_WITH_COA_DISPATCH_EN)
          : t(GF_OPTION1_DISPATCH_TH, GF_OPTION1_DISPATCH_EN)}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {t(GF_DISPATCH_AFTER_PO_TH, GF_DISPATCH_AFTER_PO_EN)}
      </p>
    </div>
  );
}
