/**
 * PDF logo pipeline: delegates rasterization to `pdf-image-engine`, maps failures to a safe fallback.
 */

import { resolveImageToPng } from "@/lib/pdf-image-engine";

/** 1×1 transparent PNG — avoids invalid-format crashes when conversion fails */
export const TRANSPARENT_PNG_DATA_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

/**
 * Fetch an image URL and return a PNG data URI for @react-pdf/renderer.
 * On conversion failure returns a tiny transparent PNG (never null) so export does not abort.
 */
export async function resolveImageForPdf(src: string | null | undefined): Promise<string | undefined> {
  if (!src?.trim()) return undefined;
  const png = await resolveImageToPng(src.trim());
  return png ?? TRANSPARENT_PNG_DATA_URI;
}

/** Pre-resolve store + breeder logos to PNG data URIs before `pdf()`. */
export async function resolvePdfLogos(input: {
  mainUrl?: string | null;
  breederUrl?: string | null;
}): Promise<{ logoMainSrc: string | undefined; breederLogoSrc: string | undefined }> {
  const [logoMainSrc, breederLogoSrc] = await Promise.all([
    resolveImageForPdf(input.mainUrl),
    resolveImageForPdf(input.breederUrl),
  ]);
  return { logoMainSrc, breederLogoSrc };
}
