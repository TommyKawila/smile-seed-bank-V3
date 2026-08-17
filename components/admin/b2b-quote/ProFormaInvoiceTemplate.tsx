"use client";

import Image from "next/image";
import {
  calculateB2BQuoteTotals,
  formatB2BMoney,
  formatB2BUnitPrice,
} from "@/lib/b2b-quote-calc";
import { lineItemDisplayName } from "@/lib/b2b-quote-line";
import { buildB2BPaymentTerms, b2bQuoteAllNoteLines } from "@/lib/b2b-quote-payment-terms";
import type { B2BQuoteDraft } from "@/types/b2b-quote";
import { cn } from "@/lib/utils";

type Props = {
  draft: B2BQuoteDraft;
  quoteNumber: string;
  logoUrl: string | null;
  companyName?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  companyAddress?: string | null;
  className?: string;
};

export function ProFormaInvoiceTemplate({
  draft,
  quoteNumber,
  logoUrl,
  companyName,
  companyEmail,
  companyPhone,
  companyAddress,
  className,
}: Props) {
  const totals = calculateB2BQuoteTotals(
    draft.items,
    draft.discountAmount,
    draft.shippingFee,
    draft.currency
  );
  const terms = buildB2BPaymentTerms({
    companyName,
    companyEmail,
    companyPhone,
    companyAddress,
  });
  const noteLines = b2bQuoteAllNoteLines(terms, draft.paymentNotes);
  const lines = draft.items.filter((it) => it.strainName.trim());

  return (
    <article
      className={cn(
        "mx-auto flex w-full max-w-[210mm] flex-col bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/80",
        "min-h-[297mm] px-[18mm] py-[16mm]",
        className
      )}
      aria-label="Pro-forma invoice preview"
    >
      <header className="mb-6 flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Smile Seed Bank"
              width={200}
              height={48}
              className="h-11 w-auto max-w-[180px] object-contain object-left"
              unoptimized
            />
          ) : (
            <p className="text-lg font-semibold text-[#12463e]">Smile Seed Bank</p>
          )}
          {companyEmail ? (
            <p className="mt-2 text-xs text-slate-500">{companyEmail}</p>
          ) : null}
          {companyPhone ? <p className="text-xs text-slate-500">{companyPhone}</p> : null}
        </div>
        <div className="text-right">
          <h2 className="text-sm font-bold leading-snug text-[#12463e] sm:text-base">
            PRO-FORMA INVOICE / B2B QUOTATION
          </h2>
          <p className="mt-1 text-xs text-slate-500">{quoteNumber}</p>
          <p className="text-xs font-medium text-slate-600">Currency: {draft.currency}</p>
        </div>
      </header>

      <div className="mb-6 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Bill / Ship to
          </p>
          <p className="mt-1 font-semibold">{draft.clientName || "—"}</p>
          <p className="text-slate-600">{draft.clientEmail || "—"}</p>
          <p className="text-slate-600">{draft.shippingAddress || "—"}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Dates</p>
          <p className="mt-1 text-slate-700">Invoice date: {draft.invoiceDate}</p>
          <p className="text-slate-700">Valid until: {draft.validUntil}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-100 text-xs text-slate-600">
              <th className="px-2 py-2 font-medium">Strain</th>
              <th className="px-2 py-2 text-right font-medium">Qty</th>
              <th className="px-2 py-2 text-right font-medium">Unit</th>
              <th className="px-2 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-2 py-6 text-center text-slate-400">
                  No line items yet
                </td>
              </tr>
            ) : (
              lines.map((it) => (
                <tr key={it.id} className="border-b border-slate-100">
                  <td className="px-2 py-2">{lineItemDisplayName(it)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {it.quantity.toLocaleString()}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {formatB2BUnitPrice(it.unitPrice, draft.currency)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {formatB2BMoney(it.lineTotal, draft.currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatB2BMoney(totals.subtotal, draft.currency)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Discount</span>
          <span className="tabular-nums">
            {formatB2BMoney(totals.discountAmount, draft.currency)}
          </span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Shipping</span>
          <span className="tabular-nums">
            {formatB2BMoney(totals.shippingFee, draft.currency)}
          </span>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-[#12463e]">
          <span>Total</span>
          <span className="tabular-nums">
            {formatB2BMoney(totals.totalAmount, draft.currency)}
          </span>
        </div>
      </div>

      <section className="mt-8">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#12463e]">
          Payment Terms
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
          {[...terms.bankTransfer, ...terms.crypto].map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>

      <section className="mt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#12463e]">
          Notes &amp; Validity
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
          {noteLines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
