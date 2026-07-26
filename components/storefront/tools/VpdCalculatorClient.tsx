"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { GrowerToolShell } from "@/components/storefront/tools/GrowerToolShell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GROW_STAGES, type GrowStage } from "@/lib/grower-tools";
import { analyzeVpd } from "@/lib/vpd";
import { cn } from "@/lib/utils";

export function VpdCalculatorClient() {
  const { t, locale } = useLanguage();
  const isEn = locale === "en";
  const [stage, setStage] = useState<GrowStage>("veg");
  const [temp, setTemp] = useState("26");
  const [rh, setRh] = useState("55");

  const result = useMemo(() => {
    const tempC = Number(temp);
    const rhN = Number(rh);
    if (!Number.isFinite(tempC) || !Number.isFinite(rhN) || rhN < 0 || rhN > 100) return null;
    return analyzeVpd(tempC, rhN, stage);
  }, [temp, rh, stage]);

  return (
    <GrowerToolShell
      title={t("คำนวณ VPD", "VPD Calculator")}
      subtitle={t(
        "ใส่อุณหภูมิและความชื้น — ระบบคำนวณและแนะนำการปรับห้อง",
        "Enter temp and RH — get VPD and HVAC hints"
      )}
    >
      <div className="space-y-6">
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vpd-temp">{t("อุณหภูมิ (°C)", "Temperature (°C)")}</Label>
            <Input
              id="vpd-temp"
              type="number"
              inputMode="decimal"
              className="min-h-12"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vpd-rh">{t("ความชื้น RH (%)", "Relative humidity (%)")}</Label>
            <Input
              id="vpd-rh"
              type="number"
              inputMode="decimal"
              className="min-h-12"
              value={rh}
              onChange={(e) => setRh(e.target.value)}
            />
          </div>
        </div>

        {result ? (
          <div
            className={cn(
              "rounded-xl border border-border bg-card/60 p-5",
              result.status === "optimal" && "border-emerald-500/40",
              result.status === "low" && "border-sky-500/40",
              result.status === "high" && "border-amber-500/40"
            )}
          >
            <p className="text-3xl font-bold tabular-nums text-emerald-400">
              {result.vpdKpa.toFixed(2)} kPa
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {isEn ? result.headlineEn : result.headlineTh}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("เป้าหมาย", "Target")}: {result.band.min}–{result.band.max} kPa (
              {isEn ? result.band.labelEn : result.band.labelTh})
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {(isEn ? result.tipsEn : result.tipsTh).map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="text-emerald-500">·</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("กรอกอุณหภูมิและความชื้นให้ครบเพื่อดูผล VPD", "Enter valid temp and RH to see VPD")}
          </p>
        )}
      </div>
    </GrowerToolShell>
  );
}
