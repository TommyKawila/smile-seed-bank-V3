/** Magazine CMS image uploads — shared validation + client upload helper. */

export const MAGAZINE_BUCKET = "magazine" as const;

/** Compressed uploads should stay at or under ~0.8MB; allow small margin for encoding. */
export const MAGAZINE_IMAGE_MAX_BYTES = Math.ceil(0.85 * 1024 * 1024);

/** Reject huge sources before running browser compression (memory / UX). */
export const MAGAZINE_ORIGINAL_MAX_BYTES = 20 * 1024 * 1024;

export const MAGAZINE_IMAGE_ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

function sanitizeOriginalFilename(name: string): string {
  const base = name.replace(/[^\w.-]+/g, "-").replace(/^-|-$/g, "");
  return base.slice(0, 120) || "image";
}

/** Object key under bucket `magazine`: `posts/{timestamp}-{sanitizedName}` (+ entropy for uniqueness). */
export function buildMagazineStoragePath(originalName: string): string {
  const safe = sanitizeOriginalFilename(originalName);
  return `posts/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safe}`;
}

/** Promotion pop-up images — always `.webp` after server encode. */
export function buildCampaignStoragePath(originalName: string): string {
  const stem = sanitizeOriginalFilename(originalName.replace(/\.[^/.]+$/, "") || originalName);
  return `promotions/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${stem}.webp`;
}

/** Object key under bucket `product-images` (Smile pipeline: optimized, lightweight). */
export function buildProductStoragePath(originalName: string): string {
  const safe = sanitizeOriginalFilename(originalName);
  return `products/optimized/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safe}`;
}

const allowedSet = new Set<string>(MAGAZINE_IMAGE_ALLOWED_TYPES);

/** Before optimization — type + upper size for raw file. */
export function validateMagazineImageOriginal(file: File): string | null {
  if (file.size > MAGAZINE_ORIGINAL_MAX_BYTES) {
    return "Image must be 20MB or smaller.";
  }
  if (!allowedSet.has(file.type)) {
    return "Use PNG, JPG, JPEG, or WebP.";
  }
  return null;
}

/** After optimization — type + max size for upload to storage. */
export function validateMagazineImageFile(file: File): string | null {
  if (file.size > MAGAZINE_IMAGE_MAX_BYTES) {
    return "Optimized image is still too large. Try a smaller source image.";
  }
  if (!allowedSet.has(file.type)) {
    return "Use PNG, JPG, JPEG, or WebP.";
  }
  return null;
}

/**
 * Upload from the browser (admin session via cookie; `/api/admin/*` is protected).
 */
export async function uploadMagazineImage(
  file: File,
  options?: { campaign?: boolean }
): Promise<{ url: string } | { error: string }> {
  const v = validateMagazineImageFile(file);
  if (v) return { error: v };

  const form = new FormData();
  form.append("file", file);
  if (options?.campaign) {
    form.append("upload_context", "campaign");
  }

  const headers: HeadersInit = {};
  if (options?.campaign) {
    headers["X-Upload-Type"] = "campaign";
  }

  const res = await fetch("/api/admin/magazine/upload", {
    method: "POST",
    body: form,
    headers,
  });

  const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
  if (!res.ok) {
    return { error: typeof data.error === "string" ? data.error : "Upload failed" };
  }
  if (!data.url || typeof data.url !== "string") {
    return { error: "Invalid upload response" };
  }
  return { url: data.url };
}

/**
 * Upload optimized product image to `product-images` (admin session via cookie).
 */
export async function uploadProductImage(
  file: File
): Promise<{ url: string } | { error: string }> {
  const v = validateMagazineImageFile(file);
  if (v) return { error: v };

  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/admin/products/upload", {
    method: "POST",
    body: form,
  });

  const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
  if (!res.ok) {
    return { error: typeof data.error === "string" ? data.error : "Upload failed" };
  }
  if (!data.url || typeof data.url !== "string") {
    return { error: "Invalid upload response" };
  }
  return { url: data.url };
}
