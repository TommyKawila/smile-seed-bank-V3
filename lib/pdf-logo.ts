import { SMILE_SEED_BANK_LOGO_BASE64 } from "./logo-base64";

function arrayBufferToDataUrl(ab: ArrayBuffer, mime: string): string {
  const safeMime = mime.startsWith("image/") ? mime.split(";")[0].trim() : "image/png";
  const u8 = new Uint8Array(ab);
  let b64: string;
  if (typeof Buffer !== "undefined") {
    b64 = Buffer.from(ab).toString("base64");
  } else {
    let s = "";
    for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]!);
    b64 = btoa(s);
  }
  return `data:${safeMime};base64,${b64}`;
}

/** Works in Node (receipt API) and browser — no FileReader (not available server-side). */
export async function getBase64ImageFromURL(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    const mime = ct.split(";")[0].trim() || "image/png";
    const ab = await res.arrayBuffer();
    if (ab.byteLength < 8) return null;
    if (mime.startsWith("image/")) {
      return arrayBufferToDataUrl(ab, mime);
    }
    const u8 = new Uint8Array(ab);
    const isPng = u8[0] === 0x89 && u8[1] === 0x50;
    const isJpeg = u8[0] === 0xff && u8[1] === 0xd8;
    const isWebp = u8[0] === 0x52 && u8[1] === 0x49;
    if (!isPng && !isJpeg && !isWebp) return null;
    const guess = isJpeg ? "image/jpeg" : isWebp ? "image/webp" : "image/png";
    return arrayBufferToDataUrl(ab, guess);
  } catch {
    return null;
  }
}

export async function resolvePdfLogo(site: {
  logo_secondary_png_url?: string | null;
  logo_main_url?: string | null;
}): Promise<string | null> {
  const pngUrl = site.logo_secondary_png_url;
  if (pngUrl) {
    const base64 = await getBase64ImageFromURL(pngUrl);
    if (base64) return base64;
  }
  const mainUrl = site.logo_main_url;
  if (mainUrl) {
    if (typeof window !== "undefined") {
      console.warn(
        "[PDF] logo_secondary_png_url not set — using logo_main_url. For best PDF compatibility, add a PNG logo in Brand Settings."
      );
    }
    const base64 = await getBase64ImageFromURL(mainUrl);
    if (base64) return base64;
  }
  return SMILE_SEED_BANK_LOGO_BASE64;
}
