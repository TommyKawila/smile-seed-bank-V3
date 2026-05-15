/**
 * Use `unoptimized` only when Next/Image cannot fetch or decode the source (data/blob URLs).
 * Remote assets (e.g. Supabase Storage) should stay optimized so `/_next/image` can emit AVIF/WebP.
 */
export function shouldOffloadImageOptimization(src: string | null | undefined): boolean {
  if (src == null || src === "") return true;
  const s = String(src).trim();
  return s.startsWith("data:") || s.startsWith("blob:");
}
