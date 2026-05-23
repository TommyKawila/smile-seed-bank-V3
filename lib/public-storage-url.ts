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

/** Collapse duplicate path slashes (e.g. `https://host//storage/...`) without touching `https://`. */
function normalizeHttpsUrlSlashes(url: string): string {
  try {
    const u = new URL(url);
    const nextPath = u.pathname.replace(/\/{2,}/g, "/");
    if (nextPath !== u.pathname) u.pathname = nextPath;
    return u.href;
  } catch {
    return url.replace(/^(https?:\/\/[^/]+)\/+/, (_, origin: string) => `${origin}/`);
  }
}

export function resolvePublicAssetUrl(
  src: string | null | undefined
): string | null {
  if (src == null) return null;
  const s = String(src).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return normalizeHttpsUrlSlashes(s);

  const base = getSupabaseOrigin();

  if (s.startsWith("/storage/v1/object/public/")) {
    return normalizeHttpsUrlSlashes(`${base}${s}`);
  }

  const path = s.replace(/^\/+/, "");
  return normalizeHttpsUrlSlashes(`${base}/storage/v1/object/public/${path}`);
}

export type OptimizedAssetOptions = {
  width?: number;
  height?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
  format?: "webp" | "origin" | "avif";
};

const SUPABASE_OBJECT_PUBLIC = "/storage/v1/object/public/";
const SUPABASE_RENDER_PUBLIC = "/storage/v1/render/image/public/";

function clampDim(n: number): number {
  return Math.min(2500, Math.max(1, Math.round(n)));
}

function clampQuality(n: number): number {
  return Math.min(100, Math.max(20, Math.round(n)));
}

function isProjectSupabaseUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.origin === getSupabaseOrigin();
  } catch {
    return false;
  }
}

function isSupabaseStoragePath(pathname: string): boolean {
  return (
    pathname.includes(SUPABASE_OBJECT_PUBLIC) || pathname.includes(SUPABASE_RENDER_PUBLIC)
  );
}

function toSupabaseRenderPath(pathname: string): string {
  if (pathname.includes(SUPABASE_RENDER_PUBLIC)) return pathname;
  return pathname.replace(SUPABASE_OBJECT_PUBLIC, SUPABASE_RENDER_PUBLIC);
}

function optimizeExternalAssetUrl(url: string, options: OptimizedAssetOptions): string {
  try {
    const u = new URL(url);
    if (u.hostname === "images.unsplash.com") {
      if (options.width != null) u.searchParams.set("w", String(clampDim(options.width)));
      if (options.height != null) u.searchParams.set("h", String(clampDim(options.height)));
      if (options.quality != null) u.searchParams.set("q", String(clampQuality(options.quality)));
      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "crop");
    }
    return u.href;
  } catch {
    return url;
  }
}

/** Supabase Storage render URL (Vercel `/_next/image` bypass) — falls back to raw URL when no dimensions. */
export function resolveOptimizedAssetUrl(
  src: string | null | undefined,
  options: OptimizedAssetOptions = {}
): string | null {
  const resolved = resolvePublicAssetUrl(src);
  if (!resolved) return null;
  if (options.width == null && options.height == null) return resolved;

  if (!isProjectSupabaseUrl(resolved) || !isSupabaseStoragePath(new URL(resolved).pathname)) {
    return optimizeExternalAssetUrl(resolved, options);
  }

  try {
    const u = new URL(resolved);
    u.pathname = toSupabaseRenderPath(u.pathname);
    u.search = "";
    if (options.width != null) u.searchParams.set("width", String(clampDim(options.width)));
    if (options.height != null) u.searchParams.set("height", String(clampDim(options.height)));
    if (options.quality != null) u.searchParams.set("quality", String(clampQuality(options.quality)));
    if (options.resize) u.searchParams.set("resize", options.resize);
    u.searchParams.set("format", options.format ?? "webp");
    return u.href;
  } catch {
    return resolved;
  }
}
