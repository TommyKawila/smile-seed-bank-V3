"use client";

import { useRef, useState } from "react";
import { Loader2, Trash2, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  PRODUCT_VIDEO_ACCEPT,
  PRODUCT_VIDEO_MAX_DURATION_SEC,
  PRODUCT_VIDEO_OUTPUT_MAX_BYTES,
  PRODUCT_VIDEO_SOURCE_MAX_BYTES,
  compressProductVideo,
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
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const preview = videoUrl?.trim() ? resolvePublicAssetUrl(videoUrl.trim()) : null;

  const handleFile = async (file: File) => {
    const err = validateProductVideoSource(file);
    if (err) {
      toast({ variant: "destructive", title: err });
      return;
    }
    setBusy(true);
    setStatus("กำลังเตรียม…");
    try {
      const compressed = await compressProductVideo(file, setStatus);
      setStatus("กำลังอัปโหลด…");
      const up = await uploadProductVideo(compressed);
      if ("error" in up) throw new Error(up.error);
      onChange(up.url);
      toast({
        title: "อัปโหลดวิดีโอแล้ว",
        description: `${formatImageBytes(compressed.size)} · สูงสุด ${PRODUCT_VIDEO_MAX_DURATION_SEC}s / 720p`,
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
    <div className="space-y-2 rounded-xl border border-violet-200/80 bg-violet-50/40 p-4">
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
