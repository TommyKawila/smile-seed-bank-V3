"use client";

import { useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMockup } from "@/components/mockup/MockupContext";
import { useToast } from "@/hooks/use-toast";

export function ImageUploader() {
  const { data, setField, uploading, setUploading } = useMockup();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/mockups/upload", {
        method: "POST",
        body: form,
      });
      const body = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !body.url) {
        throw new Error(body.error || "Upload failed");
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
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-600">Package background</p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
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
          Upload image
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
        <p className="truncate text-[11px] text-slate-400">{data.bgImageUrl}</p>
      ) : (
        <p className="text-[11px] text-slate-400">No background yet</p>
      )}
    </div>
  );
}
