import { toPng } from "html-to-image";

export type ExportImageFormat = "png" | "jpeg" | "pdf";

export async function domElementToPngBlob(
  el: HTMLElement,
  backgroundColor = "#020617"
): Promise<Blob | null> {
  try {
    const dataUrl = await toPng(el, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor,
      style: { fontFamily: "'Prompt', 'Inter', sans-serif" },
    });
    const res = await fetch(dataUrl);
    return res.blob();
  } catch {
    return null;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });
}

export async function pngBlobToJpegBlob(
  png: Blob,
  quality = 0.92
): Promise<Blob | null> {
  try {
    const dataUrl = await blobToDataUrl(png);
    const img = await loadImage(dataUrl);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
    );
    return blob;
  } catch {
    return null;
  }
}

export async function pngBlobToPdfBlob(png: Blob): Promise<Blob | null> {
  try {
    const dataUrl = await blobToDataUrl(png);
    const img = await loadImage(dataUrl);
    const wPx = img.naturalWidth;
    const hPx = img.naturalHeight;
    const wMm = (wPx / 96) * 25.4;
    const hMm = (hPx / 96) * 25.4;
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: wPx > hPx ? "landscape" : "portrait",
      unit: "mm",
      format: [wMm, hMm],
    });
    pdf.addImage(dataUrl, "PNG", 0, 0, wMm, hMm);
    return pdf.output("blob");
  } catch {
    return null;
  }
}

/** Direct browser download — no native share sheet */
export function downloadBlob(blob: Blob, filename: string): boolean {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

export async function exportDomElementAsFile(
  el: HTMLElement,
  format: ExportImageFormat,
  baseFilename: string,
  backgroundColor = "#f8fafc"
): Promise<boolean> {
  const png = await domElementToPngBlob(el, backgroundColor);
  if (!png) return false;

  const safe = baseFilename.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-");

  if (format === "png") {
    return downloadBlob(png, `${safe}.png`);
  }

  if (format === "jpeg") {
    const jpeg = await pngBlobToJpegBlob(png);
    if (!jpeg) return false;
    return downloadBlob(jpeg, `${safe}.jpg`);
  }

  const pdf = await pngBlobToPdfBlob(png);
  if (!pdf) return false;
  return downloadBlob(pdf, `${safe}.pdf`);
}

export async function saveOrSharePngBlob(
  blob: Blob,
  filename: string,
  shareTitle: string
): Promise<"shared" | "downloaded" | "cancelled" | "failed"> {
  const file = new File([blob], filename, { type: "image/png" });
  const shareData: ShareData = { files: [file], title: shareTitle };

  if (navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    }
  }

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return "downloaded";
  } catch {
    return "failed";
  }
}
