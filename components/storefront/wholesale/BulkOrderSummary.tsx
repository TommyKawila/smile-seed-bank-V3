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
import type { BulkQuoteResult, CoaMode } from "@/lib/wholesale-bulk-pricing";
import { formatThb } from "@/lib/wholesale-bulk-pricing";

type Props = {
  quote: BulkQuoteResult;
  coaMode: CoaMode;
};

export function BulkOrderSummary({ quote, coaMode }: Props) {
  const { t } = useLanguage();
  const showPayment = gfShowPaymentTerms();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">
        {t("ประมาณการใบเสนอราคา", "Quotation estimate")}
      </h3>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">
            {t("ค่าเมล็ดรวม", "Total Seed Cost")}
          </dt>
          <dd className="font-medium text-slate-900">
            {formatThb(quote.seedTotalThb)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">
            {t("ค่า COA เพิ่มเติม", "Extra COA Cost")}
          </dt>
          <dd className="font-medium text-slate-900">
            {formatThb(quote.extraCoaThb)}
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
            {formatThb(quote.grandTotalThb)}
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
            <strong>{formatThb(quote.depositThb)}</strong>
          </p>
          <p className="text-slate-700">
            {t("ยอดค้าง 50% (ก่อนจัดส่ง):", "Balance 50% (before shipment):")}{" "}
            <strong>{formatThb(quote.balanceThb)}</strong>
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
