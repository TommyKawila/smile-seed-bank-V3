/**
 * Bypass Vercel `/_next/image` — quota returns HTTP 402 (`OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED`).
 * Serve remote assets (Supabase Storage, etc.) directly; keep optimizer off for data/blob too.
 */
export function shouldOffloadImageOptimization(src: string | null | undefined): boolean {
  if (src == null || src === "") return true;
  const s = String(src).trim();
  if (s.startsWith("data:") || s.startsWith("blob:")) return true;
  return s.startsWith("http://") || s.startsWith("https://");
}

/** Diagnostic / workaround: `NEXT_PUBLIC_PRODUCT_IMAGE_UNOPTIMIZED=true` bypasses Vercel optimizer for product gallery `<Image>`. */
export function productGalleryBypassOptimizer(): boolean {
  const v = process.env.NEXT_PUBLIC_PRODUCT_IMAGE_UNOPTIMIZED?.trim().toLowerCase();
  return v === "true" || v === "1";
}

export function productGalleryImageUnoptimized(src: string | null | undefined): boolean {
  return shouldOffloadImageOptimization(src) || productGalleryBypassOptimizer();
}
