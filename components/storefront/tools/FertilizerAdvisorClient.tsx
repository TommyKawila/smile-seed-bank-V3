"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { GrowerToolShell } from "@/components/storefront/tools/GrowerToolShell";
import { GrowerToolsAiDisabledNotice } from "@/components/storefront/tools/GrowerToolsAiDisabledNotice";
import { FertilizerResultInfographic } from "@/components/storefront/tools/FertilizerResultInfographic";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GROW_STAGES, type GrowStage } from "@/lib/grower-tools";
import {
  FERTILIZER_MEDIA,
  isOrganicAllowedForMedium,
  resolveFertilizerType,
  type FertilizerAnalysis,
  type FertilizerBuyLink,
  type FertilizerMedium,
  type FertilizerType,
} from "@/lib/fertilizer-advisor";

type FertilizerResult = {
  analysis: FertilizerAnalysis;
  buyLinks: FertilizerBuyLink[];
};

export function FertilizerAdvisorClient({ aiEnabled = true }: { aiEnabled?: boolean }) {
  const { t, locale } = useLanguage();
  const isEn = locale === "en";
  const [stage, setStage] = useState<GrowStage>("veg");
  const [medium, setMedium] = useState<FertilizerMedium>("soil");
  const [type, setType] = useState<FertilizerType>("organic");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FertilizerResult | null>(null);

  const organicAllowed = isOrganicAllowedForMedium(medium);
  const effectiveType = resolveFertilizerType(medium, type);

  useEffect(() => {
    if (!organicAllowed && type === "organic") {
      setType("synthetic");
    }
  }, [organicAllowed, type]);

  const onMediumChange = (value: FertilizerMedium) => {
    setMedium(value);
    setResult(null);
    if (!isOrganicAllowedForMedium(value)) {
      setType("synthetic");
    }
  };

  const submit = async () => {
    setLoading(true);
    setResult(null);
    const resolvedType = resolveFertilizerType(medium, type);
    try {
      const res = await fetch("/api/storefront/grower-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fertilizer",
          payload: {
            stageId: stage,
            type: resolvedType,
            medium,
            locale: isEn ? "en" : "th",
          },
        }),
      });
      const json = (await res.json()) as {
        analysis?: FertilizerAnalysis;
        buyLinks?: FertilizerBuyLink[];
        error?: string;
      };
      if (!res.ok) {
        if (json.error === "ai_disabled") {
          throw new Error(
            t("โหมด AI ถูกปิดชั่วคราว", "AI mode is temporarily disabled")
          );
        }
        throw new Error(json.error ?? "Request failed");
      }
      if (!json.analysis) throw new Error(json.error ?? "No analysis");
      setResult({
        analysis: json.analysis,
        buyLinks: json.buyLinks ?? [],
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <GrowerToolShell
      title={t("แนะนำปุ๋ย", "Fertilizer Advisor")}
      subtitle={t(
        "เลือกช่วงปลูกและสื่อปลูก — AI แนะนำแนว feeding",
        "Pick stage and medium — AI feeding guidance"
      )}
    >
      <div className="space-y-6">
        {!aiEnabled ? <GrowerToolsAiDisabledNotice /> : null}
        <div className="space-y-2">
          <Label>{t("ช่วงการปลูก", "Grow stage")}</Label>
          <Select value={stage} onValueChange={(v) => setStage(v as GrowStage)}>
            <SelectTrigger className="min-h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GROW_STAGES.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {isEn ? s.labelEn : s.labelTh}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("สื่อปลูก", "Medium")}</Label>
          <Select value={medium} onValueChange={(v) => onMediumChange(v as FertilizerMedium)}>
            <SelectTrigger className="min-h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FERTILIZER_MEDIA.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {isEn ? m.labelEn : m.labelTh}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("ประเภทปุ๋ย", "Fertilizer type")}</Label>
          <Select
            value={effectiveType}
            onValueChange={(v) => setType(v as FertilizerType)}
            disabled={!organicAllowed}
          >
            <SelectTrigger className="min-h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {organicAllowed ? (
                <SelectItem value="organic">{t("ออแกนิค", "Organic")}</SelectItem>
              ) : null}
              <SelectItem value="synthetic">{t("สังเคราะห์ (เคมี)", "Synthetic")}</SelectItem>
            </SelectContent>
          </Select>
          {!organicAllowed ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t(
                "โคโค / RDWC / Rockwool ใช้ปุ๋ยเคมีเพียว (สังเคราะห์) เท่านั้น — ดินทั่วไปใช้ Biobizz (ไม่ใช่ super soil)",
                "Coco / RDWC / rockwool = synthetic only — regular soil uses Biobizz (not super soil)"
              )}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          disabled={loading || !aiEnabled}
          className="min-h-12 w-full bg-emerald-600 hover:bg-emerald-500"
          onClick={() => void submit()}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            t("ขอคำแนะนำ", "Get advice")
          )}
        </Button>
        {result ? (
          <FertilizerResultInfographic
            analysis={result.analysis}
            buyLinks={result.buyLinks}
          />
        ) : null}
      </div>
    </GrowerToolShell>
  );
}
