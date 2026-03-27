/**
 * Normalize breeder / asset URLs for Next/Image and browsers.
 * - Absolute http(s) URLs are returned as-is.
 * - Paths like `/storage/v1/object/public/...` get the project Supabase origin prepended.
 * - Bucket-relative paths like `brand-assets/foo.png` become full public object URLs.
 */
export function resolvePublicAssetUrl(
  src: string | null | undefined
): string | null {
  if (src == null) return null;
  const s = String(src).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;

  const base =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "") ?? ""
      : "";

  if (!base) {
    return s.startsWith("/") ? s : null;
  }

  if (s.startsWith("/storage/v1/object/public/")) {
    return `${base}${s}`;
  }

  const path = s.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${path}`;
}
