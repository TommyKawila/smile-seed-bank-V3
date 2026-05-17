/**
 * Normalize breeder / asset URLs for Next/Image and browsers.
 * - Absolute http(s) URLs are returned as-is.
 * - Paths like `/storage/v1/object/public/...` get the project Supabase origin prepended.
 * - Bucket-relative paths like `brand-assets/foo.png` become full public object URLs.
 */

/** Production project API/storage origin when `NEXT_PUBLIC_SUPABASE_URL` is unset or invalid (e.g. Vercel env drift). */
export const PUBLIC_SUPABASE_FALLBACK_ORIGIN = "https://jysdfxxilyjmjdmhazbu.supabase.co";

function getSupabaseOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  if (raw) {
    try {
      return new URL(raw).origin.replace(/\/+$/, "");
    } catch {
      /* ignore invalid env */
    }
  }
  return PUBLIC_SUPABASE_FALLBACK_ORIGIN.replace(/\/+$/, "");
}

export function resolvePublicAssetUrl(
  src: string | null | undefined
): string | null {
  if (src == null) return null;
  const s = String(src).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;

  const base = getSupabaseOrigin();

  if (s.startsWith("/storage/v1/object/public/")) {
    return `${base}${s}`;
  }

  const path = s.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${path}`;
}
