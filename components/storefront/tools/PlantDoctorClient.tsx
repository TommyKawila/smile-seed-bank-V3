"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { GrowerToolShell } from "@/components/storefront/tools/GrowerToolShell";
import { GrowerToolsAiDisabledNotice } from "@/components/storefront/tools/GrowerToolsAiDisabledNotice";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const MAX_BYTES = 4 * 1024 * 1024;

export function PlantDoctorClient({ aiEnabled = true }: { aiEnabled?: boolean }) {
  const { t, locale } = useLanguage();
  const isEn = locale === "en";
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const onFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("เลือกไฟล์รูปภาพเท่านั้น", "Images only"));
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(t("ไฟล์ใหญ่เกิน 4MB", "Max 4MB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      setPreview(dataUrl);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const clear = () => {
    setPreview(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    if (!preview) {
      toast.message(t("ถ่ายรูปหรืออัปโหลดก่อน", "Add a photo first"));
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/storefront/grower-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "plant-doctor",
          payload: {
            image: preview,
            symptoms: symptoms.trim() || undefined,
            locale: isEn ? "en" : "th",
          },
        }),
      });
      const json = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) {
        if (json.error === "ai_disabled") {
          throw new Error(
            t("โหมด AI ถูกปิดชั่วคราว", "AI mode is temporarily disabled")
          );
        }
        throw new Error(json.error ?? "Request failed");
      }
      setResult(json.text ?? "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <GrowerToolShell
      title={t("วิเคราะห์อาการ", "Plant Doctor")}
      subtitle={t(
        "ถ่ายรูปหรืออัปโหลด — AI วิเคราะห์เบื้องต้น (ไม่เก็บรูป)",
        "Snap or upload — AI triage (image not stored)"
      )}
    >
      <div className="space-y-6">
        {!aiEnabled ? <GrowerToolsAiDisabledNotice /> : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="min-h-12 gap-2"
            onClick={() => fileRef.current?.click()}
          >
            <Camera className="h-5 w-5" />
            {t("ถ่ายรูป / เลือกไฟล์", "Camera / upload")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-12 gap-2"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-5 w-5" />
            {t("อัปโหลด", "Upload")}
          </Button>
        </div>

        {preview ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-zinc-900">
            <Image src={preview} alt="" fill className="object-contain" unoptimized />
            <button
              type="button"
              className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white"
              onClick={clear}
              aria-label={t("ลบรูป", "Remove image")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="symptoms">{t("อาการเพิ่มเติม (ถ้ามี)", "Symptoms (optional)")}</Label>
          <Input
            id="symptoms"
            className="min-h-12"
            placeholder={t("เช่น ใบเหลืองปลาย", "e.g. yellow leaf tips")}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
        </div>

        <Button
          type="button"
          disabled={loading || !preview || !aiEnabled}
          className="min-h-12 w-full bg-emerald-600 hover:bg-emerald-500"
          onClick={() => void submit()}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            t("วิเคราะห์", "Analyze")
          )}
        </Button>

        {result ? (
          <div className="whitespace-pre-wrap rounded-xl border border-border bg-card/60 p-5 text-sm leading-relaxed">
            {result}
          </div>
        ) : null}
      </div>
    </GrowerToolShell>
  );
}
