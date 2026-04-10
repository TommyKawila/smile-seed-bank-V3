/**
 * Parse PNG / JPEG width+height from a data URL (browser + Node) for proportional layout (e.g. PDF logos).
 */

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/\s/g, "");
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(clean, "base64"));
  }
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function parsePngDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24) return null;
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) if (bytes[i] !== sig[i]) return null;
  const w = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  const h = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
  return w > 0 && h > 0 ? { width: w, height: h } : null;
}

function parseJpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  let i = 0;
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  i = 2;
  while (i < bytes.length - 8) {
    if (bytes[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = bytes[i + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      i += 2;
      continue;
    }
    if (marker === 0xda) break;
    const segLen = (bytes[i + 2] << 8) | bytes[i + 3];
    if (segLen < 2 || i + 2 + segLen > bytes.length) break;
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const h = (bytes[i + 5] << 8) | bytes[i + 6];
      const w = (bytes[i + 7] << 8) | bytes[i + 8];
      return w > 0 && h > 0 ? { width: w, height: h } : null;
    }
    i += 2 + segLen;
  }
  return null;
}

export function getImageDimensionsFromDataUrl(dataUrl: string): { width: number; height: number } | null {
  const m = dataUrl.match(/base64,(.+)/);
  if (!m?.[1]) return null;
  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(m[1]);
  } catch {
    return null;
  }
  if (bytes.length < 24) return null;
  const png = parsePngDimensions(bytes);
  if (png) return png;
  return parseJpegDimensions(bytes);
}
