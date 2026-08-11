import { calculateB2BQuoteTotals, formatB2BMoney, formatB2BUnitPrice } from "@/lib/b2b-quote-calc";
import { buildB2BPaymentTerms, b2bQuoteAllNoteLines } from "@/lib/b2b-quote-payment-terms";
import type { B2BQuoteDraft } from "@/types/b2b-quote";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildB2BQuoteEmailHtml(
  draft: B2BQuoteDraft,
  quoteNumber: string,
  logoUrl: string | null,
  company?: {
    companyName?: string | null;
    companyEmail?: string | null;
    companyPhone?: string | null;
    companyAddress?: string | null;
  }
): string {
  const totals = calculateB2BQuoteTotals(
    draft.items,
    draft.discountAmount,
    draft.shippingFee,
    draft.currency
  );
  const terms = buildB2BPaymentTerms(company);
  const noteLines = b2bQuoteAllNoteLines(terms, draft.paymentNotes);
  const logo = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="Smile Seed Bank" width="160" style="max-width:160px;height:auto;display:block;margin-bottom:16px;" />`
    : `<p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#12463e;">Smile Seed Bank</p>`;

  const rows = draft.items
    .filter((it) => it.strainName.trim())
    .map(
      (it) => `<tr>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(it.strainName)}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${it.quantity.toLocaleString()}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${escapeHtml(formatB2BUnitPrice(it.unitPrice, draft.currency))}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${escapeHtml(formatB2BMoney(it.lineTotal, draft.currency))}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:system-ui,sans-serif;color:#1e293b;">
  <div style="max-width:720px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:28px 32px;">
    ${logo}
    <h1 style="margin:0 0 4px;font-size:18px;color:#12463e;">PRO-FORMA INVOICE / B2B QUOTATION</h1>
    <p style="margin:0 0 20px;font-size:13px;color:#64748b;">${escapeHtml(quoteNumber)} · ${escapeHtml(draft.currency)}</p>
    <p style="margin:0 0 4px;font-size:14px;"><strong>Client:</strong> ${escapeHtml(draft.clientName)}</p>
    <p style="margin:0 0 4px;font-size:14px;"><strong>Email:</strong> ${escapeHtml(draft.clientEmail || "—")}</p>
    <p style="margin:0 0 4px;font-size:14px;"><strong>Ship to:</strong> ${escapeHtml(draft.shippingAddress || "—")}</p>
    <p style="margin:0 0 20px;font-size:14px;"><strong>Invoice date:</strong> ${escapeHtml(draft.invoiceDate)} · <strong>Valid until:</strong> ${escapeHtml(draft.validUntil)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="padding:8px;text-align:left;">Strain</th>
          <th style="padding:8px;text-align:right;">Qty</th>
          <th style="padding:8px;text-align:right;">Unit</th>
          <th style="padding:8px;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin:4px 0;font-size:14px;text-align:right;">Subtotal: ${escapeHtml(formatB2BMoney(totals.subtotal, draft.currency))}</p>
    <p style="margin:4px 0;font-size:14px;text-align:right;">Discount: ${escapeHtml(formatB2BMoney(totals.discountAmount, draft.currency))}</p>
    <p style="margin:4px 0;font-size:14px;text-align:right;">Shipping: ${escapeHtml(formatB2BMoney(totals.shippingFee, draft.currency))}</p>
    <p style="margin:8px 0 20px;font-size:16px;font-weight:700;text-align:right;color:#12463e;">Total: ${escapeHtml(formatB2BMoney(totals.totalAmount, draft.currency))}</p>
    <h2 style="margin:0 0 8px;font-size:14px;color:#12463e;">Payment Terms</h2>
    <ul style="margin:0 0 12px;padding-left:18px;font-size:13px;color:#475569;">
      ${terms.bankTransfer.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}
      ${terms.crypto.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}
    </ul>
    <h2 style="margin:0 0 8px;font-size:14px;color:#12463e;">Notes</h2>
    <ul style="margin:0;padding-left:18px;font-size:13px;color:#475569;">
      ${noteLines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}
    </ul>
  </div>
</body>
</html>`;
}

export function buildB2BQuotePlainText(draft: B2BQuoteDraft, quoteNumber: string): string {
  const totals = calculateB2BQuoteTotals(
    draft.items,
    draft.discountAmount,
    draft.shippingFee,
    draft.currency
  );
  const terms = buildB2BPaymentTerms();
  const noteLines = b2bQuoteAllNoteLines(terms, draft.paymentNotes);
  const lines = draft.items
    .filter((it) => it.strainName.trim())
    .map(
      (it) =>
        `- ${it.strainName}: ${it.quantity} × ${formatB2BUnitPrice(it.unitPrice, draft.currency)} = ${formatB2BMoney(it.lineTotal, draft.currency)}`
    );
  return [
    `PRO-FORMA INVOICE / B2B QUOTATION`,
    quoteNumber,
    `Client: ${draft.clientName}`,
    `Email: ${draft.clientEmail}`,
    `Ship to: ${draft.shippingAddress}`,
    `Invoice: ${draft.invoiceDate} · Valid until: ${draft.validUntil}`,
    ``,
    ...lines,
    ``,
    `Subtotal: ${formatB2BMoney(totals.subtotal, draft.currency)}`,
    `Discount: ${formatB2BMoney(totals.discountAmount, draft.currency)}`,
    `Shipping: ${formatB2BMoney(totals.shippingFee, draft.currency)}`,
    `Total: ${formatB2BMoney(totals.totalAmount, draft.currency)}`,
    ``,
    `Notes:`,
    ...noteLines.map((l) => `- ${l}`),
  ].join("\n");
}
