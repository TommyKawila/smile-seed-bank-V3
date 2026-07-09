import type { BusinessDocumentFields } from "@/types/business-document";
import { BUSINESS_DOCUMENT_SUBJECT } from "@/types/business-document";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatBusinessDocumentDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function buildBusinessDocumentPlainText(fields: BusinessDocumentFields): string {
  const dateLabel = formatBusinessDocumentDate(fields.documentDate);
  const brand = fields.brandName.trim() || "Mellow Moon";
  const recipient = fields.recipientName.trim() || "Green Future Team";
  const sender = fields.senderName.trim() || "[Your Name]";

  return `${BUSINESS_DOCUMENT_SUBJECT}

${dateLabel}

Dear ${recipient},

Thank you for reaching out and providing the details regarding your legally produced cannabis seeds.

Smile Seed Bank is highly interested in partnering with you to supply fully certified (COA) seeds to our clients targeting GACP-standard cultivation licenses. Our objective is to source your genetics and white-label them under our own brand, "${brand}".

To move forward productively, we would like to clarify the following business terms:

COA Readiness & Compliance: Which specific strains on your list currently hold complete, batch-specific COAs that our clients can immediately use for their GACP cultivation license applications?

MOQ Flexibility: Regarding your Minimum Order Quantity of 1,000 seeds, can this volume be mixed across different strains, or is it strictly per single strain?

White-Label Authorization: We require confirmation that we have full authorization to rebrand and market these seeds under "${brand}" without any Plant Variety Protection (PVP) or intellectual property conflicts.

Germination Guarantee & Claims: For retail customers experiencing germination failures, if we provide documented proof that the issue stems from the seed viability, what is your policy for replacements? Can we claim replacement stock directly from Green Future?

Please let us know your standard protocols regarding these points, or provide a draft agreement if available.

Looking forward to your response.

Best regards,

${sender}
Founder, Smile Seed Bank`;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Patch dynamic field values in existing body text without wiping manual layout. */
export function syncFieldsInBodyText(
  bodyText: string,
  prev: BusinessDocumentFields,
  next: BusinessDocumentFields
): string {
  let out = bodyText;

  if (prev.recipientName !== next.recipientName) {
    const from = `Dear ${prev.recipientName},`;
    const to = `Dear ${next.recipientName},`;
    if (out.includes(from)) out = out.replace(from, to);
    else out = out.replace(/^Dear .+,$/m, to);
  }

  if (prev.brandName !== next.brandName && prev.brandName.trim()) {
    out = out.split(`"${prev.brandName}"`).join(`"${next.brandName}"`);
  }

  if (prev.documentDate !== next.documentDate) {
    const fromDate = formatBusinessDocumentDate(prev.documentDate);
    const toDate = formatBusinessDocumentDate(next.documentDate);
    if (out.includes(fromDate)) out = out.replace(fromDate, toDate);
  }

  if (prev.senderName !== next.senderName && prev.senderName.trim()) {
    const founderLine = "Founder, Smile Seed Bank";
    const block = new RegExp(
      `${escapeRegExp(prev.senderName)}\\s*\\n\\s*${escapeRegExp(founderLine)}`
    );
    if (block.test(out)) {
      out = out.replace(block, `${next.senderName}\n${founderLine}`);
    } else {
      out = out.replace(
        new RegExp(`^${escapeRegExp(prev.senderName)}\\s*$`, "m"),
        next.senderName
      );
    }
  }

  return out;
}

/** Print / email body — preserves spaces & line breaks via pre-wrap. */
export function escapeHtmlPlainForEmail(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildBusinessDocumentBodyBlockHtml(bodyText: string): string {
  return `<div class="doc-body">${escapeHtmlPlainForEmail(bodyText)}</div>`;
}

export function buildBusinessDocumentPrintHtmlFromBody(
  bodyText: string,
  logoUrl: string | null
): string {
  const body = buildBusinessDocumentBodyBlockHtml(bodyText);
  const logoBlock = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="Smile Seed Bank" class="doc-logo" />`
    : `<div class="doc-logo-fallback">Smile Seed Bank</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(BUSINESS_DOCUMENT_SUBJECT)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Inter, system-ui, sans-serif;
      font-size: 11pt;
      line-height: 1.22;
      color: #1e293b;
      background: #fff;
      padding: 18mm 20mm;
    }
    @page { size: A4; margin: 18mm 20mm; }
    @media print {
      body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    .doc-header { margin-bottom: 10mm; padding-bottom: 6mm; border-bottom: 1px solid #e2e8f0; }
    .doc-logo { max-height: 14mm; max-width: 55mm; object-fit: contain; object-position: left center; }
    .doc-logo-fallback { font-size: 14pt; font-weight: 600; color: #12463e; letter-spacing: 0.02em; }
    .doc-body {
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.22;
      tab-size: 4;
    }
  </style>
</head>
<body>
  <header class="doc-header">${logoBlock}</header>
  ${body}
</body>
</html>`;
}

export function buildBusinessDocumentLetterHtml(fields: BusinessDocumentFields): string {
  const dateLabel = escapeHtml(formatBusinessDocumentDate(fields.documentDate));
  const brand = escapeHtml(fields.brandName.trim() || "Mellow Moon");
  const recipient = escapeHtml(fields.recipientName.trim() || "Green Future Team");
  const sender = escapeHtml(fields.senderName.trim() || "[Your Name]");
  const subject = escapeHtml(BUSINESS_DOCUMENT_SUBJECT);

  return `
    <p class="doc-subject">${subject}</p>
    <p class="doc-date">${dateLabel}</p>
    <p>Dear ${recipient},</p>
    <p>Thank you for reaching out and providing the details regarding your legally produced cannabis seeds.</p>
    <p>Smile Seed Bank is highly interested in partnering with you to supply fully certified (COA) seeds to our clients targeting GACP-standard cultivation licenses. Our objective is to source your genetics and white-label them under our own brand, &ldquo;${brand}&rdquo;.</p>
    <p>To move forward productively, we would like to clarify the following business terms:</p>
    <p><strong>COA Readiness &amp; Compliance:</strong> Which specific strains on your list currently hold complete, batch-specific COAs that our clients can immediately use for their GACP cultivation license applications?</p>
    <p><strong>MOQ Flexibility:</strong> Regarding your Minimum Order Quantity of 1,000 seeds, can this volume be mixed across different strains, or is it strictly per single strain?</p>
    <p><strong>White-Label Authorization:</strong> We require confirmation that we have full authorization to rebrand and market these seeds under &ldquo;${brand}&rdquo; without any Plant Variety Protection (PVP) or intellectual property conflicts.</p>
    <p><strong>Germination Guarantee &amp; Claims:</strong> For retail customers experiencing germination failures, if we provide documented proof that the issue stems from the seed viability, what is your policy for replacements? Can we claim replacement stock directly from Green Future?</p>
    <p>Please let us know your standard protocols regarding these points, or provide a draft agreement if available.</p>
    <p>Looking forward to your response.</p>
    <p class="doc-signoff">Best regards,</p>
    <p class="doc-signature">${sender}<br>Founder, Smile Seed Bank</p>
  `.trim();
}

export function buildBusinessDocumentPrintHtml(
  fields: BusinessDocumentFields,
  logoUrl: string | null
): string {
  const letter = buildBusinessDocumentLetterHtml(fields);
  const logoBlock = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="Smile Seed Bank" class="doc-logo" />`
    : `<div class="doc-logo-fallback">Smile Seed Bank</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(BUSINESS_DOCUMENT_SUBJECT)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Inter, system-ui, sans-serif;
      font-size: 11pt;
      line-height: 1.2;
      color: #1e293b;
      background: #fff;
      padding: 18mm 20mm;
    }
    @page { size: A4; margin: 18mm 20mm; }
    @media print {
      body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    .doc-header { margin-bottom: 10mm; padding-bottom: 6mm; border-bottom: 1px solid #e2e8f0; }
    .doc-logo { max-height: 14mm; max-width: 55mm; object-fit: contain; object-position: left center; }
    .doc-logo-fallback { font-size: 14pt; font-weight: 600; color: #12463e; letter-spacing: 0.02em; }
    .doc-subject { font-size: 12pt; font-weight: 600; color: #12463e; margin-bottom: 4mm; line-height: 1.25; }
    .doc-date { font-size: 10pt; color: #64748b; margin-bottom: 8mm; }
    p { margin-bottom: 4mm; line-height: 1.22; }
    .doc-signoff { margin-top: 6mm; margin-bottom: 2mm; }
    .doc-signature { font-weight: 500; color: #0f172a; line-height: 1.35; }
  </style>
</head>
<body>
  <header class="doc-header">${logoBlock}</header>
  ${letter}
</body>
</html>`;
}
