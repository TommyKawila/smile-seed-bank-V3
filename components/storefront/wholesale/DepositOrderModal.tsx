"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/context/LanguageContext";
import {
  formatThb,
  resolveQuote,
  type BulkPricingConfig,
} from "@/lib/wholesale-bulk-pricing";
import type { QuoteCartLine, RfqFormState } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: QuoteCartLine[];
  form: RfqFormState;
  onFormChange: (patch: Partial<RfqFormState>) => void;
  onRemoveLine: (strainId: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
  successReservationNumber: string | null;
  successDepositThb: number | null;
  bulkPricing: BulkPricingConfig;
};

export function DepositOrderModal({
  open,
  onOpenChange,
  lines,
  form,
  onFormChange,
  onRemoveLine,
  onSubmit,
  submitting,
  submitError,
  successReservationNumber,
  successDepositThb,
  bulkPricing,
}: Props) {
  const { t } = useLanguage();
  const quote = resolveQuote(
    lines.map((l) => ({
      strainId: l.strainId,
      name: l.name,
      quantity: l.quantity,
      fulfillmentTier: l.fulfillmentTier,
    })),
    bulkPricing,
    {
      mode: form.coaMode,
      buyExtra: form.buyExtraCoa,
      packageACount: form.coaPackageA,
      packageBCount: form.coaPackageB,
      pilotMode: true,
    }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-slate-200 bg-white text-slate-900 sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900">
            {t("สั่งเมล็ดขายส่ง · มัดจำ 50%", "Order wholesale seeds · 50% deposit")}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            {t(
              "ฟอร์มนี้ไม่เข้าตะกร้าร้าน — หลังสั่งให้โอนเข้า หจก.ทีเอ็มวาย อะโกรเทรด แล้วแนบสลิป",
              "This form is not the shop cart — after ordering, transfer to T.M.Y Agro Trade Limited Partnership and attach the slip"
            )}
          </DialogDescription>
        </DialogHeader>

        {successReservationNumber ? (
          <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
            <p className="font-semibold">
              {t("สร้างใบจองแล้ว", "Reservation created")}
            </p>
            <p>
              {t("เลขอ้างอิง", "Reference")}:{" "}
              <strong>{successReservationNumber}</strong>
            </p>
            {successDepositThb != null ? (
              <p>
                {t("มัดจำ 50% ที่ต้องโอน", "50% deposit to transfer")}:{" "}
                <strong>{formatThb(successDepositThb)}</strong>
              </p>
            ) : null}
            <Link
              href={`/wholesale/transfer?ref=${encodeURIComponent(successReservationNumber)}`}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t("ไปแจ้งโอนและแนบสลิป", "Notify transfer and attach slip")}
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-800">
                {t("สรุปคำสั่งจอง", "Reservation summary")}
              </h3>
              {quote.lines.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  {t("ยังไม่มีรายการ", "No items yet")}
                </p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {quote.lines.map((l) => (
                    <li
                      key={l.strainId}
                      className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200/80 pb-2 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{l.name}</p>
                        <p className="text-xs text-slate-500">
                          {l.quantity.toLocaleString()} seeds
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {formatThb(l.lineTotalThb)}
                        </span>
                        <button
                          type="button"
                          className="min-h-10 text-xs font-medium text-red-600 hover:underline"
                          onClick={() => onRemoveLine(l.strainId)}
                        >
                          {t("ลบ", "Remove")}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <dl className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600">{t("ยอดเมล็ด", "Seeds subtotal")}</dt>
                  <dd className="font-medium">{formatThb(quote.seedTotalThb)}</dd>
                </div>
                {quote.extraCoaThb > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-slate-600">{t("ค่าแล็บ COA", "Lab COA")}</dt>
                    <dd className="font-medium">{formatThb(quote.extraCoaThb)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between text-base">
                  <dt className="font-semibold text-slate-900">
                    {t("ยอดรวม", "Total")}
                  </dt>
                  <dd className="font-bold text-emerald-800">
                    {formatThb(quote.grandTotalThb)}
                  </dd>
                </div>
                <div className="flex justify-between text-sm text-slate-800">
                  <dt>{t("มัดจำ 50% โอนตอนนี้", "50% deposit now")}</dt>
                  <dd className="font-semibold">{formatThb(quote.depositThb)}</dd>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <dt>{t("ยอดค้าง 50% ก่อนจัดส่ง", "Balance 50% before shipment")}</dt>
                  <dd>{formatThb(quote.balanceThb)}</dd>
                </div>
              </dl>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={t("ชื่อบริษัท / ฟาร์ม", "Company / farm name")}
                value={form.companyName}
                onChange={(v) => onFormChange({ companyName: v })}
                required
              />
              <Field
                label={t("ชื่อผู้ติดต่อ", "Contact Person Name")}
                value={form.contactName}
                onChange={(v) => onFormChange({ contactName: v })}
                required
              />
              <Field
                label={t("อีเมลธุรกิจ", "Business Email")}
                type="email"
                value={form.email}
                onChange={(v) => onFormChange({ email: v })}
                required
              />
              <Field
                label={t("เบอร์โทร", "Phone Number")}
                value={form.phone}
                onChange={(v) => onFormChange({ phone: v })}
                required
              />
            </div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("ที่อยู่จัดส่ง (ประเทศไทย)", "Delivery Address (Thailand)")}
              <textarea
                required
                rows={3}
                value={form.address}
                onChange={(e) => onFormChange({ address: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-3 text-base text-slate-900 outline-none ring-emerald-500 focus:ring-2"
              />
            </label>
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("ใบอนุญาต (ถ้ามี)", "Licence (if any)")}
              </p>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("สถานะใบอนุญาต", "Licence status")}
                <select
                  value={form.licenseStatus}
                  onChange={(e) =>
                    onFormChange({
                      licenseStatus: e.target.value as RfqFormState["licenseStatus"],
                    })
                  }
                  className="mt-1.5 flex h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-emerald-500 focus:ring-2"
                >
                  <option value="">{t("เลือกสถานะ", "Select status")}</option>
                  <option value="active">{t("มีใบอนุญาตแล้ว", "Licensed")}</option>
                  <option value="pending">
                    {t("อยู่ระหว่างยื่น", "Application pending")}
                  </option>
                </select>
              </label>
              <Field
                label={t("เลขใบอนุญาต", "Licence number")}
                value={form.licenseNumber}
                onChange={(v) => onFormChange({ licenseNumber: v })}
              />
            </div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("ข้อความ / ความต้องการพิเศษ", "Message / Special Requirements")}
              <textarea
                rows={3}
                value={form.message}
                onChange={(e) => onFormChange({ message: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-3 text-base text-slate-900 outline-none ring-emerald-500 focus:ring-2"
              />
            </label>
            {submitError ? (
              <p className="text-sm text-red-600">{submitError}</p>
            ) : null}
            <button
              type="button"
              disabled={submitting || !quote.allValid || quote.lines.length === 0}
              onClick={onSubmit}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting
                ? t("กำลังสร้างใบจอง…", "Creating reservation…")
                : t("ยืนยันสั่งจองมัดจำ 50%", "Confirm 50% deposit reservation")}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 flex h-12 w-full rounded-lg border border-slate-300 px-3 text-base text-slate-900 outline-none ring-emerald-500 focus:ring-2"
      />
    </label>
  );
}
