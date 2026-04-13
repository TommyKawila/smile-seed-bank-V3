import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";

const SETTINGS_KEY = "logo_secondary_png_url";

/** Optional dev fallback if Brand Settings URL is unset (PNG with transparency). */
export const WATERMARK_FALLBACK_FILE = path.join(
  process.cwd(),
  "public",
  "assets",
  "logo-watermark.png"
);

/** Inset from bottom-right so marks stay visible under `object-fit: cover` / rounded cards. */
const PADDING_PX = 80;
/** Slightly under 12% so size stays balanced with larger safe zone. */
const WIDTH_RATIO = 0.11;

/** Logo alpha multiplier before composite (0–1). ~0.7–0.8 reads premium / non-intrusive. */
export const WATERMARK_OPACITY = 0.7;

/** Multiply PNG alpha channel (Sharp has no `modulate({ opacity })` for raster overlays). */
async function applyPngOpacity(pngBuffer: Buffer, opacity: number): Promise<Buffer> {
  const o = Math.max(0, Math.min(1, opacity));
  const { data, info } = await sharp(pngBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels !== 4 || !info.width || !info.height) {
    return pngBuffer;
  }

  const buf = Buffer.from(data);
  for (let i = 3; i < buf.length; i += 4) {
    buf[i] = Math.round(buf[i]! * o);
  }

  return sharp(buf, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
}

/** Refresh DB URL periodically so Boss logo changes apply without redeploy. */
const SETTINGS_CACHE_MS = 60_000;
/** Reuse fetched PNG bytes when URL unchanged (avoid Supabase fetch every upload). */
const LOGO_BYTES_CACHE_MS = 5 * 60_000;

type SettingsCache = { url: string | null; expires: number };
type BytesCache = { url: string; buffer: Buffer; expires: number };

let settingsCache: SettingsCache | null = null;
let bytesCache: BytesCache | null = null;

async function getSecondaryLogoUrlFromDb(): Promise<string | null> {
  const now = Date.now();
  if (settingsCache && now < settingsCache.expires) {
    return settingsCache.url;
  }
  try {
    const row = await prisma.site_settings.findUnique({
      where: { key: SETTINGS_KEY },
    });
    const raw = row?.value?.trim();
    const url =
      raw && /^https?:\/\//i.test(raw) ? raw : null;
    if (!url) {
      console.warn(
        `[watermark] ${SETTINGS_KEY} missing or invalid in site_settings — trying fallback file.`
      );
    }
    settingsCache = { url, expires: now + SETTINGS_CACHE_MS };
    return url;
  } catch (e) {
    console.error("[watermark] site_settings read failed:", e);
    settingsCache = { url: null, expires: now + SETTINGS_CACHE_MS };
    return null;
  }
}

async function fetchLogoBuffer(url: string): Promise<Buffer | null> {
  const now = Date.now();
  if (bytesCache && bytesCache.url === url && now < bytesCache.expires) {
    return bytesCache.buffer;
  }
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/png,image/webp,image/*" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      console.warn("[watermark] Logo fetch failed:", res.status, url.slice(0, 80));
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 32) {
      console.warn("[watermark] Logo response too small");
      return null;
    }
    bytesCache = { url, buffer: buf, expires: now + LOGO_BYTES_CACHE_MS };
    return buf;
  } catch (e) {
    console.warn("[watermark] Logo fetch error:", e);
    return null;
  }
}

async function resolveWatermarkLogoBuffer(): Promise<Buffer | null> {
  const dbUrl = await getSecondaryLogoUrlFromDb();
  if (dbUrl) {
    const fromRemote = await fetchLogoBuffer(dbUrl);
    if (fromRemote) return fromRemote;
  }
  try {
    return await fs.readFile(WATERMARK_FALLBACK_FILE);
  } catch {
    console.warn(
      `[watermark] No usable logo (set ${SETTINGS_KEY} in Brand Settings or add ${WATERMARK_FALLBACK_FILE}).`
    );
    return null;
  }
}

export type WatermarkResult = {
  buffer: Buffer;
  /** True when logo was composited and output is WebP. */
  watermarked: boolean;
};

/**
 * Composite brand logo bottom-right; output WebP when successful.
 * Logo: `site_settings.logo_secondary_png_url` (cached fetch) → optional local fallback PNG.
 */
export async function applyWatermark(imageBuffer: Buffer): Promise<WatermarkResult> {
  const logoBuf = await resolveWatermarkLogoBuffer();
  if (!logoBuf) {
    return { buffer: imageBuffer, watermarked: false };
  }

  try {
    const base = sharp(imageBuffer).rotate();
    const meta = await base.metadata();
    const iw = meta.width ?? 0;
    const ih = meta.height ?? 0;
    if (iw < 80 || ih < 80) {
      return { buffer: imageBuffer, watermarked: false };
    }

    const maxWmByImage = Math.max(24, iw - 2 * PADDING_PX);
    const targetW = Math.min(
      Math.round(iw * WIDTH_RATIO),
      maxWmByImage
    );

    const wmPngRaw = await sharp(logoBuf)
      .resize({
        width: targetW,
        fit: "inside",
        withoutEnlargement: true,
      })
      .ensureAlpha()
      .png()
      .toBuffer();

    const wmPng = await applyPngOpacity(wmPngRaw, WATERMARK_OPACITY);

    const wmMeta = await sharp(wmPng).metadata();
    const ww = wmMeta.width ?? 0;
    const wh = wmMeta.height ?? 0;
    const left = Math.max(0, iw - ww - PADDING_PX);
    const top = Math.max(0, ih - wh - PADDING_PX);

    const out = await base
      .composite([{ input: wmPng, left, top }])
      .webp({ quality: 88, effort: 4 })
      .toBuffer();
    return { buffer: out, watermarked: true };
  } catch (e) {
    console.error("[watermark] apply failed:", e);
    return { buffer: imageBuffer, watermarked: false };
  }
}

/** Replace file extension with `.webp` (storage key after successful WebP output). */
export function storagePathAsWebp(objectPath: string): string {
  const trimmed = objectPath.replace(/\.[^/.]+$/, "");
  return `${trimmed}.webp`;
}
