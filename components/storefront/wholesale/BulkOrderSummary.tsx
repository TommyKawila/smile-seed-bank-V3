"use client";

import type { BulkQuoteResult, CoaMode } from "@/lib/wholesale-bulk-pricing";
import { formatThb } from "@/lib/wholesale-bulk-pricing";

type Props = {
  quote: BulkQuoteResult;
  coaMode: CoaMode;
};

export function BulkOrderSummary({ quote, coaMode }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">
        สรุปคำสั่งซื้อ B2B
      </h3>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">Total Seed Cost</dt>
          <dd className="font-medium text-slate-900">
            {formatThb(quote.seedTotalThb)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">Extra COA Cost</dt>
          <dd className="font-medium text-slate-900">
            {formatThb(quote.extraCoaThb)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">Shipping</dt>
          <dd className="font-medium text-emerald-700">ฟรีค่าจัดส่ง</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 text-base">
          <dt className="font-semibold text-slate-900">Total Amount</dt>
          <dd className="font-bold text-slate-900">
            {formatThb(quote.grandTotalThb)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
        <p className="font-semibold text-slate-900">เงื่อนไขชำระเงิน 50/50</p>
        <p className="text-slate-700">
          มัดจำงวดแรก 50% (เพื่อเริ่มดำเนินการ/ส่งตรวจแล็บ):{" "}
          <strong>{formatThb(quote.depositThb)}</strong>
        </p>
        <p className="text-slate-700">
          ยอดค้างชำระอีก 50% (ชำระก่อนจัดส่งสินค้า):{" "}
          <strong>{formatThb(quote.balanceThb)}</strong>
        </p>
      </div>

      <p className="mt-4 text-sm text-slate-700">
        <span className="font-semibold">Estimated Delivery: </span>
        {coaMode === "with"
          ? "ประมาณ 35–40 วัน (รวมเวลาตรวจแล็บ 30 วัน)"
          : "ภายใน 3–7 วันทำการ"}
      </p>
    </div>
  );
}
