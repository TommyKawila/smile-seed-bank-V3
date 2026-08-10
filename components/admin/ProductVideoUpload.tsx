"use client";

import { useRef, useState } from "react";
import { Loader2, Music, Trash2, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  PRODUCT_VIDEO_ACCEPT,
  PRODUCT_VIDEO_BG_AUDIO_ACCEPT,
  PRODUCT_VIDEO_BG_AUDIO_MAX_BYTES,
  PRODUCT_VIDEO_MAX_DURATION_SEC,
  PRODUCT_VIDEO_OUTPUT_MAX_BYTES,
  PRODUCT_VIDEO_SOURCE_MAX_BYTES,
  compressProductVideo,
  validateProductVideoBackgroundAudio,
  validateProductVideoSource,
} from "@/lib/product-video-compress";
import { uploadProductVideo } from "@/lib/supabase-upload";
import { formatImageBytes } from "@/lib/image-optimizer";
import { resolvePublicAssetUrl } from "@/lib/public-storage-url";

export function ProductVideoUpload({
  videoUrl,
  onChange,
  disabled = false,
}: {
  videoUrl: string | null | undefined;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [muteOriginal, setMuteOriginal] = useState(true);
  const [bgAudio, setBgAudio] = useState<File | null>(null);
  const [bgPreviewUrl, setBgPreviewUrl] = useState<string | null>(null);

  const preview = videoUrl?.trim() ? resolvePublicAssetUrl(videoUrl.trim()) : null;

  const setBgFile = (file: File | null) => {
    if (bgPreviewUrl) URL.revokeObjectURL(bgPreviewUrl);
    setBgAudio(file);
    setBgPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleFile = async (file: File) => {
    const err = validateProductVideoSource(file);
    if (err) {
      toast({ variant: "destructive", title: err });
      return;
    }
    if (bgAudio) {
      const bgErr = validateProductVideoBackgroundAudio(bgAudio);
      if (bgErr) {
        toast({ variant: "destructive", title: bgErr });
        return;
      }
    }
    setBusy(true);
    setStatus("กำลังเตรียม…");
    try {
      const compressed = await compressProductVideo(
        file,
        setStatus,
        { muteOriginal, backgroundAudio: bgAudio }
      );
      setStatus("กำลังอัปโหลด…");
      const up = await uploadProductVideo(compressed);
      if ("error" in up) throw new Error(up.error);
      onChange(up.url);
      toast({
        title: "อัปโหลดวิดีโอแล้ว",
        description: `${formatImageBytes(compressed.size)} · สูงสุด ${PRODUCT_VIDEO_MAX_DURATION_SEC}s / 720p${
          bgAudio ? " · มีเสียงประกอบ" : muteOriginal ? " · ไม่มีเสียงต้นฉบับ" : " · เก็บเสียงต้นฉบับ"
        }`,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "อัปโหลดวิดีโอไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
      setStatus(null);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-violet-200/80 bg-violet-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
          <Video className="h-4 w-4 text-violet-700" />
          คลิปสั้น (1 คลิป)
        </Label>
        {preview ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || busy}
            onClick={() => onChange(null)}
            className="h-8 gap-1 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            ลบวิดีโอ
          </Button>
        ) : null}
      </div>
      <p className="text-[11px] text-zinc-500">
        MP4 / MOV จาก iPhone · บีบอัตโนมัติ ≤720p · ≤{PRODUCT_VIDEO_MAX_DURATION_SEC}s · ≤
        {Math.round(PRODUCT_VIDEO_OUTPUT_MAX_BYTES / (1024 * 1024))}MB · ต้นฉบับ ≤
        {Math.round(PRODUCT_VIDEO_SOURCE_MAX_BYTES / (1024 * 1024))}MB
      </p>

      <div className="space-y-2 rounded-lg border border-violet-100 bg-white/70 p-3">
        <div className="flex items-start gap-3">
          <Switch
            id="product-video-mute"
            checked={muteOriginal}
            disabled={disabled || busy}
            onCheckedChange={setMuteOriginal}
          />
          <div className="space-y-0.5">
            <Label htmlFor="product-video-mute" className="cursor-pointer text-xs font-medium text-zinc-800">
              ปิดเสียงต้นฉบับในคลิป
            </Label>
            <p className="text-[10px] text-zinc-500">
              ตัดเสียงจากวิดีโอที่อัปโหลด · ถ้าใส่เสียงประกอบจะใช้เสียงนั้นแทน
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1 text-xs font-medium text-zinc-800">
            <Music className="h-3.5 w-3.5 text-violet-600" />
            เสียงประกอบ (ไม่บังคับ)
          </Label>
          <p className="text-[10px] text-zinc-500">
            MP3 / M4A · ≤{Math.round(PRODUCT_VIDEO_BG_AUDIO_MAX_BYTES / (1024 * 1024))}MB · ผสมตอนบีบวิดีโอ
          </p>
          {bgPreviewUrl ? (
            <div className="flex flex-wrap items-center gap-2">
              <audio src={bgPreviewUrl} controls className="h-8 max-w-full" preload="metadata" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || busy}
                className="h-7 gap-1 text-xs text-zinc-600"
                onClick={() => setBgFile(null)}
              >
                <Trash2 className="h-3 w-3" />
                ลบเสียง
              </Button>
            </div>
          ) : null}
          <input
            ref={bgInputRef}
            type="file"
            accept={PRODUCT_VIDEO_BG_AUDIO_ACCEPT}
            className="sr-only"
            disabled={disabled || busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const err = validateProductVideoBackgroundAudio(f);
              if (err) {
                toast({ variant: "destructive", title: err });
                e.target.value = "";
                return;
              }
              setBgFile(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || busy}
            className="h-8 gap-1.5 text-xs"
            onClick={() => bgInputRef.current?.click()}
          >
            <Music className="h-3.5 w-3.5" />
            {bgAudio ? "เปลี่ยนเสียงประกอบ" : "เลือกเสียงประกอบ"}
          </Button>
        </div>
      </div>

      <div className="relative aspect-video overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950">
        {preview ? (
          <video
            src={preview}
            className="h-full w-full object-contain"
            controls
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="flex h-full min-h-[8rem] flex-col items-center justify-center gap-2 text-zinc-400">
            <Video className="h-8 w-8 opacity-60" />
            <span className="text-xs">ยังไม่มีคลิป</span>
          </div>
        )}
        {busy ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-xs text-white">
            <Loader2 className="h-6 w-6 animate-spin" />
            {status ?? "กำลังประมวลผล…"}
          </div>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={PRODUCT_VIDEO_ACCEPT}
        className="sr-only"
        disabled={disabled || busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || busy}
        className="gap-1.5"
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {preview ? "เปลี่ยนคลิป" : "อัปโหลดคลิป"}
      </Button>
    </div>
  );
}
