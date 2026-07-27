"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, Package, PackageX } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { GrowerToolShell } from "@/components/storefront/tools/GrowerToolShell";
import { GrowerToolsAiDisabledNotice } from "@/components/storefront/tools/GrowerToolsAiDisabledNotice";
import { SoilMixResultInfographic } from "@/components/storefront/tools/SoilMixResultInfographic";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SOIL_MATERIAL_OPTIONS } from "@/lib/grower-tools";
import {
  computeSoilPotTarget,
  formatLiters,
  formatPotSizeLabel,
  formatVolumeDual,
  litersToGallons,
  normalizeVolumeAmount,
  potSizeToLiters,
  type PotVolumeUnit,
  type SoilMixAnalysis,
  type SoilMixBuyLink,
  type SuperSoilRecipeMode,
} from "@/lib/soil-mixer";
import {
  soilTermBaseSoil,
  soilTermSuperSoil,
} from "@/lib/soil-mixer-terms";
import { SOIL_MATERIAL_ICONS, SOIL_SECTION_ICONS } from "@/lib/soil-mixer-icons";
import { parseGrowerToolApiError } from "@/lib/grower-tool-api-errors";
import { cn } from "@/lib/utils";

type SoilMixResult = {
  analysis: SoilMixAnalysis;
  buyLinks: SoilMixBuyLink[];
};

type SoilMixApiPayload = {
  potTarget: {
    potLiters: number;
    potCount: number;
    totalFillLiters: number;
    superSoilLiters: number;
    baseSoilLiters: number;
  };
  materials: { id: string; label: string; amount?: string }[];
  locale: "th" | "en";
  recipeMode: SuperSoilRecipeMode;
};

type Props = { aiEnabled?: boolean };

type MaterialsChoice = "unset" | "have" | "none";

export function SoilMixerClient({ aiEnabled = true }: Props) {
  const { t, locale } = useLanguage();
  const isEn = locale === "en";
  const [step, setStep] = useState<1 | 2>(1);
  const [potSize, setPotSize] = useState("12");
  const [potUnit, setPotUnit] = useState<PotVolumeUnit>("L");
  const [potCount, setPotCount] = useState("4");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [amountUnits, setAmountUnits] = useState<Record<string, PotVolumeUnit>>({});
  const [notes, setNotes] = useState("");
  const [materialsChoice, setMaterialsChoice] = useState<MaterialsChoice>("unset");
  const [materialsModalOpen, setMaterialsModalOpen] = useState(false);
  const [recipeMode, setRecipeMode] = useState<SuperSoilRecipeMode>("basic");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SoilMixResult | null>(null);
  const [lastPayload, setLastPayload] = useState<SoilMixApiPayload | null>(null);
  const resultAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!result) return;
    const id = window.requestAnimationFrame(() => {
      resultAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [result]);

  const potTarget = useMemo(() => {
    const size = Number(potSize);
    const count = Number(potCount);
    if (!Number.isFinite(size) || size <= 0 || !Number.isFinite(count) || count <= 0) {
      return null;
    }
    const potLiters = potSizeToLiters(size, potUnit);
    return computeSoilPotTarget(potLiters, Math.floor(count));
  }, [potSize, potUnit, potCount]);

  const switchPotUnit = (next: PotVolumeUnit) => {
    if (next === potUnit) return;
    const n = Number(potSize);
    if (Number.isFinite(n) && n > 0) {
      if (potUnit === "L" && next === "gal") {
        setPotSize(formatLiters(litersToGallons(n)));
      } else if (potUnit === "gal" && next === "L") {
        setPotSize(formatLiters(potSizeToLiters(n, "gal")));
      }
    }
    setPotUnit(next);
  };

  const selectedMaterialCount = useMemo(
    () => SOIL_MATERIAL_OPTIONS.filter((m) => selected[m.id]).length,
    [selected]
  );

  const chooseHaveMaterials = () => {
    setMaterialsChoice("have");
    setMaterialsModalOpen(true);
    setResult(null);
  };

  const chooseNoMaterials = () => {
    setMaterialsChoice("none");
    setMaterialsModalOpen(false);
    setSelected({});
    setAmounts({});
    setNotes("");
    setResult(null);
  };

  const toggle = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
    setAmountUnits((prev) => (prev[id] ? prev : { ...prev, [id]: "L" }));
  };

  const switchAmountUnit = (id: string, next: PotVolumeUnit) => {
    const cur = amountUnits[id] ?? "L";
    if (cur === next) return;
    const n = Number(amounts[id]);
    if (Number.isFinite(n) && n > 0) {
      if (cur === "L" && next === "gal") {
        setAmounts((prev) => ({ ...prev, [id]: formatLiters(litersToGallons(n)) }));
      } else if (cur === "gal" && next === "L") {
        setAmounts((prev) => ({
          ...prev,
          [id]: formatLiters(potSizeToLiters(n, "gal")),
        }));
      }
    }
    setAmountUnits((prev) => ({ ...prev, [id]: next }));
  };

  const goToStep2 = () => {
    if (!potTarget) {
      toast.message(
        t("กรอกขนาดกระถางและจำนวนให้ถูกต้อง", "Enter valid pot size and count")
      );
      return;
    }
    setStep(2);
  };

  const fetchExplain = async (payload: SoilMixApiPayload) => {
    try {
      const res = await fetch("/api/storefront/grower-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "soil-mixer-explain", payload }),
      });
      const json = (await res.json()) as { summary?: string; error?: string };
      if (!res.ok || !json.summary) return;
      setResult((prev) =>
        prev
          ? { ...prev, analysis: { ...prev.analysis, summary: json.summary! } }
          : prev
      );
    } catch {
      /* optional enrich — ignore */
    }
  };

  const askQuestion = async (question: string): Promise<string | null> => {
    if (!lastPayload) return null;
    const res = await fetch("/api/storefront/grower-tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "soil-mixer-ask",
        payload: { ...lastPayload, question },
      }),
    });
    const json = (await res.json()) as { answer?: string; error?: string };
    if (!res.ok) {
      throw new Error(parseGrowerToolApiError(res.status, json, isEn ? "en" : "th"));
    }
    return json.answer ?? null;
  };

  const submit = async () => {
    if (!potTarget) return;

    const materials = SOIL_MATERIAL_OPTIONS.filter((m) => selected[m.id]).map((m) => {
      const raw = amounts[m.id]?.trim();
      const unit = amountUnits[m.id] ?? "L";
      const amount = raw
        ? normalizeVolumeAmount(`${raw} ${unit === "gal" ? "gal" : "L"}`)
        : undefined;
      return {
        id: m.id,
        label: isEn ? m.labelEn : m.labelTh,
        amount,
      };
    });

    if (materialsChoice === "unset") {
      toast.message(
        t("เลือกว่ามีวัสดุในมือหรือยังไม่มี", "Choose whether you have materials on hand")
      );
      return;
    }

    if (materialsChoice === "have" && !materials.length && !notes.trim()) {
      toast.message(t("เลือกวัสดุอย่างน้อย 1 รายการ", "Select at least one material"));
      setMaterialsModalOpen(true);
      return;
    }

    const payloadMaterials =
      materialsChoice === "none"
        ? []
        : notes.trim()
          ? [...materials, { id: "notes", label: notes.trim(), amount: undefined }]
          : materials;

    setLoading(true);
    setResult(null);
    const apiPayload: SoilMixApiPayload = {
      potTarget: {
        potLiters: potTarget.potLiters,
        potCount: potTarget.potCount,
        totalFillLiters: potTarget.totalFillLiters,
        superSoilLiters: potTarget.superSoilLiters,
        baseSoilLiters: potTarget.baseSoilLiters,
      },
      materials: payloadMaterials,
      locale: isEn ? "en" : "th",
      recipeMode,
    };
    setLastPayload(apiPayload);
    try {
      const res = await fetch("/api/storefront/grower-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "soil-mixer",
          payload: apiPayload,
        }),
      });
      const raw = await res.text();
      let json: {
        analysis?: SoilMixAnalysis;
        buyLinks?: SoilMixBuyLink[];
        error?: string;
        retryAfterSec?: number;
      } = {};
      if (raw) {
        try {
          json = JSON.parse(raw) as typeof json;
        } catch {
          throw new Error(
            t("เซิร์ฟเวอร์ตอบกลับผิดรูปแบบ ลองใหม่อีกครั้ง", "Invalid server response — try again")
          );
        }
      } else if (!res.ok) {
        throw new Error(
          t("เซิร์ฟเวอร์ขัดข้อง ลองใหม่อีกครั้ง", "Server error — try again")
        );
      }
      if (!res.ok) {
        throw new Error(parseGrowerToolApiError(res.status, json, isEn ? "en" : "th"));
      }
      if (!json.analysis) throw new Error(json.error ?? "No analysis");
      setResult({
        analysis: json.analysis,
        buyLinks: json.buyLinks ?? [],
      });
      if (aiEnabled) void fetchExplain(apiPayload);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <GrowerToolShell
      title={t('ผู้ช่วยผสมดิน "Super soil"', "Super soil mixing assistant")}
      subtitle={
        result
          ? t("ผลการวิเคราะห์ — สูตรและรายการซื้อ", "Analysis — recipe & shopping list")
          : step === 1
            ? t(
                "ระบุกระถาง → เลือกวัสดุ → คำนวณสูตร",
                "Set pots → pick materials → calculate mix"
              )
            : t("ติ๊กวัสดุที่มี + ใส่ปริมาณ", "Check materials + enter amounts")
      }
    >
      <div className="space-y-4 sm:space-y-6">
        {!aiEnabled ? (
          <GrowerToolsAiDisabledNotice
            message={t(
              "คำนวณสูตรใช้ได้ตามปกติ — ถามเพิ่ม/สรุป AI ปิดชั่วคราว",
              "Recipe calc works — AI explain & Q&A temporarily off"
            )}
          />
        ) : null}
        {step === 1 ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pot-size">
                  {potUnit === "gal"
                    ? t("ขนาดกระถาง (แกลลอน)", "Pot size (gallons)")
                    : t("ขนาดกระถาง (ลิตร)", "Pot size (liters)")}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="pot-size"
                    type="number"
                    inputMode="decimal"
                    min={0.1}
                    step={potUnit === "gal" ? 0.5 : 1}
                    className="min-h-12 flex-1"
                    value={potSize}
                    onChange={(e) => setPotSize(e.target.value)}
                  />
                  <div className="flex shrink-0 rounded-lg border border-border p-1">
                    {(["L", "gal"] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        className={cn(
                          "min-h-10 min-w-12 rounded-md px-3 text-sm font-medium transition",
                          potUnit === u
                            ? "bg-emerald-600 text-white"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => switchPotUnit(u)}
                        aria-pressed={potUnit === u}
                      >
                        {u === "L" ? "L" : "G"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pot-count">{t("จำนวนกระถาง", "Number of pots")}</Label>
                <Input
                  id="pot-count"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  className="min-h-12"
                  value={potCount}
                  onChange={(e) => setPotCount(e.target.value)}
                />
              </div>
            </div>

            {potTarget ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 sm:p-5">
                <p className="text-xs font-medium text-emerald-400 sm:text-sm">
                  {t("เป้าหมายการผสม", "Mix target")}
                </p>
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {(
                    [
                      {
                        Icon: SOIL_SECTION_ICONS.pot,
                        label: t("ดินทั้งหมด", "Total soil"),
                        liters: potTarget.totalFillLiters,
                        perPot: null,
                        accent: "text-foreground",
                      },
                      {
                        Icon: SOIL_SECTION_ICONS.super,
                        label: t("Super soil 1/3", "Super soil 1/3"),
                        liters: potTarget.superSoilLiters,
                        perPot: potTarget.superSoilPerPotLiters,
                        accent: "text-emerald-400",
                      },
                      {
                        Icon: SOIL_SECTION_ICONS.base,
                        label: t("Base soil 2/3", "Base soil 2/3"),
                        liters: potTarget.baseSoilLiters,
                        perPot: potTarget.baseSoilPerPotLiters,
                        accent: "text-foreground",
                      },
                    ] as const
                  ).map(({ Icon, label, liters, perPot, accent }) => (
                    <div
                      key={label}
                      className="rounded-lg border border-border/60 bg-background/40 px-2 py-2 text-center sm:px-3 sm:py-2.5"
                    >
                      <Icon
                        className={cn("mx-auto h-4 w-4 sm:h-5 sm:w-5", accent)}
                        aria-hidden
                      />
                      <p className="mt-1 text-[9px] leading-tight text-muted-foreground sm:text-[10px]">
                        {label}
                      </p>
                      <p className={cn("mt-0.5 text-sm font-bold tabular-nums sm:text-base", accent)}>
                        {formatLiters(liters)} L
                      </p>
                      {perPot ? (
                        <p className="mt-0.5 hidden text-[9px] text-muted-foreground sm:block">
                          ~{formatLiters(perPot)} L/{t("กระถาง", "pot")}
                        </p>
                      ) : (
                        <p className="mt-0.5 hidden text-[9px] text-muted-foreground sm:block">
                          {formatVolumeDual(liters, isEn)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <Button
              type="button"
              className="min-h-12 w-full bg-emerald-600 hover:bg-emerald-500"
              onClick={goToStep2}
            >
              {t("ถัดไป — เลือกวัสดุ", "Next — pick materials")}
            </Button>
          </>
        ) : result ? (
          potTarget ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 sm:p-4">
              <p className="min-w-0 text-xs text-muted-foreground sm:text-sm">
                {t(
                  `${potTarget.potCount} กระถาง × ${formatPotSizeLabel(Number(potSize), potUnit, isEn)} · ${recipeMode === "basic" ? "Basic" : "Advance"}`,
                  `${potTarget.potCount} pots × ${formatPotSizeLabel(Number(potSize), potUnit, isEn)} · ${recipeMode === "basic" ? "Basic" : "Advance"}`
                )}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 shrink-0 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                onClick={() => setResult(null)}
              >
                {t("แก้ไขสูตร", "Edit mix")}
              </Button>
            </div>
          ) : null
        ) : (
          <>
            {potTarget ? (
              <div className="space-y-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 sm:p-4">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {t(
                    `${potTarget.potCount} กระถาง × ${formatPotSizeLabel(Number(potSize), potUnit, isEn)}`,
                    `${potTarget.potCount} pots × ${formatPotSizeLabel(Number(potSize), potUnit, isEn)}`
                  )}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-2.5 sm:px-3 sm:py-3">
                    <div className="flex items-center gap-1.5">
                      <SOIL_SECTION_ICONS.super
                        className="h-4 w-4 shrink-0 text-emerald-400"
                        aria-hidden
                      />
                      <p className="text-[10px] text-emerald-300/90 sm:text-xs">
                        {t(
                          `${soilTermSuperSoil(false)} 1/3`,
                          `${soilTermSuperSoil(true)} 1/3`
                        )}
                      </p>
                    </div>
                    <p className="mt-1 text-lg font-bold tabular-nums text-emerald-400 sm:text-xl">
                      {formatLiters(potTarget.superSoilLiters)} L
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">
                      ~{formatLiters(potTarget.superSoilPerPotLiters)} L/
                      {t("กระถาง", "pot")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/50 px-2.5 py-2.5 sm:px-3 sm:py-3">
                    <div className="flex items-center gap-1.5">
                      <SOIL_SECTION_ICONS.base
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <p className="text-[10px] text-muted-foreground sm:text-xs">
                        {t(
                          `${soilTermBaseSoil(false)} 2/3`,
                          `${soilTermBaseSoil(true)} 2/3`
                        )}
                      </p>
                    </div>
                    <p className="mt-1 text-lg font-bold tabular-nums text-foreground sm:text-xl">
                      {formatLiters(potTarget.baseSoilLiters)} L
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">
                      ~{formatLiters(potTarget.baseSoilPerPotLiters)} L/
                      {t("กระถาง", "pot")}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-2 rounded-xl border border-border bg-card/40 p-3 sm:p-4">
              <div>
                <p className="text-xs font-medium text-foreground sm:text-sm">
                  {t("สูตร Super soil", "Super soil recipe")}
                </p>
                <p className="text-[11px] text-muted-foreground sm:text-xs">
                  {t("กดเลือกสูตรที่ต้องการ", "Tap to choose a recipe")}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      id: "basic" as const,
                      Icon: SOIL_SECTION_ICONS.basic,
                      title: "Basic",
                      desc: t("มูลไส้เดือน · ปุ๋ยหมัก", "Worm castings · compost"),
                      accentSelected:
                        "border-sky-500/70 bg-sky-500/10 ring-2 ring-sky-500/40",
                      iconWrapSelected: "bg-sky-500/25 text-sky-300",
                      titleSelected: "text-sky-300",
                    },
                    {
                      id: "advance" as const,
                      Icon: SOIL_SECTION_ICONS.advance,
                      title: "Advance",
                      desc: t("ครบสารอาหาร", "Full amendments"),
                      accentSelected:
                        "border-amber-500/70 bg-amber-500/10 ring-2 ring-amber-500/40",
                      iconWrapSelected: "bg-amber-500/25 text-amber-300",
                      titleSelected: "text-amber-300",
                    },
                  ] as const
                ).map((opt) => {
                  const selected = recipeMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setRecipeMode(opt.id);
                        setResult(null);
                      }}
                      className={cn(
                        "relative flex min-h-[88px] cursor-pointer flex-col items-center rounded-xl border px-2 py-3 text-center transition duration-200 sm:min-h-[96px] sm:px-3 sm:py-3.5",
                        selected
                          ? cn(opt.accentSelected, "opacity-100 shadow-sm")
                          : "border-border/30 bg-background/5 opacity-35 saturate-[0.35] hover:opacity-60 hover:saturate-75 hover:border-border/70 hover:bg-background/20"
                      )}
                      aria-pressed={selected}
                    >
                      {selected ? (
                        <span className="absolute right-2 top-2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                          {t("เลือก", "On")}
                        </span>
                      ) : null}
                      <div
                        className={cn(
                          "mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 sm:h-11 sm:w-11",
                          selected
                            ? opt.iconWrapSelected
                            : "bg-background/40 text-muted-foreground"
                        )}
                      >
                        <opt.Icon className="h-5 w-5 shrink-0 sm:h-5 sm:w-5" aria-hidden />
                      </div>
                      <p
                        className={cn(
                          "text-sm font-semibold sm:text-base",
                          selected ? opt.titleSelected : "text-muted-foreground"
                        )}
                      >
                        {opt.title}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-[10px] leading-tight sm:text-[11px]",
                          selected ? "text-muted-foreground" : "text-muted-foreground/70"
                        )}
                      >
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-card/40 p-3 sm:p-4">
              <div>
                <p className="text-xs font-medium text-foreground sm:text-sm">
                  {t("วัสดุปลูกที่มีในมือหรือยัง?", "Do you have materials on hand?")}
                </p>
                <p className="text-[11px] text-muted-foreground sm:text-xs">
                  {t("กดเลือก 1 ตัวเลือก", "Tap one option")}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      id: "have" as const,
                      Icon: Package,
                      title: t("มีวัสดุในมือ", "Have materials"),
                      desc:
                        materialsChoice === "have" && selectedMaterialCount > 0
                          ? t(`${selectedMaterialCount} รายการ`, `${selectedMaterialCount} items`)
                          : t("ติ๊กเลือก + ใส่ปริมาณ", "Check + enter amounts"),
                      accentSelected:
                        "border-emerald-500/70 bg-emerald-500/15 ring-2 ring-emerald-500/40",
                      titleSelected: "text-emerald-300",
                      onClick: chooseHaveMaterials,
                    },
                    {
                      id: "none" as const,
                      Icon: PackageX,
                      title: t("ยังไม่มี", "None yet"),
                      desc: t("ข้าม — ซื้อครบทั้งสูตร", "Skip — full shopping list"),
                      accentSelected:
                        "border-slate-400/60 bg-slate-500/10 ring-2 ring-slate-400/30",
                      titleSelected: "text-slate-200",
                      onClick: chooseNoMaterials,
                    },
                  ] as const
                ).map((opt) => {
                  const active = materialsChoice === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={opt.onClick}
                      className={cn(
                        "relative min-h-12 cursor-pointer rounded-lg border px-2.5 py-2.5 text-left transition duration-200 sm:px-3 sm:py-3",
                        active
                          ? cn(opt.accentSelected, "opacity-100 shadow-sm")
                          : materialsChoice === "unset"
                            ? "border-border/50 bg-background/10 opacity-70 hover:border-border hover:bg-background/20 hover:opacity-90"
                            : "border-border/30 bg-background/5 opacity-35 saturate-[0.35] hover:opacity-55 hover:saturate-75"
                      )}
                      aria-pressed={active}
                    >
                      {active ? (
                        <span className="absolute right-2 top-2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                          {t("เลือก", "On")}
                        </span>
                      ) : null}
                      <div className="flex items-center gap-1.5">
                        <opt.Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            active ? opt.titleSelected : "text-muted-foreground"
                          )}
                          aria-hidden
                        />
                        <p
                          className={cn(
                            "text-xs font-semibold sm:text-sm",
                            active ? opt.titleSelected : "text-muted-foreground"
                          )}
                        >
                          {opt.title}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "mt-1 text-[10px] sm:text-xs",
                          active ? "text-muted-foreground" : "text-muted-foreground/70"
                        )}
                      >
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
              {materialsChoice === "have" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11 w-full border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                  onClick={() => setMaterialsModalOpen(true)}
                >
                  {selectedMaterialCount > 0 || notes.trim()
                    ? t("แก้ไขรายการวัสดุ", "Edit materials")
                    : t("เลือกวัสดุ + ปริมาณ", "Pick materials + amounts")}
                </Button>
              ) : null}
            </div>

            <Dialog open={materialsModalOpen} onOpenChange={setMaterialsModalOpen}>
              <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border bg-card p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">
                    {t("วัสดุปลูกที่มีในมือ", "Materials on hand")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("ติ๊กเลือก + ใส่ปริมาณ L/แกล.", "Check + enter amount L/gal")}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-2">
                  {SOIL_MATERIAL_OPTIONS.map((m) => {
                    const on = Boolean(selected[m.id]);
                    const unit = amountUnits[m.id] ?? "L";
                    const MatIcon = SOIL_MATERIAL_ICONS[m.id];
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "rounded-lg border border-border p-2 transition sm:p-2.5",
                          on && "border-emerald-500/40 bg-emerald-500/5"
                        )}
                      >
                        <label className="flex min-h-12 cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 shrink-0 accent-emerald-500"
                            checked={on}
                            onChange={() => toggle(m.id)}
                          />
                          <MatIcon
                            className="h-5 w-5 shrink-0 text-emerald-400/80"
                            aria-hidden
                          />
                          <span className="flex-1 text-[11px] font-medium leading-tight sm:text-sm">
                            {isEn ? m.labelEn : m.labelTh}
                          </span>
                        </label>
                        {on ? (
                          <div className="mt-2 flex gap-1.5">
                            <Input
                              type="number"
                              inputMode="decimal"
                              min={0.1}
                              step={unit === "gal" ? 0.5 : 1}
                              placeholder={unit === "gal" ? "5" : "20"}
                              aria-label={t(
                                `ปริมาณ ${isEn ? m.labelEn : m.labelTh}`,
                                `Amount of ${m.labelEn}`
                              )}
                              className="min-h-11 flex-1 text-sm"
                              value={amounts[m.id] ?? ""}
                              onChange={(e) =>
                                setAmounts((prev) => ({ ...prev, [m.id]: e.target.value }))
                              }
                            />
                            <div className="flex shrink-0 rounded-lg border border-border p-0.5">
                              {(["L", "gal"] as const).map((u) => (
                                <button
                                  key={u}
                                  type="button"
                                  className={cn(
                                    "min-h-9 min-w-10 rounded-md px-2 text-xs font-medium transition sm:min-w-11 sm:text-sm",
                                    unit === u
                                      ? "bg-emerald-600 text-white"
                                      : "text-muted-foreground hover:text-foreground"
                                  )}
                                  onClick={() => switchAmountUnit(m.id, u)}
                                  aria-pressed={unit === u}
                                >
                                  {u === "L" ? "L" : "G"}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="soil-notes">{t("อื่นๆ (ถ้ามี)", "Other (optional)")}</Label>
                  <Input
                    id="soil-notes"
                    className="min-h-12"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    className="min-h-12 w-full bg-emerald-600 hover:bg-emerald-500 sm:w-auto"
                    onClick={() => setMaterialsModalOpen(false)}
                  >
                    {t("เสร็จแล้ว", "Done")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="min-h-12 gap-2"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="h-4 w-4" />
                {t("ย้อนกลับ", "Back")}
              </Button>
              <Button
                type="button"
                disabled={loading}
                className="min-h-12 flex-1 bg-emerald-600 hover:bg-emerald-500"
                onClick={() => void submit()}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  t("คำนวณสูตร", "Calculate mix")
                )}
              </Button>
            </div>
          </>
        )}

        {result ? (
          <div ref={resultAnchorRef} className="scroll-mt-24">
            <SoilMixResultInfographic
              analysis={result.analysis}
              buyLinks={result.buyLinks}
              aiEnabled={aiEnabled}
              onAsk={aiEnabled ? askQuestion : undefined}
            />
          </div>
        ) : null}
      </div>
    </GrowerToolShell>
  );
}
