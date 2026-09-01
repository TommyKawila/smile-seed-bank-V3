"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  GF_CLAIM_MAX_FILE_BYTES,
  GF_CLAIM_MAX_FILES,
  type GfClaimUploadCategory,
  type GfClaimUploadedFile,
} from "@/lib/gf-seed-claim-form";
import { ClaimField } from "./ClaimFormPrimitives";

function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function ClaimEvidenceUpload({
  label,
  required,
  category,
  claimSessionId,
  files,
  onChange,
  t,
  error,
}: {
  label: string;
  required?: boolean;
  category: GfClaimUploadCategory;
  claimSessionId: string;
  files: GfClaimUploadedFile[];
  onChange: (next: GfClaimUploadedFile[]) => void;
  t: (th: string, en: string) => string;
  error?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const remaining = GF_CLAIM_MAX_FILES - files.length;

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;
    if (picked.length > remaining) {
      setUploadError(
        t(`อัปโหลดได้สูงสุด ${GF_CLAIM_MAX_FILES} ไฟล์`, `Maximum ${GF_CLAIM_MAX_FILES} files`)
      );
      return;
    }
    for (const f of picked) {
      if (f.size > GF_CLAIM_MAX_FILE_BYTES) {
        setUploadError(t("ไฟล์เกิน 10 MB", "File exceeds 10 MB limit"));
        return;
      }
    }
    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("claimSessionId", claimSessionId);
      form.append("category", category);
      for (const f of picked) form.append("files", f);
      const res = await fetch("/api/storefront/claim/seeds/upload", { method: "POST", body: form });
      const json = (await res.json()) as {
        ok?: boolean;
        files?: GfClaimUploadedFile[];
        error?: string;
      };
      if (!res.ok || !json.files) throw new Error(json.error ?? "Upload failed");
      onChange([...files, ...json.files]);
    } catch (err) {
      setUploadError(String(err).replace("Error: ", ""));
    } finally {
      setUploading(false);
    }
  };

  const remove = (id: string) => onChange(files.filter((f) => f.id !== id));

  return (
    <ClaimField label={label} required={required} error={error}>
      <p className="text-xs text-slate-500">
        {t(
          `รูปหรือวิดีโอ สูงสุด ${GF_CLAIM_MAX_FILES} ไฟล์ · 10 MB/ไฟล์`,
          `Images or videos · max ${GF_CLAIM_MAX_FILES} files · 10 MB each`
        )}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={onPick}
      />
      {files.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
              <span className="truncate pr-2">
                {f.name} · {formatBytes(f.sizeBytes)}
                {f.storage === "google_drive" ? " · Drive" : " · Supabase"}
              </span>
              <button type="button" onClick={() => remove(f.id)} className="text-slate-500 hover:text-red-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {remaining > 0 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {uploading ? t("กำลังอัปโหลด…", "Uploading…") : t("เลือกไฟล์", "Choose files")}
        </Button>
      ) : null}
      {uploadError ? <p className="mt-1 text-xs text-red-600">{uploadError}</p> : null}
    </ClaimField>
  );
}
