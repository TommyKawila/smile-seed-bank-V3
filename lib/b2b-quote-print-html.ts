import { calculateB2BQuoteTotals, formatB2BMoney, formatB2BUnitPrice } from "@/lib/b2b-quote-calc";
import { buildB2BPaymentTerms } from "@/lib/b2b-quote-payment-terms";
import type { B2BQuoteDraft } from "@/types/b2b-quote";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildB2BQuotePrintHtml(
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
  const logoBlock = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="Smile Seed Bank" class="logo" />`
    : `<div class="logo-fallback">Smile Seed Bank</div>`;

  const rows = draft.items
    .filter((it) => it.strainName.trim())
    .map(
      (it) => `<tr>
        <td>${escapeHtml(it.strainName)}</td>
        <td class="num">${it.quantity.toLocaleString()}</td>
        <td class="num">${escapeHtml(formatB2BUnitPrice(it.unitPrice, draft.currency))}</td>
        <td class="num">${escapeHtml(formatB2BMoney(it.lineTotal, draft.currency))}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(quoteNumber)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, system-ui, sans-serif; font-size: 10.5pt; color: #1e293b; padding: 16mm 18mm; }
    @page { size: A4; margin: 14mm 16mm; }
    @media print { body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    .header { display: flex; justify-content: space-between; gap: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10mm; margin-bottom: 8mm; }
    .logo { max-height: 14mm; max-width: 50mm; object-fit: contain; }
    .logo-fallback { font-size: 14pt; font-weight: 600; color: #12463e; }
    .doc-title { font-size: 13pt; font-weight: 700; color: #12463e; text-align: right; }
    .meta { font-size: 9.5pt; color: #64748b; text-align: right; margin-top: 2mm; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-bottom: 8mm; font-size: 10pt; }
    .label { color: #64748b; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 1mm; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 6mm; }
    th { background: #f1f5f9; text-align: left; padding: 2.5mm 2mm; font-size: 9pt; color: #475569; }
    td { padding: 2.5mm 2mm; border-bottom: 1px solid #e2e8f0; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .totals { margin-left: auto; width: 55%; }
    .totals .row { display: flex; justify-content: space-between; padding: 1.5mm 0; font-size: 10pt; }
    .totals .grand { font-weight: 700; font-size: 12pt; color: #12463e; border-top: 1px solid #cbd5e1; margin-top: 2mm; padding-top: 2mm; }
    h3 { font-size: 10pt; color: #12463e; margin: 6mm 0 2mm; }
    ul { padding-left: 4.5mm; color: #475569; font-size: 9.5pt; line-height: 1.4; }
    li { margin-bottom: 1mm; }
  </style>
</head>
<body>
  <header class="header">
    <div>${logoBlock}
      ${company?.companyEmail ? `<p class="meta" style="text-align:left;margin-top:3mm;">${escapeHtml(company.companyEmail)}</p>` : ""}
      ${company?.companyPhone ? `<p class="meta" style="text-align:left;">${escapeHtml(company.companyPhone)}</p>` : ""}
    </div>
    <div>
      <div class="doc-title">PRO-FORMA INVOICE / B2B QUOTATION</div>
      <div class="meta">${escapeHtml(quoteNumber)}</div>
      <div class="meta">Currency: ${escapeHtml(draft.currency)}</div>
    </div>
  </header>
  <div class="grid">
    <div>
      <div class="label">Bill / Ship to</div>
      <strong>${escapeHtml(draft.clientName)}</strong><br/>
      ${escapeHtml(draft.clientEmail || "—")}<br/>
      ${escapeHtml(draft.shippingAddress || "—")}
    </div>
    <div>
      <div class="label">Dates</div>
      Invoice date: ${escapeHtml(draft.invoiceDate)}<br/>
      Valid until: ${escapeHtml(draft.validUntil)}
    </div>
  </div>
  <table>
    <thead>
      <tr><th>Strain</th><th class="num">Qty (seeds)</th><th class="num">Unit price</th><th class="num">Line total</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${escapeHtml(formatB2BMoney(totals.subtotal, draft.currency))}</span></div>
    <div class="row"><span>Discount</span><span>${escapeHtml(formatB2BMoney(totals.discountAmount, draft.currency))}</span></div>
    <div class="row"><span>Shipping</span><span>${escapeHtml(formatB2BMoney(totals.shippingFee, draft.currency))}</span></div>
    <div class="row grand"><span>Total</span><span>${escapeHtml(formatB2BMoney(totals.totalAmount, draft.currency))}</span></div>
  </div>
  <h3>Payment Terms</h3>
  <ul>
    ${[...terms.bankTransfer, ...terms.crypto].map((l) => `<li>${escapeHtml(l)}</li>`).join("")}
  </ul>
  <h3>Notes &amp; Validity</h3>
  <ul>
    ${terms.notes.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}
  </ul>
</body>
</html>`;
}
