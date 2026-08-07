import {
  formatLetterheadBlock,
  formatStoreTrustBlock,
  STORE_ENTITY,
  type LegalLocale,
} from "@/lib/company-legal-identity";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type BusinessDocumentLetterheadOpts = {
  logoUrl?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  locale?: LegalLocale;
};

/** Print CSS letterhead (logo + legal entity). */
export function buildBusinessDocumentLetterheadHtml(
  opts: BusinessDocumentLetterheadOpts = {}
): string {
  const locale = opts.locale ?? "en";
  const lines = formatLetterheadBlock(locale);
  const logo = opts.logoUrl?.trim()
    ? `<img src="${escapeHtml(opts.logoUrl.trim())}" alt="${escapeHtml(STORE_ENTITY.brandName)}" class="doc-logo" />`
    : `<div class="doc-logo-fallback">${escapeHtml(STORE_ENTITY.brandName)}</div>`;

  const contactBits: string[] = [];
  if (opts.companyEmail?.trim()) contactBits.push(escapeHtml(opts.companyEmail.trim()));
  if (opts.companyPhone?.trim()) contactBits.push(escapeHtml(opts.companyPhone.trim()));

  return `<header class="doc-header">
  <div class="doc-letterhead">
    ${logo}
    <div class="doc-letterhead-text">
      <p class="doc-entity-name">${escapeHtml(lines[0] ?? "")}</p>
      <p class="doc-entity-line">${escapeHtml(lines[1] ?? "")}</p>
      <p class="doc-entity-line">${escapeHtml(lines[2] ?? "")}</p>
      <p class="doc-entity-brand">${escapeHtml(lines[3] ?? "")}</p>
      ${
        contactBits.length
          ? `<p class="doc-entity-line">${contactBits.join(" · ")}</p>`
          : ""
      }
    </div>
  </div>
</header>`;
}

/** Print CSS footer (online store trust block). */
export function buildBusinessDocumentFooterHtml(locale: LegalLocale = "en"): string {
  const lines = formatStoreTrustBlock(locale);
  return `<footer class="doc-footer">
  ${lines.map((line) => `<p class="doc-footer-line">${escapeHtml(line)}</p>`).join("\n  ")}
</footer>`;
}

/** Shared print stylesheet additions for letterhead/footer. */
export const BUSINESS_DOCUMENT_LETTERHEAD_CSS = `
    .doc-header { margin-bottom: 8mm; padding-bottom: 5mm; border-bottom: 1.5px solid #12463e; }
    .doc-letterhead { display: flex; gap: 8mm; align-items: flex-start; }
    .doc-logo { max-height: 14mm; max-width: 48mm; object-fit: contain; object-position: left center; flex-shrink: 0; }
    .doc-logo-fallback { font-size: 13pt; font-weight: 600; color: #12463e; letter-spacing: 0.02em; flex-shrink: 0; }
    .doc-letterhead-text { flex: 1; min-width: 0; }
    .doc-entity-name { font-size: 11pt; font-weight: 600; color: #12463e; margin: 0 0 1.5mm; line-height: 1.3; }
    .doc-entity-line { font-size: 8.5pt; color: #475569; margin: 0 0 1mm; line-height: 1.35; }
    .doc-entity-brand { font-size: 8.5pt; color: #12463e; font-weight: 500; margin: 1.5mm 0 0; line-height: 1.35; }
    .doc-footer { margin-top: 10mm; padding-top: 4mm; border-top: 1px solid #e2e8f0; }
    .doc-footer-line { font-size: 8pt; color: #64748b; margin: 0 0 1mm; line-height: 1.35; }
`;

/** Email-safe letterhead (table layout). */
export function buildBusinessDocumentEmailLetterheadHtml(
  opts: BusinessDocumentLetterheadOpts = {}
): string {
  const locale = opts.locale ?? "en";
  const lines = formatLetterheadBlock(locale);
  const logo = opts.logoUrl?.trim()
    ? `<img src="${escapeHtml(opts.logoUrl.trim())}" alt="${escapeHtml(STORE_ENTITY.brandName)}" width="160" style="max-width:160px;height:auto;display:block;margin-bottom:12px;" />`
    : `<p style="margin:0 0 12px;font-size:18px;font-weight:600;color:#12463e;">${escapeHtml(STORE_ENTITY.brandName)}</p>`;

  const contactBits: string[] = [];
  if (opts.companyEmail?.trim()) contactBits.push(escapeHtml(opts.companyEmail.trim()));
  if (opts.companyPhone?.trim()) contactBits.push(escapeHtml(opts.companyPhone.trim()));

  return `${logo}
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#12463e;line-height:1.35;">${escapeHtml(lines[0] ?? "")}</p>
<p style="margin:0 0 2px;font-size:12px;color:#64748b;line-height:1.4;">${escapeHtml(lines[1] ?? "")}</p>
<p style="margin:0 0 2px;font-size:12px;color:#64748b;line-height:1.4;">${escapeHtml(lines[2] ?? "")}</p>
<p style="margin:0 0 8px;font-size:12px;font-weight:500;color:#12463e;line-height:1.4;">${escapeHtml(lines[3] ?? "")}</p>
${
  contactBits.length
    ? `<p style="margin:0 0 16px;font-size:12px;color:#64748b;">${contactBits.join(" · ")}</p>`
    : `<div style="margin-bottom:16px;"></div>`
}
<hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;" />`;
}

/** Email-safe store footer. */
export function buildBusinessDocumentEmailFooterHtml(locale: LegalLocale = "en"): string {
  const lines = formatStoreTrustBlock(locale);
  return `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;">
  ${lines
    .map(
      (line) =>
        `<p style="margin:0 0 4px;font-size:11px;color:#94a3b8;line-height:1.4;">${escapeHtml(line)}</p>`
    )
    .join("\n  ")}
</div>`;
}
