let cachedBase64: string | null = null;

function bufferToBase64(buf: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    bin += String.fromCharCode.apply(null, buf.subarray(i, i + chunk) as unknown as number[]);
  }
  return btoa(bin);
}

/**
 * Loads Prompt TTF once; server reads from disk, browser fetches from /public.
 * Avoids ~130k webpack-serialized string from inlined base64 modules.
 */
export async function loadPromptFontBase64ForJsPdf(): Promise<string> {
  if (cachedBase64) return cachedBase64;
  if (typeof window === "undefined") {
    const fs = require("node:fs") as typeof import("node:fs");
    const path = require("node:path") as typeof import("node:path");
    const fp = path.join(process.cwd(), "public", "fonts", "Prompt-Regular.ttf");
    cachedBase64 = fs.readFileSync(fp).toString("base64");
    return cachedBase64;
  }
  const res = await fetch("/fonts/Prompt-Regular.ttf");
  if (!res.ok) throw new Error(`Prompt font unavailable (${res.status})`);
  cachedBase64 = bufferToBase64(new Uint8Array(await res.arrayBuffer()));
  return cachedBase64;
}
