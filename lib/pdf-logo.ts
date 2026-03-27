import { SMILE_SEED_BANK_LOGO_BASE64 } from "./logo-base64";

export async function getBase64ImageFromURL(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return null;
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
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
