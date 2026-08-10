"use client";

/** Reject iPhone originals before wasm transcode (memory guard). */
export const PRODUCT_VIDEO_SOURCE_MAX_BYTES = 100 * 1024 * 1024;

/** Target max after compression. */
export const PRODUCT_VIDEO_OUTPUT_MAX_BYTES = 12 * 1024 * 1024;

export const PRODUCT_VIDEO_MAX_DURATION_SEC = 30;

export const PRODUCT_VIDEO_ACCEPT =
  "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov";

const FFMPEG_CORE_VERSION = "0.12.10";
const FFMPEG_CORE_BASE = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;

let ffmpegLoadPromise: Promise<import("@ffmpeg/ffmpeg").FFmpeg> | null = null;

async function getFfmpeg(): Promise<import("@ffmpeg/ffmpeg").FFmpeg> {
  if (!ffmpegLoadPromise) {
    ffmpegLoadPromise = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { toBlobURL } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return ffmpeg;
    })();
  }
  return ffmpegLoadPromise;
}

export function validateProductVideoSource(file: File): string | null {
  if (file.size > PRODUCT_VIDEO_SOURCE_MAX_BYTES) {
    return "วิดีโอต้องไม่เกิน 100MB";
  }
  const type = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();
  const ok =
    type.startsWith("video/") ||
    name.endsWith(".mp4") ||
    name.endsWith(".webm") ||
    name.endsWith(".mov");
  if (!ok) return "ใช้ MP4, WebM หรือ MOV (iPhone) เท่านั้น";
  return null;
}

function inputExt(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith(".mov")) return "mov";
  if (name.endsWith(".webm")) return "webm";
  return "mp4";
}

/**
 * Transcode to H.264 MP4 · max 720p height · max 30s · no audio · faststart.
 */
export async function compressProductVideo(
  file: File,
  onProgress?: (message: string) => void
): Promise<File> {
  const v = validateProductVideoSource(file);
  if (v) throw new Error(v);

  onProgress?.("กำลังโหลดตัวบีบวิดีโอ…");
  const { fetchFile } = await import("@ffmpeg/util");
  const ffmpeg = await getFfmpeg();

  const inName = `input.${inputExt(file)}`;
  const outName = "output.mp4";

  onProgress?.("กำลังบีบวิดีโอ…");
  await ffmpeg.writeFile(inName, await fetchFile(file));
  await ffmpeg.exec([
    "-i",
    inName,
    "-t",
    String(PRODUCT_VIDEO_MAX_DURATION_SEC),
    "-vf",
    "scale=-2:720",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "28",
    "-movflags",
    "+faststart",
    "-an",
    outName,
  ]);

  const data = await ffmpeg.readFile(outName);
  await ffmpeg.deleteFile(inName);
  await ffmpeg.deleteFile(outName);

  const blob = new Blob([data as BlobPart], { type: "video/mp4" });
  if (blob.size > PRODUCT_VIDEO_OUTPUT_MAX_BYTES) {
    throw new Error(
      `วิดีโอหลังบีบยังใหญ่เกิน ${Math.round(PRODUCT_VIDEO_OUTPUT_MAX_BYTES / (1024 * 1024))}MB — ลองตัดให้สั้นลง`
    );
  }

  const stem = file.name.replace(/\.[^/.]+$/, "") || "product-video";
  return new File([blob], `${stem.slice(0, 60)}.mp4`, { type: "video/mp4" });
}
