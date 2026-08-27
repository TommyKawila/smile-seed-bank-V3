import { plainLetterBodyToHtml } from "@/lib/business-document-raw-format";
import {
  attachmentDisplayName,
  ATTACHMENT_IMAGE_EMAIL_STYLE,
  splitAttachmentUrls,
} from "@/lib/business-document-attachments";
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

function attachmentImagesBlock(urls: string[] | undefined): string {
  const list = (urls ?? []).map((u) => u?.trim()).filter(Boolean);
  if (list.length === 0) return "";
  return `<div style="margin:16px 0 8px;">${list
    .map(
      (url) =>
        `<p style="margin:0 0 12px;"><img src="${escapeHtml(url)}" alt="Attachment" style="${ATTACHMENT_IMAGE_EMAIL_STYLE}" /></p>`
    )
    .join("")}</div>`;
}

function attachmentPdfLinksBlock(urls: string[] | undefined): string {
  const list = (urls ?? []).map((u) => u?.trim()).filter(Boolean);
  if (list.length === 0) return "";
  return `<div style="margin:16px 0 8px;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#12463e;">PDF attachments</p>
    ${list
      .map(
        (url) =>
          `<p style="margin:0 0 6px;font-size:13px;"><a href="${escapeHtml(url)}" style="color:#12463e;text-decoration:underline;">${escapeHtml(attachmentDisplayName(url))}</a></p>`
      )
      .join("")}
  </div>`;
}

/** Transactional email wrapper — muted Eco-Clinical palette + formal letterhead. */
export function buildBusinessDocumentEmailHtml(
  bodyText: string,
  logoUrl: string | null,
  subject: string = BUSINESS_DOCUMENT_FALLBACK_SUBJECT,
  signatureImageUrl: string | null = null,
  letterheadOpts?: Omit<BusinessDocumentLetterheadOpts, "logoUrl">,
  attachmentImageUrls: string[] = []
): string {
  const bodyHtml = plainLetterBodyToHtml(bodyText);
  const { imageUrls, pdfUrls } = splitAttachmentUrls(attachmentImageUrls);
  const header = buildBusinessDocumentEmailLetterheadHtml({
    logoUrl,
    companyEmail: letterheadOpts?.companyEmail,
    companyPhone: letterheadOpts?.companyPhone,
    locale: letterheadOpts?.locale ?? "en",
    legalOverrides: letterheadOpts?.legalOverrides,
    includeStoreFooter: letterheadOpts?.includeStoreFooter,
  });
  const footer = buildBusinessDocumentEmailFooterHtml({
    locale: letterheadOpts?.locale ?? "en",
    legalOverrides: letterheadOpts?.legalOverrides,
    includeStoreFooter: letterheadOpts?.includeStoreFooter,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:system-ui,sans-serif;color:#1e293b;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:28px 32px;">
    ${header}
    <div style="font-size:15px;line-height:1.45;color:#334155;">
      ${bodyHtml}
      ${attachmentImagesBlock(imageUrls)}
      ${attachmentPdfLinksBlock(pdfUrls)}
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
