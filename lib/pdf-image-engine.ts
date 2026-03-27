const MAX_DIM = 2048;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

async function rasterizeSrcToPng(imageSrc: string): Promise<string | null> {
  const img = await loadImage(imageSrc);
  const nw = img.naturalWidth || img.width;
  const nh = img.naturalHeight || img.height;
  if (!nw || !nh) return null;

  const scale = Math.min(1, MAX_DIM / Math.max(nw, nh));
  const w = Math.max(1, Math.round(nw * scale));
  const h = Math.max(1, Math.round(nh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/png");
}

/**
 * Fetch an image URL and return a PNG data URI (browser only).
 * SVG/WebP and other formats are rasterized via canvas for @react-pdf/renderer.
 */
export async function resolveImageToPng(url: string): Promise<string | null> {
  if (!url?.trim()) return null;
  if (typeof window === "undefined" || typeof document === "undefined") return null;

  let normalized = url.trim();
  if (normalized.startsWith("/")) {
    normalized = `${window.location.origin}${normalized}`;
  }

  let objectUrl: string | null = null;
  try {
    let imageSrc = normalized;
    if (!normalized.startsWith("data:")) {
      const response = await fetch(normalized, { mode: "cors", credentials: "omit" });
      if (!response.ok) return null;
      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);
      imageSrc = objectUrl;
    }
    return await rasterizeSrcToPng(imageSrc);
  } catch (e) {
    console.error("PDF Image Engine Error:", e);
    return null;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
