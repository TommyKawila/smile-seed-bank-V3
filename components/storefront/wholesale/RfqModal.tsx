"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/context/LanguageContext";
import {
  formatWholesaleMoney,
  gacpFeeTotal,
  lineTotal,
  resolveTier,
  unitPrice,
} from "@/lib/wholesale-public-pricing";
import type {
  QuoteCartLine,
  RfqFormState,
  WholesaleCurrency,
  WholesalePaymentMethod,
} from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: WholesaleCurrency;
  lines: QuoteCartLine[];
  form: RfqFormState;
  onFormChange: (patch: Partial<RfqFormState>) => void;
  onRemoveLine: (strainId: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
  successQuoteNumber: string | null;
};

const PAYMENTS: { id: WholesalePaymentMethod; th: string; en: string }[] = [
  { id: "THB_BANK", th: "โอนธนาคารบาท (THB)", en: "THB Bank Transfer" },
  { id: "EUR_WIRE", th: "โอนยูโร (EUR Wire)", en: "EUR Wire" },
  { id: "USDT", th: "USDT", en: "USDT" },
];

export function RfqModal({
  open,
  onOpenChange,
  currency,
  lines,
  form,
  onFormChange,
  onRemoveLine,
  onSubmit,
  submitting,
  submitError,
  successQuoteNumber,
}: Props) {
  const { t } = useLanguage();

  const subtotal = lines.reduce(
    (sum, l) => sum + lineTotal(l.quantity, currency),
    0
  );
  const gacp = form.requireGacp
    ? gacpFeeTotal(lines.length, currency)
    : 0;
  const estimated = subtotal + gacp;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-slate-200 bg-white text-slate-900 sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900">
            {t("ส่งคำขอใบเสนอราคา (RFQ)", "Submit Request for Quote (RFQ)")}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            {t(
              "ทีม B2B จะออกใบแจ้งหนี้ฉบับร่างและติดต่อกลับ",
              "Our B2B team will generate a draft invoice and follow up."
            )}
          </DialogDescription>
        </DialogHeader>

        {successQuoteNumber ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
            <p className="font-semibold">
              {t("ส่งคำขอสำเร็จ", "RFQ submitted")}
            </p>
            <p className="mt-1">
              {t("เลขที่ใบเสนอราคาฉบับร่าง", "Draft quote number")}:{" "}
              <strong>{successQuoteNumber}</strong>
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-800">
                {t("สรุปรายการ", "Quote summary")}
              </h3>
              {lines.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  {t("ยังไม่มีรายการ", "No items yet")}
                </p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {lines.map((l) => {
                    const tier = resolveTier(l.quantity);
                    return (
                      <li
                        key={l.strainId}
                        className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200/80 pb-2 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{l.name}</p>
                          <p className="text-xs text-slate-500">
                            {l.quantity.toLocaleString()} seeds · Tier {tier.id} ·{" "}
                            {formatWholesaleMoney(
                              unitPrice(l.quantity, currency),
                              currency
                            )}
                            /seed
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {formatWholesaleMoney(
                              lineTotal(l.quantity, currency),
                              currency
                            )}
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
                    );
                  })}
                </ul>
              )}
              <dl className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600">{t("ยอดเมล็ด", "Seeds subtotal")}</dt>
                  <dd className="font-medium">
                    {formatWholesaleMoney(subtotal, currency)}
                  </dd>
                </div>
                {form.requireGacp ? (
                  <div className="flex justify-between">
                    <dt className="text-slate-600">
                      {t("ค่าเอกสาร GACP", "GACP documentation fee")}
                    </dt>
                    <dd className="font-medium">
                      {formatWholesaleMoney(gacp, currency)}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between text-base">
                  <dt className="font-semibold text-slate-900">
                    {t("ประมาณการรวม", "Estimated total")}
                  </dt>
                  <dd className="font-bold text-emerald-800">
                    {formatWholesaleMoney(estimated, currency)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={t("ชื่อบริษัท", "Company Name")}
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
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("วิธีชำระเงินที่ต้องการ", "Preferred Payment Method")}
              </legend>
              <div className="mt-2 flex flex-col gap-2">
                {PAYMENTS.map((p) => (
                  <label
                    key={p.id}
                    className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm text-slate-800"
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={form.paymentMethod === p.id}
                      onChange={() => onFormChange({ paymentMethod: p.id })}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    {t(p.th, p.en)}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-3">
              <input
                type="checkbox"
                checked={form.requireGacp}
                onChange={(e) =>
                  onFormChange({ requireGacp: e.target.checked })
                }
                className="mt-1 h-4 w-4 accent-emerald-600"
              />
              <span className="text-sm text-slate-800">
                <span className="font-medium">
                  {t(
                    "ต้องการแพ็กเกจเอกสารตามมาตรฐาน GACP (COA เต็ม, Heavy Metals & Pesticides, Genetic Lineage Certificate)",
                    "Require GACP-Compliant Documentation Package (Full COA, Heavy Metals & Pesticides Lab Reports, Genetic Lineage Certificate)"
                  )}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {t(
                    "หมายเหตุ: แพ็กเกจเอกสาร GACP ทางการมีค่าดำเนินการเพิ่ม 3,500 บาท (€100) ต่อสายพันธุ์",
                    "Note: Official GACP-certified documentation package incurs an additional processing fee of 3,500 THB (€100) per strain."
                  )}
                </span>
              </span>
            </label>
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
              disabled={submitting || lines.length === 0}
              onClick={onSubmit}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting
                ? t("กำลังส่ง…", "Submitting…")
                : t(
                    "ส่ง RFQ และสร้างใบแจ้งหนี้ฉบับร่าง",
                    "Submit RFQ & Generate Draft Invoice"
                  )}
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
