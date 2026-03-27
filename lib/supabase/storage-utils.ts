import imageCompression from "browser-image-compression";

const BUCKET = "product-images";

/** Client-side: max dimension, WebP @ 80%, target under ~1MB (library iterates toward maxSizeMB). */
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1200,
  initialQuality: 0.8,
  fileType: "image/webp" as const,
  useWebWorker: true,
};

export type ProcessUploadOptions = {
  /** Folder + naming: `products/product-{productKey}-{batchTs}-{i}.webp` */
  productKey: string;
  /** Per-file: delete this public URL after a successful upload (same index as files). */
  replaceUrls?: (string | null | undefined)[];
  onPhase?: (phase: "compress" | "upload") => void;
};

function sanitizeProductKey(raw: string): string {
  const s = raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return (s || "product").slice(0, 48);
}

/**
 * Compresses (client-side) and uploads images via POST /api/admin/products/upload.
 * Returns public CDN URLs.
 */
export async function processAndUploadImages(
  files: File[],
  opts?: ProcessUploadOptions
): Promise<string[]> {
  const limited = files.slice(0, 5);
  const urls: string[] = [];
  const productKey = sanitizeProductKey(opts?.productKey ?? "upload");
  const batchTs = Date.now();
  const replaceUrls = opts?.replaceUrls ?? [];

  for (let i = 0; i < limited.length; i++) {
    const file = limited[i];
    opts?.onPhase?.("compress");

    let processed: Blob = file;
    let outSize = file.size;
    try {
      processed = await imageCompression(file, COMPRESSION_OPTIONS);
      outSize = processed.size;
    } catch (e) {
      console.warn("[product-image] compression fallback to original attempt:", e);
      try {
        processed = await imageCompression(file, {
          ...COMPRESSION_OPTIONS,
          maxSizeMB: 1,
        });
        outSize = processed.size;
      } catch {
        /* last resort: still try upload as-is (server expects webp — may fail for HEIC) */
      }
    }

    const objectPath = `products/product-${productKey}-${batchTs}-${i}.webp`;
    const webpFile = new File([processed], objectPath.split("/").pop() ?? "upload.webp", {
      type: "image/webp",
    });

    console.log("[product-image]", {
      name: file.name,
      objectPath,
      originalBytes: file.size,
      compressedBytes: outSize,
      originalType: file.type,
    });

    opts?.onPhase?.("upload");

    const formData = new FormData();
    formData.append("file", webpFile);
    formData.append("objectPath", objectPath);

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
      if (oldPath && oldPath !== objectPath) {
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
