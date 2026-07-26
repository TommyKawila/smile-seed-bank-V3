"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { GrowerToolShell } from "@/components/storefront/tools/GrowerToolShell";
import { GrowerToolsAiDisabledNotice } from "@/components/storefront/tools/GrowerToolsAiDisabledNotice";
import { SoilMixResultInfographic } from "@/components/storefront/tools/SoilMixResultInfographic";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

type SoilMixResult = {
  analysis: SoilMixAnalysis;
  buyLinks: SoilMixBuyLink[];
};

type Props = { aiEnabled?: boolean };

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
  const [recipeMode, setRecipeMode] = useState<SuperSoilRecipeMode>("basic");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SoilMixResult | null>(null);

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

    if (!materials.length && !notes.trim()) {
      toast.message(t("เลือกวัสดุอย่างน้อย 1 รายการ", "Select at least one material"));
      return;
    }

    if (notes.trim()) {
      materials.push({ id: "notes", label: notes.trim(), amount: undefined });
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/storefront/grower-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "soil-mixer",
          payload: {
            potTarget: {
              potLiters: potTarget.potLiters,
              potCount: potTarget.potCount,
              totalFillLiters: potTarget.totalFillLiters,
              superSoilLiters: potTarget.superSoilLiters,
              baseSoilLiters: potTarget.baseSoilLiters,
            },
            materials,
            locale: isEn ? "en" : "th",
            recipeMode,
          },
        }),
      });
      const json = (await res.json()) as {
        analysis?: SoilMixAnalysis;
        buyLinks?: SoilMixBuyLink[];
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
      title={t(
        `ผสม${soilTermSuperSoil(false)}`,
        "Super Soil Mixer"
      )}
      subtitle={
        step === 1
          ? t(
              "ระบุกระถางก่อน — แล้วเลือกวัสดุที่มี AI คำนวณสูตรตามเป้าหมาย",
              "Set pot target first — then pick materials for AI recipe"
            )
          : t(
              "ใส่วัสดุปลูกที่มีในมือตอนนี้",
              "Enter planting materials you have on hand now"
            )
      }
    >
      <div className="space-y-6">
        {!aiEnabled ? <GrowerToolsAiDisabledNotice /> : null}
        {step === 1 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
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
                        {u === "L" ? "L" : t("แกล.", "gal")}
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
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-sm">
                <p className="font-medium text-emerald-400">
                  {t("เป้าหมายการผสม", "Mix target")}
                </p>
                <ul className="mt-3 space-y-2 text-muted-foreground">
                  <li>
                    {t("ปริมาณเติมเต็มรวม", "Total fill volume")}:{" "}
                    <span className="font-medium text-foreground">
                      {formatVolumeDual(potTarget.totalFillLiters, isEn)}
                    </span>
                  </li>
                  <li>
                    {t(
                      `${soilTermSuperSoil(false)} ที่ต้องผสม (1/3)`,
                      `${soilTermSuperSoil(true)} to mix (1/3)`
                    )}:{" "}
                    <span className="font-medium text-foreground">
                      {formatVolumeDual(potTarget.superSoilLiters, isEn)}
                    </span>
                    <span className="text-xs">
                      {" "}
                      (~{formatVolumeDual(potTarget.superSoilPerPotLiters, isEn)}/
                      {t("กระถาง", "pot")})
                    </span>
                  </li>
                  <li>
                    {t(
                      `${soilTermBaseSoil(false)} ส่วนบน (2/3)`,
                      `${soilTermBaseSoil(true)} on top (2/3)`
                    )}:{" "}
                    <span className="font-medium text-foreground">
                      {formatVolumeDual(potTarget.baseSoilLiters, isEn)}
                    </span>
                    <span className="text-xs">
                      {" "}
                      (~{formatVolumeDual(potTarget.baseSoilPerPotLiters, isEn)}/
                      {t("กระถาง", "pot")})
                    </span>
                  </li>
                </ul>
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
        ) : (
          <>
            {potTarget ? (
              <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <p className="text-sm text-muted-foreground">
                  {t(
                    `${potTarget.potCount} กระถาง × ${formatPotSizeLabel(Number(potSize), potUnit, isEn)}`,
                    `${potTarget.potCount} pots × ${formatPotSizeLabel(Number(potSize), potUnit, isEn)}`
                  )}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {t(
                    "คุณต้องผสมดิน 2 ส่วน ดังนี้",
                    "You need to mix two soil batches"
                  )}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-3">
                    <p className="text-xs text-emerald-300/90">
                      {t(
                        `${soilTermSuperSoil(false)} (รองก้น 1/3)`,
                        `${soilTermSuperSoil(true)} (bottom 1/3)`
                      )}
                    </p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-emerald-400">
                      {formatLiters(potTarget.superSoilLiters)} L
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      ~{formatLiters(potTarget.superSoilPerPotLiters)} L/
                      {t("กระถาง", "pot")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/50 px-3 py-3">
                    <p className="text-xs text-muted-foreground">
                      {t(
                        `${soilTermBaseSoil(false)} (ส่วนบน 2/3)`,
                        `${soilTermBaseSoil(true)} (top 2/3)`
                      )}
                    </p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                      {formatLiters(potTarget.baseSoilLiters)} L
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      ~{formatLiters(potTarget.baseSoilPerPotLiters)} L/
                      {t("กระถาง", "pot")}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-2 rounded-xl border border-border bg-card/40 p-4">
              <p className="text-sm font-medium text-foreground">
                {t("สูตรดินซุปเปอร์ซอย", "Super soil recipe")}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    {
                      id: "basic" as const,
                      title: t("พื้นฐาน", "Basic"),
                      desc: t(
                        "สูตรเรียบง่าย — มูลไส้เดือน · ปุ๋ยหมัก",
                        "Lean mix — worm castings · compost"
                      ),
                      selected:
                        "border-sky-500/60 bg-sky-500/15 ring-1 ring-sky-500/30",
                      idle: "border-sky-500/20 bg-sky-500/5 hover:border-sky-500/40 hover:bg-sky-500/10",
                      titleClass: "text-sky-300",
                    },
                    {
                      id: "advance" as const,
                      title: t("Advance", "Advance"),
                      desc: t(
                        "ครบสารอาหาร — ขี้ค้างคาว · Bone meal · Biochar ฯลฯ",
                        "Full amendments — guano · bone meal · biochar etc."
                      ),
                      selected:
                        "border-amber-500/60 bg-amber-500/15 ring-1 ring-amber-500/30",
                      idle: "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 hover:bg-amber-500/10",
                      titleClass: "text-amber-300",
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setRecipeMode(opt.id);
                      setResult(null);
                    }}
                    className={cn(
                      "min-h-12 rounded-lg border px-3 py-3 text-left transition",
                      recipeMode === opt.id ? opt.selected : opt.idle
                    )}
                    aria-pressed={recipeMode === opt.id}
                  >
                    <p className={cn("text-sm font-semibold", opt.titleClass)}>
                      {opt.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {t("วัสดุปลูกที่มีในมือตอนนี้", "Materials on hand now")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t(
                  "ติ๊กเลือกวัสดุที่มี ใส่ตัวเลขแล้วสลับหน่วย L / แกล. ได้",
                  "Check materials, enter a number, then toggle L / gal"
                )}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {SOIL_MATERIAL_OPTIONS.map((m) => {
                const on = Boolean(selected[m.id]);
                const unit = amountUnits[m.id] ?? "L";
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "rounded-lg border border-border p-3 transition",
                      on && "border-emerald-500/40 bg-emerald-500/5"
                    )}
                  >
                    <label className="flex min-h-12 cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-5 w-5 accent-emerald-500"
                        checked={on}
                        onChange={() => toggle(m.id)}
                      />
                      <span className="flex-1 text-sm font-medium">
                        {isEn ? m.labelEn : m.labelTh}
                      </span>
                    </label>
                    {on ? (
                      <div className="mt-2 flex gap-2">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0.1}
                          step={unit === "gal" ? 0.5 : 1}
                          placeholder={unit === "gal" ? "e.g. 5" : "e.g. 20"}
                          aria-label={t(
                            `ปริมาณ ${isEn ? m.labelEn : m.labelTh}`,
                            `Amount of ${m.labelEn}`
                          )}
                          className="min-h-11 flex-1"
                          value={amounts[m.id] ?? ""}
                          onChange={(e) =>
                            setAmounts((prev) => ({ ...prev, [m.id]: e.target.value }))
                          }
                        />
                        <div className="flex shrink-0 rounded-lg border border-border p-1">
                          {(["L", "gal"] as const).map((u) => (
                            <button
                              key={u}
                              type="button"
                              className={cn(
                                "min-h-9 min-w-11 rounded-md px-2.5 text-sm font-medium transition",
                                unit === u
                                  ? "bg-emerald-600 text-white"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                              onClick={() => switchAmountUnit(m.id, u)}
                              aria-pressed={unit === u}
                            >
                              {u === "L" ? "L" : t("แกล.", "gal")}
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
                disabled={loading || !aiEnabled}
                className="min-h-12 flex-1 bg-emerald-600 hover:bg-emerald-500"
                onClick={() => void submit()}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  t("วิเคราะห์สูตร", "Analyze mix")
                )}
              </Button>
            </div>
          </>
        )}

        {result ? (
          <SoilMixResultInfographic
            analysis={result.analysis}
            buyLinks={result.buyLinks}
          />
        ) : null}
      </div>
    </GrowerToolShell>
  );
}
