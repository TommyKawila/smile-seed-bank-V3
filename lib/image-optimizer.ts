import imageCompression from "browser-image-compression";

/** Magazine featured image — matches product pipeline style (WebP admin uses similar caps). */
export const MAGAZINE_IMAGE_COMPRESSION = {
  maxWidthOrHeight: 1200,
  maxSizeMB: 0.8,
  initialQuality: 0.8,
  useWebWorker: true,
} as const;

export type MagazineCompressResult = {
  file: File;
  bytesBefore: number;
  bytesAfter: number;
};

export function formatImageBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Resize + compress in the browser; returns a File suitable for Supabase upload.
 */
export async function compressImageForMagazineUpload(
  file: File
): Promise<MagazineCompressResult> {
  const bytesBefore = file.size;
  const out = await imageCompression(file, {
    maxSizeMB: MAGAZINE_IMAGE_COMPRESSION.maxSizeMB,
    maxWidthOrHeight: MAGAZINE_IMAGE_COMPRESSION.maxWidthOrHeight,
    initialQuality: MAGAZINE_IMAGE_COMPRESSION.initialQuality,
    useWebWorker: MAGAZINE_IMAGE_COMPRESSION.useWebWorker,
  });
  const bytesAfter = out.size;
  return { file: out, bytesBefore, bytesAfter };
}

/** Keeps PNG/WebP alpha; JPEG unchanged. */
export async function compressImageForCampaignUpload(
  file: File
): Promise<MagazineCompressResult> {
  const bytesBefore = file.size;
  const fileType =
    file.type === "image/png"
      ? ("image/png" as const)
      : file.type === "image/webp"
        ? ("image/webp" as const)
        : undefined;
  const out = await imageCompression(file, {
    maxSizeMB: MAGAZINE_IMAGE_COMPRESSION.maxSizeMB,
    maxWidthOrHeight: MAGAZINE_IMAGE_COMPRESSION.maxWidthOrHeight,
    initialQuality: MAGAZINE_IMAGE_COMPRESSION.initialQuality,
    useWebWorker: MAGAZINE_IMAGE_COMPRESSION.useWebWorker,
    ...(fileType ? { fileType } : {}),
  });
  const bytesAfter = out.size;
  return { file: out, bytesBefore, bytesAfter };
}
