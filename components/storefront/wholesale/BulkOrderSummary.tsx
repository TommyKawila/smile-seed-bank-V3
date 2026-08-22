"use client";

import { useLanguage } from "@/context/LanguageContext";
import type { BulkQuoteResult, CoaMode } from "@/lib/wholesale-bulk-pricing";
import { formatThb } from "@/lib/wholesale-bulk-pricing";

type Props = {
  quote: BulkQuoteResult;
  coaMode: CoaMode;
};

export function BulkOrderSummary({ quote, coaMode }: Props) {
  const { t } = useLanguage();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">
        {t("สรุปคำสั่งซื้อ B2B", "B2B order summary")}
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
            {t("ยอดรวม", "Total Amount")}
          </dt>
          <dd className="font-bold text-slate-900">
            {formatThb(quote.grandTotalThb)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
        <p className="font-semibold text-slate-900">
          {t("เงื่อนไขชำระเงิน 50/50", "50/50 payment terms")}
        </p>
        <p className="text-slate-700">
          {t(
            "มัดจำงวดแรก 50% (เพื่อเริ่มดำเนินการ/ส่งตรวจแล็บ):",
            "First deposit 50% (to start processing / lab testing):"
          )}{" "}
          <strong>{formatThb(quote.depositThb)}</strong>
        </p>
        <p className="text-slate-700">
          {t(
            "ยอดค้างชำระอีก 50% (ชำระก่อนจัดส่งสินค้า):",
            "Remaining 50% (due before shipment):"
          )}{" "}
          <strong>{formatThb(quote.balanceThb)}</strong>
        </p>
      </div>

      <p className="mt-1 text-xs text-amber-700">
        {t(
          "* ราคาข้างต้นเป็นการประมาณการ — ผูกพันเมื่อ GF quotation + PO ยืนยัน",
          "* Prices above are indicative estimates — binding only after GF quotation + accepted PO"
        )}
      </p>

      <p className="mt-4 text-sm text-slate-700">
        <span className="font-semibold">
          {t("ประมาณการจัดส่ง:", "Estimated Delivery:")}{" "}
        </span>
        {coaMode === "with"
          ? t(
              "ประมาณการ ~35–40 วัน (รวมแล็บ ~30 วัน) — ขึ้นกับล็อตและ quotation",
              "Indicative ~35–40 days (incl. ~30 days lab) — subject to lot and quotation"
            )
          : t(
              "ประมาณการ 3–7 วันทำการหลังมัดจำ 50% — ขึ้นกับล็อตและ quotation",
              "Indicative 3–7 business days after 50% advance — subject to lot and quotation"
            )}
      </p>
    </div>
  );
}
