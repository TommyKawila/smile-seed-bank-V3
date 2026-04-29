"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LogoUploadCard({
  title,
  description,
  settingKey,
  accept,
  currentUrl,
  onSaved,
  onClear,
}: {
  title: string | React.ReactNode;
  description: string;
  settingKey: string;
  accept: string;
  currentUrl?: string;
  onSaved: (key: string, url: string) => Promise<void>;
  onClear?: (key: string) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(currentUrl ?? null);
  }, [currentUrl]);

  const handleFile = async (file: File) => {
    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", settingKey);

      const res = await fetch("/api/admin/settings/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json() as { url?: string; error?: string };

      if (!res.ok || !json.url) throw new Error(json.error ?? "อัปโหลดล้มเหลว");

      setPreview(`${json.url}?t=${Date.now()}`);
      await onSaved(settingKey, json.url);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-zinc-500">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="relative flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 transition-colors hover:border-primary/60"
          onClick={() => inputRef.current?.click()}
        >
          {preview ? (
            <Image src={preview} alt={String(title)} fill className="object-contain p-4" unoptimized />
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-400">
              <ImageIcon className="h-8 w-8 opacity-40" />
              <span className="text-xs font-medium">คลิกเพื่ออัปโหลด</span>
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            {preview ? "เปลี่ยนไฟล์" : "อัปโหลด"}
          </Button>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600"
              onClick={async () => {
                setPreview(null);
                await onClear?.(settingKey);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        {preview && (
          <p className="break-all text-[10px] leading-relaxed text-zinc-400">
            {preview.split("?")[0]}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
