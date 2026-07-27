import { toPng } from "html-to-image";

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
