import sharp from "sharp";

export interface ImagePreset {
  width: number;
  quality: number;
  maxFileSizeKB: number;
}

export const IMAGE_PRESETS = {
  hero: { width: 2560, quality: 85, maxFileSizeKB: 500 } satisfies ImagePreset,
  product: { width: 1200, quality: 85, maxFileSizeKB: 150 } satisfies ImagePreset,
  logo: { width: 512, quality: 85, maxFileSizeKB: 50 } satisfies ImagePreset,
} as const;

export type ImagePresetName = keyof typeof IMAGE_PRESETS;

const MIN_QUALITY = 40;
const QUALITY_STEP = 5;

function isPresetName(s: string): s is ImagePresetName {
  return s === "hero" || s === "product" || s === "logo";
}

/**
 * Resize to max width (aspect ratio preserved, no upscale), output WebP.
 * Lowers quality by QUALITY_STEP until under maxFileSizeKB or MIN_QUALITY.
 */
export async function optimizeImage(
  buffer: Buffer,
  presetName: ImagePresetName
): Promise<Buffer> {
  const preset = IMAGE_PRESETS[presetName];
  const maxBytes = preset.maxFileSizeKB * 1024;

  const run = (quality: number) =>
    sharp(buffer)
      .rotate()
      .resize({
        width: preset.width,
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({ quality })
      .toBuffer();

  let quality = preset.quality;
  let out = await run(quality);

  while (out.length > maxBytes && quality > MIN_QUALITY) {
    quality -= QUALITY_STEP;
    out = await run(quality);
  }

  return out;
}

export { isPresetName };
