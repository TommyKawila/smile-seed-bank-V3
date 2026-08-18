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
