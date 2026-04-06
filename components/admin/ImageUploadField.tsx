"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import {
  uploadMagazineImage,
  uploadProductImage,
  validateMagazineImageOriginal,
  validateMagazineImageFile,
  MAGAZINE_ORIGINAL_MAX_BYTES,
} from "@/lib/supabase-upload";
import {
  compressImageForMagazineUpload,
  formatImageBytes,
} from "@/lib/image-optimizer";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Phase = "idle" | "optimizing" | "uploading";

export type ImageUploadFieldProps = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  label?: string;
  /** `magazine` bucket vs `product-images` bucket */
  uploadTarget?: "magazine" | "product";
  /** `product` = light strip for Product modal */
  variant?: "magazine" | "product";
  /** Default true; set false when adding many product images to avoid toast spam */
  toastOnSuccess?: boolean;
  /** Slightly smaller drop zone */
  compact?: boolean;
};

export function ImageUploadField({
  value,
  onChange,
  disabled,
  label = "Featured image",
  uploadTarget = "magazine",
  variant = "magazine",
  toastOnSuccess = true,
  compact = false,
}: ImageUploadFieldProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [lastCompressLine, setLastCompressLine] = useState<string | null>(null);

  const busy = phase !== "idle";
  const isProductUi = variant === "product";

  const runUpload = useCallback(
    async (file: File | null | undefined) => {
      if (!file || disabled) return;
      setLocalError(null);
      setLastCompressLine(null);

      const pre = validateMagazineImageOriginal(file);
      if (pre) {
        setLocalError(pre);
        return;
      }

      setPhase("optimizing");
      let compressed: File;
      let bytesBefore: number;
      let bytesAfter: number;
      try {
        const r = await compressImageForMagazineUpload(file);
        compressed = r.file;
        bytesBefore = r.bytesBefore;
        bytesAfter = r.bytesAfter;
      } catch (e) {
        setPhase("idle");
        setLocalError(e instanceof Error ? e.message : "Optimization failed");
        return;
      }

      const post = validateMagazineImageFile(compressed);
      if (post) {
        setPhase("idle");
        setLocalError(post);
        return;
      }

      const line = `Compressed: ${formatImageBytes(bytesBefore)} → ${formatImageBytes(bytesAfter)}`;
      setLastCompressLine(line);

      setPhase("uploading");
      try {
        const res =
          uploadTarget === "product"
            ? await uploadProductImage(compressed)
            : await uploadMagazineImage(compressed);
        if ("error" in res) {
          setLastCompressLine(null);
          setLocalError(res.error);
          return;
        }
        onChange(res.url);
        if (toastOnSuccess) {
          toast({
            title: uploadTarget === "product" ? "Product image uploaded" : "Image uploaded",
            description: line,
          });
        }
      } finally {
        setPhase("idle");
      }
    },
    [disabled, onChange, toast, toastOnSuccess, uploadTarget]
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    void runUpload(f);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (disabled || busy) return;
    const f = e.dataTransfer.files?.[0];
    void runUpload(f);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !busy) setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const trimmed = value.trim();

  const statusLabel =
    phase === "optimizing"
      ? "Optimizing…"
      : phase === "uploading"
        ? "Uploading…"
        : null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          className={cn(
            "text-xs font-medium uppercase tracking-wide",
            isProductUi ? "text-zinc-600" : "text-zinc-500"
          )}
        >
          {label}
        </label>
        <span
          className={cn("text-[11px]", isProductUi ? "text-zinc-500" : "text-zinc-600")}
        >
          PNG, JPG, WebP · source ≤{" "}
          {Math.round(MAGAZINE_ORIGINAL_MAX_BYTES / (1024 * 1024))}MB · optimized ~≤0.8MB
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        className="sr-only"
        disabled={disabled || busy}
        onChange={onPick}
      />

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => !busy && !disabled && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          "relative rounded-xl border border-dashed transition",
          isProductUi
            ? dragOver
              ? "border-primary bg-primary/5"
              : "border-zinc-200 bg-zinc-50 hover:border-primary/40"
            : dragOver
              ? "border-emerald-500/60 bg-emerald-500/5"
              : "border-zinc-700 bg-zinc-900/40",
          (disabled || busy) && "pointer-events-none opacity-60"
        )}
      >
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-3 px-4",
            compact ? "min-h-[100px] py-6" : "min-h-[140px] py-8"
          )}
        >
          {busy ? (
            <Loader2
              className={cn(
                "h-8 w-8 animate-spin",
                isProductUi ? "text-primary" : "text-emerald-500/80"
              )}
            />
          ) : (
            <ImagePlus
              className={cn("h-8 w-8", isProductUi ? "text-zinc-400" : "text-zinc-600")}
              strokeWidth={1.25}
            />
          )}
          <div
            className={cn(
              "text-center text-sm",
              isProductUi ? "text-zinc-600" : "text-zinc-400"
            )}
          >
            {statusLabel ? (
              <span className={isProductUi ? "font-medium text-zinc-800" : "text-zinc-200"}>
                {statusLabel}
              </span>
            ) : (
              <>
                <span className={isProductUi ? "text-zinc-800" : "text-zinc-200"}>
                  Drop an image here
                </span>
                <span className={isProductUi ? "text-zinc-400" : "text-zinc-600"}> · </span>
                <span className={isProductUi ? "text-primary" : "text-emerald-500/90"}>
                  or click to browse
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {localError && (
        <p
          className={cn("text-sm", isProductUi ? "text-red-600" : "text-red-400/90")}
          role="alert"
        >
          {localError}
        </p>
      )}

      {lastCompressLine && !localError && (
        <p
          className={cn("text-xs", isProductUi ? "text-emerald-700" : "text-emerald-500/80")}
        >
          {lastCompressLine}
        </p>
      )}

      {trimmed ? (
        <div
          className={cn(
            "relative mt-3 overflow-hidden rounded-xl border",
            isProductUi ? "border-zinc-200 bg-white" : "border-zinc-800 bg-zinc-900"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={trimmed}
            alt=""
            className="max-h-56 w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div
            className={cn(
              "flex items-center justify-between gap-2 border-t px-3 py-2",
              isProductUi ? "border-zinc-200 bg-zinc-50" : "border-zinc-800"
            )}
          >
            <p
              className={cn(
                "min-w-0 truncate text-xs",
                isProductUi ? "text-zinc-500" : "text-zinc-500"
              )}
              title={trimmed}
            >
              {trimmed}
            </p>
            <button
              type="button"
              disabled={disabled || busy}
              onClick={(e) => {
                e.stopPropagation();
                setLocalError(null);
                setLastCompressLine(null);
                onChange("");
              }}
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition disabled:opacity-50",
                isProductUi
                  ? "border-zinc-300 text-zinc-700 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                  : "border-zinc-700 text-zinc-300 hover:border-red-500/50 hover:bg-red-950/30 hover:text-red-300"
              )}
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
