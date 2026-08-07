import { plainLetterBodyToHtml } from "@/lib/business-document-raw-format";
import {
  buildBusinessDocumentEmailFooterHtml,
  buildBusinessDocumentEmailLetterheadHtml,
  type BusinessDocumentLetterheadOpts,
} from "@/lib/business-document-letterhead";
import { BUSINESS_DOCUMENT_FALLBACK_SUBJECT } from "@/types/business-document";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function signatureImageBlock(signatureImageUrl: string | null): string {
  if (!signatureImageUrl?.trim()) return "";
  return `<p style="margin:8px 0 0;"><img src="${escapeHtml(signatureImageUrl.trim())}" alt="Signature" width="160" style="max-height:72px;width:auto;height:auto;display:block;" /></p>`;
}

/** Transactional email wrapper — muted Eco-Clinical palette + formal letterhead. */
export function buildBusinessDocumentEmailHtml(
  bodyText: string,
  logoUrl: string | null,
  subject: string = BUSINESS_DOCUMENT_FALLBACK_SUBJECT,
  signatureImageUrl: string | null = null,
  letterheadOpts?: Omit<BusinessDocumentLetterheadOpts, "logoUrl">
): string {
  const bodyHtml = plainLetterBodyToHtml(bodyText);
  const header = buildBusinessDocumentEmailLetterheadHtml({
    logoUrl,
    companyEmail: letterheadOpts?.companyEmail,
    companyPhone: letterheadOpts?.companyPhone,
    locale: letterheadOpts?.locale ?? "en",
  });
  const footer = buildBusinessDocumentEmailFooterHtml(letterheadOpts?.locale ?? "en");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:system-ui,sans-serif;color:#1e293b;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:28px 32px;">
    ${header}
    <div style="font-size:15px;line-height:1.45;color:#334155;">
      ${bodyHtml}
      ${signatureImageBlock(signatureImageUrl)}
    </div>
    ${footer}
    <p style="margin:16px 0 0;font-size:11px;color:#cbd5e1;">
      Sent via Smile Seed Bank Admin · ${escapeHtml(subject)}
    </p>
  </div>
</body>
</html>`;
}
