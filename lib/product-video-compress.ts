"use client";

/** Reject iPhone originals before wasm transcode (memory guard). */
export const PRODUCT_VIDEO_SOURCE_MAX_BYTES = 100 * 1024 * 1024;

/** Target max after compression. */
export const PRODUCT_VIDEO_OUTPUT_MAX_BYTES = 12 * 1024 * 1024;

export const PRODUCT_VIDEO_MAX_DURATION_SEC = 30;

export const PRODUCT_VIDEO_ACCEPT =
  "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov";

export const PRODUCT_VIDEO_BG_AUDIO_ACCEPT =
  "audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-m4a,.mp3,.m4a,.aac,.wav";

export const PRODUCT_VIDEO_BG_AUDIO_MAX_BYTES = 5 * 1024 * 1024;

export type ProductVideoCompressOptions = {
  /** Strip original clip audio (default true). */
  muteOriginal?: boolean;
  /** Optional background track mixed into output MP4. */
  backgroundAudio?: File | null;
};

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

export function validateProductVideoBackgroundAudio(file: File): string | null {
  if (file.size > PRODUCT_VIDEO_BG_AUDIO_MAX_BYTES) {
    return "ไฟล์เสียงประกอบต้องไม่เกิน 5MB";
  }
  const type = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();
  const ok =
    type.startsWith("audio/") ||
    name.endsWith(".mp3") ||
    name.endsWith(".m4a") ||
    name.endsWith(".aac") ||
    name.endsWith(".wav");
  if (!ok) return "ใช้ MP3, M4A, AAC หรือ WAV เท่านั้น";
  return null;
}

function inputExt(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith(".mov")) return "mov";
  if (name.endsWith(".webm")) return "webm";
  return "mp4";
}

function bgAudioExt(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith(".m4a")) return "m4a";
  if (name.endsWith(".aac")) return "aac";
  if (name.endsWith(".wav")) return "wav";
  return "mp3";
}

const VIDEO_ENCODE = [
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
] as const;

function buildFfmpegArgs(
  inName: string,
  outName: string,
  opts: ProductVideoCompressOptions,
  bgName: string | null
): string[] {
  const mute = opts.muteOriginal !== false;
  const hasBg = Boolean(bgName);

  if (hasBg && bgName) {
    if (mute) {
      return [
        "-i",
        inName,
        "-i",
        bgName,
        ...VIDEO_ENCODE,
        "-map",
        "0:v",
        "-map",
        "1:a",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-shortest",
        outName,
      ];
    }
    return [
      "-i",
      inName,
      "-i",
      bgName,
      "-filter_complex",
      "[0:a]volume=1[a0];[1:a]volume=0.65[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=0[aout]",
      ...VIDEO_ENCODE,
      "-map",
      "0:v",
      "-map",
      "[aout]",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-shortest",
      outName,
    ];
  }

  if (mute) {
    return ["-i", inName, ...VIDEO_ENCODE, "-an", outName];
  }

  return [
    "-i",
    inName,
    ...VIDEO_ENCODE,
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    outName,
  ];
}

/**
 * Transcode to H.264 MP4 · max 720p · max 30s · optional mute / bg audio · faststart.
 */
export async function compressProductVideo(
  file: File,
  onProgress?: (message: string) => void,
  options: ProductVideoCompressOptions = {}
): Promise<File> {
  const v = validateProductVideoSource(file);
  if (v) throw new Error(v);

  const bg = options.backgroundAudio ?? null;
  if (bg) {
    const bgErr = validateProductVideoBackgroundAudio(bg);
    if (bgErr) throw new Error(bgErr);
  }

  onProgress?.("กำลังโหลดตัวบีบวิดีโอ…");
  const { fetchFile } = await import("@ffmpeg/util");
  const ffmpeg = await getFfmpeg();

  const inName = `input.${inputExt(file)}`;
  const outName = "output.mp4";
  const bgName = bg ? `bg.${bgAudioExt(bg)}` : null;

  onProgress?.(bg ? "กำลังบีบวิดีโอและผสมเสียง…" : "กำลังบีบวิดีโอ…");
  await ffmpeg.writeFile(inName, await fetchFile(file));
  if (bg && bgName) {
    await ffmpeg.writeFile(bgName, await fetchFile(bg));
  }

  await ffmpeg.exec(buildFfmpegArgs(inName, outName, options, bgName));

  const data = await ffmpeg.readFile(outName);
  await ffmpeg.deleteFile(inName);
  await ffmpeg.deleteFile(outName);
  if (bgName) await ffmpeg.deleteFile(bgName);

  const blob = new Blob([data as BlobPart], { type: "video/mp4" });
  if (blob.size > PRODUCT_VIDEO_OUTPUT_MAX_BYTES) {
    throw new Error(
      `วิดีโอหลังบีบยังใหญ่เกิน ${Math.round(PRODUCT_VIDEO_OUTPUT_MAX_BYTES / (1024 * 1024))}MB — ลองตัดให้สั้นลง`
    );
  }

  const stem = file.name.replace(/\.[^/.]+$/, "") || "product-video";
  return new File([blob], `${stem.slice(0, 60)}.mp4`, { type: "video/mp4" });
}
