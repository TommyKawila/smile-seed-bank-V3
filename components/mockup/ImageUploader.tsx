"use client";

import { useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMockup } from "@/components/mockup/MockupContext";
import { useToast } from "@/hooks/use-toast";

/** Compress large photos so they fit Vercel ~4.5MB body limit. */
async function prepareUploadFile(file: File): Promise<File> {
  const maxBytes = 3.5 * 1024 * 1024;
  if (file.size <= maxBytes && /^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
    return file;
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    if (file.size > maxBytes) {
      throw new Error(
        "Image is too large (>4MB). Use JPEG/PNG under 4MB (not HEIC)."
      );
    }
    return file;
  }

  const maxEdge = 2000;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85)
  );
  if (!blob) return file;

  const base = file.name.replace(/\.[^.]+$/, "") || "package";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

export function ImageUploader() {
  const { data, setField, uploading, setUploading } = useMockup();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const prepared = await prepareUploadFile(file);
      const form = new FormData();
      form.append("file", prepared);
      const res = await fetch("/api/admin/mockups/upload", {
        method: "POST",
        body: form,
      });
      const raw = await res.text();
      let body: { url?: string; error?: string } = {};
      try {
        body = raw ? (JSON.parse(raw) as typeof body) : {};
      } catch {
        throw new Error(
          res.status === 413
            ? "Image too large for server (max ~4MB). Compress and retry."
            : `Upload failed (HTTP ${res.status})`
        );
      }
      if (!res.ok || !body.url) {
        throw new Error(
          typeof body.error === "string" && body.error
            ? body.error
            : `Upload failed (HTTP ${res.status})`
        );
      }
      setField("bgImageUrl", body.url);
      toast({ title: "Package image uploaded" });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2 rounded-md border border-dashed border-slate-200 bg-slate-50/80 p-3">
      <div>
        <p className="text-xs font-semibold text-slate-700">Package photo</p>
        <p className="text-[11px] text-slate-500">
          Upload rear of 7 × 10 cm SSB pack. JPEG / PNG / WebP under ~4MB.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-1.5 h-4 w-4" />
          )}
          Upload package
        </Button>
        {data.bgImageUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setField("bgImageUrl", undefined)}
          >
            Clear
          </Button>
        ) : null}
      </div>
      {data.bgImageUrl ? (
        <p className="truncate text-[11px] text-emerald-600">Image ready — position sticker on preview</p>
      ) : null}
    </div>
  );
}
