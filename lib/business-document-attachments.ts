export function isPdfAttachmentUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  if (!u) return false;
  try {
    return new URL(u).pathname.endsWith(".pdf");
  } catch {
    return u.includes(".pdf");
  }
}

export function attachmentDisplayName(url: string): string {
  try {
    const name = new URL(url).pathname.split("/").pop() ?? "attachment";
    return decodeURIComponent(name);
  } catch {
    return "attachment";
  }
}

export function splitAttachmentUrls(urls: string[]): {
  imageUrls: string[];
  pdfUrls: string[];
} {
  const imageUrls: string[] = [];
  const pdfUrls: string[] = [];
  for (const raw of urls) {
    const url = raw?.trim();
    if (!url) continue;
    if (isPdfAttachmentUrl(url)) pdfUrls.push(url);
    else imageUrls.push(url);
  }
  return { imageUrls, pdfUrls };
}

/** Tailwind classes for attachment images in on-screen document preview */
export const ATTACHMENT_IMAGE_PREVIEW_CLASS =
  "w-full max-h-[min(560px,75vh)] rounded border border-slate-200 object-contain";

/** Inline style for attachment images in outbound email HTML */
export const ATTACHMENT_IMAGE_EMAIL_STYLE =
  "display:block;width:100%;max-width:600px;max-height:560px;height:auto;object-fit:contain;border:1px solid #e2e8f0;border-radius:4px;";

/** CSS declarations for attachment images in print/PDF HTML */
export const ATTACHMENT_IMAGE_PRINT_CSS = `
    .doc-attach img {
      display: block;
      width: 100%;
      max-width: 170mm;
      max-height: 190mm;
      height: auto;
      object-fit: contain;
    }`;
