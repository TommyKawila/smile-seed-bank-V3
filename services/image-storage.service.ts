/**
 * Download external product images and re-upload to Supabase Storage (server-side).
 * Fails gracefully: returns the original URL when download or upload is not possible.
 */

import { createAdminClient } from "@/lib/supabase/server";

/** Matches admin product uploads; override with SUPABASE_STORAGE_PRODUCTS_BUCKET if your bucket is named e.g. `products`. */
const BUCKET =
  process.env.SUPABASE_STORAGE_PRODUCTS_BUCKET?.trim() || "product-images";

const MAX_BYTES = 15 * 1024 * 1024;

function sanitizeFolder(folder: string): string {
  const s = folder
    .trim()
    .replace(/\\/g, "/")
    .split("/")
    .filter((p) => p && p !== ".." && p !== ".")
    .join("/")
    .replace(/[^a-zA-Z0-9/_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
  return s || "ai-import";
}

function extFromMime(contentType: string | null): string {
  const c = (contentType || "").toLowerCase().split(";")[0].trim();
  if (c === "image/jpeg" || c === "image/jpg") return "jpg";
  if (c === "image/png") return "png";
  if (c === "image/webp") return "webp";
  if (c === "image/gif") return "gif";
  return "jpg";
}

function extFromUrl(url: string): string | null {
  try {
    const path = new URL(url).pathname;
    const m = path.match(/\.(jpe?g|png|webp|gif)$/i);
    if (!m) return null;
    const e = m[1].toLowerCase();
    return e === "jpeg" ? "jpg" : e;
  } catch {
    return null;
  }
}

function sniffImageMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") return "image/webp";
  if (buf.slice(0, 3).toString() === "GIF") return "image/gif";
  return null;
}

function mimeToExt(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

/**
 * Fetch an image from a public URL and store it under the given folder path in Storage.
 * @returns Public URL on success, or the original `externalUrl` on any failure (403, timeout, upload error).
 * @returns `null` only when `externalUrl` is empty or not an http(s) URL.
 */
export async function localizeImage(
  externalUrl: string,
  folder: string
): Promise<string | null> {
  const original = externalUrl?.trim();
  if (!original || !/^https?:\/\//i.test(original)) {
    return null;
  }

  try {
    const res = await fetch(original, {
      redirect: "follow",
      headers: { "User-Agent": "SmileSeedBank-ImageImporter/1.0" },
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      console.warn("[localizeImage] HTTP", res.status, original.slice(0, 80));
      return original;
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 32 || buf.length > MAX_BYTES) {
      console.warn("[localizeImage] size rejected:", buf.length);
      return original;
    }

    let contentType = res.headers.get("content-type")?.split(";")[0].trim() ?? "";
    if (!contentType.startsWith("image/")) {
      const sniffed = sniffImageMime(buf);
      if (sniffed) contentType = sniffed;
      else {
        console.warn("[localizeImage] not recognized as image:", original.slice(0, 80));
        return original;
      }
    }

    const extFromPath = extFromUrl(original);
    const ext =
      extFromPath ||
      mimeToExt(contentType) ||
      extFromMime(contentType);

    const safeFolder = sanitizeFolder(folder);
    const key = `${safeFolder}/import-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const supabase = await createAdminClient();
    const { error } = await supabase.storage.from(BUCKET).upload(key, buf, {
      contentType,
      upsert: true,
      cacheControl: "31536000",
    });

    if (error) {
      console.warn("[localizeImage] storage:", error.message);
      return original;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
    return data.publicUrl;
  } catch (e) {
    console.warn("[localizeImage]", e);
    return original;
  }
}
