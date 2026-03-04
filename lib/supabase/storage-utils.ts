import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.8,
  maxWidthOrHeight: 1200,
  fileType: "image/webp" as const,
  useWebWorker: true,
};

/**
 * Compresses (client-side) and uploads up to 5 product images via server API.
 * Returns an array of public CDN URLs.
 */
export async function processAndUploadImages(files: File[]): Promise<string[]> {
  const limited = files.slice(0, 5);
  const urls: string[] = [];

  for (const file of limited) {
    let processed: File | Blob = file;
    try {
      processed = await imageCompression(file, COMPRESSION_OPTIONS);
    } catch {
      // Fallback to original if compression fails
    }

    const formData = new FormData();
    formData.append("file", new File([processed], "upload.webp", { type: "image/webp" }));

    const res = await fetch("/api/admin/products/upload", {
      method: "POST",
      body: formData,
    });

    const json = await res.json() as { url?: string; error?: string };
    if (!res.ok || !json.url) throw new Error(`อัปโหลดล้มเหลว: ${json.error ?? res.status}`);

    urls.push(json.url);
  }

  return urls;
}
