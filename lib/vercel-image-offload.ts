/**
 * Use `unoptimized` only when Next/Image cannot fetch or decode the source (data/blob URLs).
 * Remote assets (e.g. Supabase Storage) should stay optimized so `/_next/image` can emit AVIF/WebP.
 */
export function shouldOffloadImageOptimization(src: string | null | undefined): boolean {
  if (src == null || src === "") return true;
  const s = String(src).trim();
  return s.startsWith("data:") || s.startsWith("blob:");
}

/** Diagnostic / workaround: `NEXT_PUBLIC_PRODUCT_IMAGE_UNOPTIMIZED=true` bypasses Vercel optimizer for product gallery `<Image>`. */
export function productGalleryBypassOptimizer(): boolean {
  const v = process.env.NEXT_PUBLIC_PRODUCT_IMAGE_UNOPTIMIZED?.trim().toLowerCase();
  return v === "true" || v === "1";
}

export function productGalleryImageUnoptimized(src: string | null | undefined): boolean {
  return shouldOffloadImageOptimization(src) || productGalleryBypassOptimizer();
}
