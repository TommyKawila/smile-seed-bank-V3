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
  formatThb,
  resolveQuote,
  thbToEurDisplay,
  type BulkPricingConfig,
} from "@/lib/wholesale-bulk-pricing";
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
  bulkPricing: BulkPricingConfig;
};

const PAYMENTS: { id: WholesalePaymentMethod; th: string; en: string }[] = [
  { id: "THB_BANK", th: "โอนธนาคารบาท (THB)", en: "THB Bank Transfer" },
  { id: "EUR_WIRE", th: "โอนยูโร (EUR Wire)", en: "EUR Wire" },
  { id: "USDT", th: "USDT", en: "USDT" },
];

function money(
  thb: number,
  currency: WholesaleCurrency,
  fx: number
): string {
  if (currency === "EUR") {
    return `€${thbToEurDisplay(thb, fx).toLocaleString("en-US")}`;
  }
  return formatThb(thb);
}

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
  bulkPricing,
}: Props) {
  const { t } = useLanguage();
  const quote = resolveQuote(
    lines.map((l) => ({
      strainId: l.strainId,
      name: l.name,
      quantity: l.quantity,
    })),
    bulkPricing,
    {
      mode: form.coaMode,
      buyExtra: form.buyExtraCoa,
      packageACount: form.coaPackageA,
      packageBCount: form.coaPackageB,
    }
  );

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
                          {l.quantity.toLocaleString()} seeds ·{" "}
                          {money(l.unitThb, currency, bulkPricing.eurThb)}/seed
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {money(l.lineTotalThb, currency, bulkPricing.eurThb)}
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
                  <dt className="text-slate-600">
                    {t("ยอดเมล็ด", "Seeds subtotal")}
                  </dt>
                  <dd className="font-medium">
                    {money(quote.seedTotalThb, currency, bulkPricing.eurThb)}
                  </dd>
                </div>
                {quote.extraCoaThb > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Extra COA</dt>
                    <dd className="font-medium">
                      {money(quote.extraCoaThb, currency, bulkPricing.eurThb)}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between text-base">
                  <dt className="font-semibold text-slate-900">
                    {t("ประมาณการรวม", "Estimated total")}
                  </dt>
                  <dd className="font-bold text-emerald-800">
                    {money(quote.grandTotalThb, currency, bulkPricing.eurThb)}
                  </dd>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <dt>{t("มัดจำ 50%", "Deposit 50%")}</dt>
                  <dd>{money(quote.depositThb, currency, bulkPricing.eurThb)}</dd>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <dt>{t("ยอดค้าง 50%", "Balance 50%")}</dt>
                  <dd>{money(quote.balanceThb, currency, bulkPricing.eurThb)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-slate-500">
                {t(
                  "* ประมาณการ — ผูกพันเมื่อ GF quotation + PO ยืนยัน",
                  "* Indicative estimate — binding after GF quotation + accepted PO"
                )}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                COA:{" "}
                {form.coaMode === "with"
                  ? t(
                      "With COA (~35–40 วัน · ประมาณการ)",
                      "With COA (~35–40 days · indicative)"
                    )
                  : t(
                      "No COA (3–7 วันทำการหลังมัดจำ 50% · ประมาณการ)",
                      "No COA (3–7 days after 50% advance · indicative)"
                    )}
              </p>
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
