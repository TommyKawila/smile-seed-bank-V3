import { compressImageForMagazineUpload } from "@/lib/image-optimizer";
import {
  validateMagazineImageFile,
  validateMagazineImageOriginal,
} from "@/lib/supabase-upload";

const BUCKET = "product-images";

export type ProcessUploadOptions = {
  /** @deprecated unused — kept for call-site compatibility */
  productKey?: string;
  replaceUrls?: (string | null | undefined)[];
  onPhase?: (phase: "compress" | "upload") => void;
};

/**
 * Compresses (1200px / ~0.8MB, same as Magazine CMS) and uploads via POST /api/admin/products/upload.
 */
export async function processAndUploadImages(
  files: File[],
  opts?: ProcessUploadOptions
): Promise<string[]> {
  const limited = files.slice(0, 5);
  const urls: string[] = [];
  const replaceUrls = opts?.replaceUrls ?? [];

  for (let i = 0; i < limited.length; i++) {
    const file = limited[i];
    opts?.onPhase?.("compress");

    const origErr = validateMagazineImageOriginal(file);
    if (origErr) {
      throw new Error(origErr);
    }

    let processed: File;
    try {
      const r = await compressImageForMagazineUpload(file);
      processed = r.file;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Compression failed");
    }

    const post = validateMagazineImageFile(processed);
    if (post) {
      throw new Error(post);
    }

    console.log("[product-image]", {
      name: file.name,
      originalBytes: file.size,
      compressedBytes: processed.size,
      originalType: file.type,
      outType: processed.type,
    });

    opts?.onPhase?.("upload");

    const formData = new FormData();
    formData.append("file", processed);

    const res = await fetch("/api/admin/products/upload", {
      method: "POST",
      body: formData,
    });

    const json = (await res.json()) as { url?: string; error?: string; sizeBytes?: number };
    if (!res.ok || !json.url) {
      throw new Error(`อัปโหลดล้มเหลว: ${json.error ?? res.status}`);
    }

    urls.push(json.url);

    const remove = replaceUrls[i];
    if (remove && typeof remove === "string") {
      const oldPath = publicProductImagePath(remove);
      const newPath = publicProductImagePath(json.url);
      if (oldPath && newPath && oldPath !== newPath) {
        try {
          const delRes = await fetch("/api/admin/storage/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bucketName: BUCKET, paths: [oldPath] }),
          });
          if (!delRes.ok) {
            const errBody = await delRes.json().catch(() => ({}));
            console.warn("[product-image] storage delete failed (non-fatal):", errBody?.error ?? delRes.status);
          }
        } catch (e) {
          console.warn("[product-image] storage delete request failed (non-fatal):", e);
        }
      }
    }
  }

  return urls;
}

/** Extract storage path inside bucket from Supabase public URL. */
export function publicProductImagePath(publicUrl: string): string | null {
  try {
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const i = publicUrl.indexOf(marker);
    if (i === -1) return null;
    return decodeURIComponent(publicUrl.slice(i + marker.length).split("?")[0] ?? "");
  } catch {
    return null;
  }
}
