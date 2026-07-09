import { escapeHtmlPlainForEmail } from "@/lib/business-document-template";
import { BUSINESS_DOCUMENT_SUBJECT } from "@/types/business-document";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Transactional email wrapper — muted Eco-Clinical palette. */
export function buildBusinessDocumentEmailHtml(
  bodyText: string,
  logoUrl: string | null
): string {
  const safeBody = escapeHtmlPlainForEmail(bodyText);
  const logo = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="Smile Seed Bank" width="180" style="max-width:180px;height:auto;display:block;margin-bottom:20px;" />`
    : `<p style="margin:0 0 20px;font-size:18px;font-weight:600;color:#12463e;">Smile Seed Bank</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:system-ui,sans-serif;color:#1e293b;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:28px 32px;">
    ${logo}
    <div style="font-size:15px;line-height:1.22;color:#334155;white-space:pre-wrap;word-wrap:break-word;">${safeBody}</div>
    <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
      Sent via Smile Seed Bank Admin · ${escapeHtml(BUSINESS_DOCUMENT_SUBJECT)}
    </p>
  </div>
</body>
</html>`;
}
