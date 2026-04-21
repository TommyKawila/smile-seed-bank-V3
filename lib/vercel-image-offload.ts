/**
 * Skip Vercel Image Optimization to stay within free-tier transformation limits.
 * Use with next/image `unoptimized={shouldOffloadImageOptimization(src)}`.
 *
 * Offloads: Supabase Storage URLs, local `/public` paths, data: and blob: URLs.
 */
export function shouldOffloadImageOptimization(src: string | null | undefined): boolean {
  if (src == null || src === "") return true;
  const s = String(src).trim();
  if (s.startsWith("data:") || s.startsWith("blob:")) return true;
  if (s.startsWith("/") && !s.startsWith("//")) return true;
  try {
    const u = new URL(s);
    if (/supabase\.co$/i.test(u.hostname) && u.pathname.includes("/storage/")) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
