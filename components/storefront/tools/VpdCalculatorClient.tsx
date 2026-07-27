"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  Droplets,
  ExternalLink,
  Fan,
  Flower2,
  Gauge,
  Leaf,
  Sprout,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { GrowerToolShell } from "@/components/storefront/tools/GrowerToolShell";
import { Input } from "@/components/ui/input";
import { GROW_STAGES, type GrowStage } from "@/lib/grower-tools";
import { buildShopeeSearchUrl } from "@/lib/shopee-affiliate";
import { analyzeVpd, VPD_EQUIPMENT, type VpdAdvice, type VpdBand } from "@/lib/vpd";
import { cn } from "@/lib/utils";

const GAUGE_MAX = 2;

const STAGE_META: Record<
  GrowStage,
  { Icon: LucideIcon; descTh: string; descEn: string }
> = {
  seedling: {
    Icon: Sprout,
    descTh: "0.4–0.8 kPa",
    descEn: "0.4–0.8 kPa",
  },
  veg: {
    Icon: Leaf,
    descTh: "0.8–1.2 kPa",
    descEn: "0.8–1.2 kPa",
  },
  flower: {
    Icon: Flower2,
    descTh: "1.0–1.5 kPa",
    descEn: "1.0–1.5 kPa",
  },
};

const STATUS_META: Record<
  VpdAdvice["status"],
  { Icon: LucideIcon; ring: string; value: string; badge: string }
> = {
  optimal: {
    Icon: CheckCircle2,
    ring: "border-emerald-500/40 bg-emerald-500/10",
    value: "text-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-300",
  },
  low: {
    Icon: Droplets,
    ring: "border-sky-500/40 bg-sky-500/10",
    value: "text-sky-400",
    badge: "bg-sky-500/15 text-sky-300",
  },
  high: {
    Icon: Sun,
    ring: "border-amber-500/40 bg-amber-500/10",
    value: "text-amber-400",
    badge: "bg-amber-500/15 text-amber-300",
  },
};

function VpdGauge({ vpd, band }: { vpd: number; band: VpdBand }) {
  const marker = Math.min(100, Math.max(0, (vpd / GAUGE_MAX) * 100));
  const targetStart = (band.min / GAUGE_MAX) * 100;
  const targetWidth = ((band.max - band.min) / GAUGE_MAX) * 100;

  return (
    <div className="space-y-2">
      <div className="relative h-3 overflow-hidden rounded-full bg-muted/40">
        <div
          className="absolute inset-y-0 rounded-full bg-emerald-500/35"
          style={{ left: `${targetStart}%`, width: `${targetWidth}%` }}
          aria-hidden
        />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-emerald-400 shadow-md"
          style={{ left: `${marker}%` }}
          aria-hidden
        />
      </div>
      <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>0</span>
        <span className="text-emerald-400/90">
          {band.min}–{band.max}
        </span>
        <span>{GAUGE_MAX} kPa</span>
      </div>
    </div>
  );
}

const EQUIP_ICONS: Record<string, LucideIcon> = {
  sensor: Gauge,
  dehumidifier: Wind,
  humidifier: Droplets,
  fan: Fan,
  controller: Thermometer,
};

function VpdEquipmentSection() {
  const { t, locale } = useLanguage();
  const isEn = locale === "en";

  return (
    <section className="rounded-xl border border-border bg-card/60 p-3 sm:p-4">
      <div className="flex items-start gap-2">
        <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">
            {t("อุปกรณ์คุม VPD", "VPD control gear")}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/80 sm:text-[11px]">
            {t(
              "เซ็นเซอร์วัด + ปรับ RH ในห้องปลูก",
              "Sensors + RH tuning for the grow space"
            )}
          </p>
        </div>
      </div>
      <ul className="mt-2 space-y-1 sm:mt-2.5">
        {VPD_EQUIPMENT.map((item) => {
          const ItemIcon = EQUIP_ICONS[item.id] ?? Gauge;
          const name = isEn ? item.nameEn : item.nameTh;
          const role = isEn ? item.roleEn : item.roleTh;
          return (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-2 py-2 sm:px-2.5"
            >
              <ItemIcon
                className="h-3.5 w-3.5 shrink-0 text-emerald-400/80"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium leading-snug text-foreground sm:text-xs">
                  {name}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
                  {role}
                </p>
              </div>
              <a
                href={buildShopeeSearchUrl(item.keyword)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t(`ซื้อ ${name} บน Shopee`, `Buy ${name} on Shopee`)}
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md bg-orange-500 px-2 text-white transition hover:bg-orange-400"
              >
                <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function VpdDiagram() {
  const { t } = useLanguage();
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
          <Leaf className="h-6 w-6 text-emerald-400/90" aria-hidden />
          <Droplets
            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 text-sky-400"
            aria-hidden
          />
        </div>
        <p className="text-xs font-semibold leading-snug text-foreground sm:text-sm">
          {t("VPD = ช่องว่างความชื้นใบ ↔ อากาศ", "VPD = leaf ↔ air moisture gap")}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-2.5 py-2">
          <Sun className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
          <div className="min-w-0 text-[11px] leading-snug sm:text-xs">
            <p className="font-medium text-amber-300/90">
              {t("อุณหภูมิสูง + RH ต่ำ", "Higher temp + lower RH")}
            </p>
            <p className="mt-0.5 text-muted-foreground">
              → {t("VPD สูง", "High VPD")}{" "}
              <span className="font-medium text-amber-300/80">
                ({t("แห้ง", "dry")})
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-sky-500/25 bg-sky-500/5 px-2.5 py-2">
          <Droplets className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" aria-hidden />
          <div className="min-w-0 text-[11px] leading-snug sm:text-xs">
            <p className="font-medium text-sky-300/90">{t("RH สูง", "Higher RH")}</p>
            <p className="mt-0.5 text-muted-foreground">
              → {t("VPD ต่ำ", "Low VPD")}{" "}
              <span className="font-medium text-sky-300/80">
                ({t("ชื้น", "humid")})
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VpdCalculatorClient() {
  const { t, locale } = useLanguage();
  const isEn = locale === "en";
  const [stage, setStage] = useState<GrowStage>("veg");
  const [temp, setTemp] = useState("26");
  const [rh, setRh] = useState("55");

  const result = useMemo(() => {
    const tempC = Number(temp);
    const rhN = Number(rh);
    if (!Number.isFinite(tempC) || !Number.isFinite(rhN) || rhN < 0 || rhN > 100) {
      return null;
    }
    return analyzeVpd(tempC, rhN, stage);
  }, [temp, rh, stage]);

  const statusMeta = result ? STATUS_META[result.status] : null;
  const StatusIcon = statusMeta?.Icon ?? Gauge;

  return (
    <GrowerToolShell
      title={t("คำนวณ VPD", "VPD Calculator")}
      subtitle={t(
        "ใส่อุณหภูมิ + RH → ดู VPD และวิธีปรับห้อง",
        "Enter temp + RH → VPD and room tuning tips"
      )}
    >
      <div className="space-y-3 sm:space-y-4">
        <VpdDiagram />

        <section className="rounded-xl border border-border bg-card/40 p-3 sm:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">
            {t("ช่วงการปลูก", "Grow stage")}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-1.5 sm:gap-2">
            {GROW_STAGES.map((s) => {
              const meta = STAGE_META[s.id];
              const active = stage === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStage(s.id)}
                  className={cn(
                    "flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg border px-1.5 py-2 text-center transition sm:min-h-[76px] sm:px-2",
                    active
                      ? "border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/30"
                      : "border-border/60 bg-background/30 hover:border-border hover:bg-background/50"
                  )}
                >
                  <meta.Icon
                    className={cn(
                      "h-5 w-5",
                      active ? "text-emerald-400" : "text-muted-foreground"
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "text-[11px] font-semibold leading-tight sm:text-xs",
                      active ? "text-emerald-300" : "text-foreground/80"
                    )}
                  >
                    {isEn ? s.labelEn : s.labelTh}
                  </span>
                  <span className="text-[9px] tabular-nums text-muted-foreground sm:text-[10px]">
                    {isEn ? meta.descEn : meta.descTh}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card/40 p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <label className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:text-xs">
                <Thermometer className="h-3.5 w-3.5 text-amber-400" aria-hidden />
                {t("อุณหภูมิ (°C)", "Temp (°C)")}
              </span>
              <Input
                id="vpd-temp"
                type="number"
                inputMode="decimal"
                className="min-h-11 tabular-nums"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
              />
            </label>
            <label className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:text-xs">
                <Droplets className="h-3.5 w-3.5 text-sky-400" aria-hidden />
                {t("ความชื้น RH (%)", "RH (%)")}
              </span>
              <Input
                id="vpd-rh"
                type="number"
                inputMode="decimal"
                className="min-h-11 tabular-nums"
                value={rh}
                onChange={(e) => setRh(e.target.value)}
              />
            </label>
          </div>
        </section>

        {result && statusMeta ? (
          <section
            className={cn(
              "space-y-3 rounded-xl border p-3 sm:p-4",
              statusMeta.ring
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                  statusMeta.badge
                )}
              >
                <StatusIcon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p className={cn("text-2xl font-bold tabular-nums sm:text-3xl", statusMeta.value)}>
                    {result.vpdKpa.toFixed(2)}
                  </p>
                  <span className="text-sm font-medium text-muted-foreground">kPa</span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-semibold sm:text-[11px]",
                      statusMeta.badge
                    )}
                  >
                    {isEn ? result.headlineEn : result.headlineTh}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
                  {t("เป้าหมาย", "Target")}: {result.band.min}–{result.band.max} kPa ·{" "}
                  {isEn ? result.band.labelEn : result.band.labelTh}
                </p>
              </div>
            </div>

            <VpdGauge vpd={result.vpdKpa} band={result.band} />

            <div className="border-t border-border/50 pt-2.5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">
                {t("คำแนะนำที่ต้องทำ", "Action steps")}
              </p>
              <ul className="space-y-1.5">
                {(isEn ? result.tipsEn : result.tipsTh).map((tip, i) => {
                  const TipIcon = i === 0 ? AlertTriangle : i === 1 ? Wind : Droplets;
                  return (
                    <li key={tip} className="flex gap-2 text-[11px] leading-relaxed sm:text-xs">
                      <TipIcon
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/80"
                        aria-hidden
                      />
                      <span className="text-foreground/90">{tip}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        ) : (
          <p className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">
            {t("กรอกอุณหภูมิและ RH ให้ถูกต้องเพื่อดู VPD", "Enter valid temp and RH to see VPD")}
          </p>
        )}

        <VpdEquipmentSection />
      </div>
    </GrowerToolShell>
  );
}
