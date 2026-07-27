"use client";

import { ExternalLink, Leaf, ShieldAlert, Shovel } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { FertilizerAnalysis, FertilizerBuyLink } from "@/lib/fertilizer-advisor";
import { getSoilMaterialIcon } from "@/lib/soil-mixer-icons";
import { cn } from "@/lib/utils";

type NpkLevel = "low" | "medium" | "high";

const NPK_LEVEL_PCT: Record<NpkLevel, number> = {
  low: 36,
  medium: 68,
  high: 100,
};

function inferNpkLevel(text: string): NpkLevel {
  const s = text.toLowerCase();
  if (/ต่ำ|\blow\b|light|minimal|ease|reduce|ลด|หยุด|stop|minimal/.test(s)) return "low";
  if (/สูง|\bhigh\b|heavy|elevated|เน้น|boost|strong|more|เพิ่ม|push/.test(s)) return "high";
  if (/ปานกลาง|moderate|\bmedium\b|balanced|กลาง|พอ/.test(s)) return "medium";
  return "medium";
}

function NpkBarChart({ focus }: { focus: FertilizerAnalysis["npkFocus"] }) {
  const { t } = useLanguage();
  const rows = (
    [
      { key: "N", value: focus.n, accent: "sky" as const },
      { key: "P", value: focus.p, accent: "violet" as const },
      { key: "K", value: focus.k, accent: "amber" as const },
    ] as const
  ).map((row) => ({ ...row, level: inferNpkLevel(row.value) }));

  const levelLabel = (level: NpkLevel) =>
    level === "high"
      ? t("สูง", "High")
      : level === "low"
        ? t("ต่ำ", "Low")
        : t("กลาง", "Med");

  const barStyles = {
    sky: {
      fill: "from-sky-600 to-sky-400",
      badge: "bg-sky-500/20 text-sky-300",
      label: "text-sky-400",
    },
    violet: {
      fill: "from-violet-600 to-violet-400",
      badge: "bg-violet-500/20 text-violet-300",
      label: "text-violet-400",
    },
    amber: {
      fill: "from-amber-600 to-amber-400",
      badge: "bg-amber-500/20 text-amber-300",
      label: "text-amber-400",
    },
  };

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-end justify-center gap-3 sm:gap-5">
        {rows.map(({ key, value, level, accent }) => {
          const styles = barStyles[accent];
          const pct = NPK_LEVEL_PCT[level];
          return (
            <div key={key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div className="relative flex h-28 w-full items-end justify-center rounded-lg border border-border/50 bg-background/40 px-2 pb-1 pt-2 sm:h-32">
                <div
                  className={cn(
                    "w-full max-w-12 rounded-t-md bg-gradient-to-t transition-all duration-500 sm:max-w-14",
                    styles.fill
                  )}
                  style={{ height: `${pct}%` }}
                  role="img"
                  aria-label={`${key} ${levelLabel(level)}`}
                />
              </div>
              <span className={cn("text-base font-bold tabular-nums", styles.label)}>{key}</span>
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]",
                  styles.badge
                )}
              >
                {levelLabel(level)}
              </span>
              <p className="line-clamp-3 text-center text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
                {value}
              </p>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        <span>{t("ต่ำ", "Low")} · 36%</span>
        <span>{t("กลาง", "Med")} · 68%</span>
        <span>{t("สูง", "High")} · 100%</span>
      </div>
    </div>
  );
}

export function FertilizerResultInfographic({
  analysis,
  buyLinks,
}: {
  analysis: FertilizerAnalysis;
  buyLinks: FertilizerBuyLink[];
}) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
          {t("สรุปคำแนะนำ", "Advice summary")}
        </p>
        {analysis.recommendedBrand ? (
          <p className="mt-2 text-lg font-bold text-emerald-400">{analysis.recommendedBrand}</p>
        ) : null}
        {analysis.brandTagline ? (
          <p className="mt-1 text-xs text-muted-foreground">{analysis.brandTagline}</p>
        ) : null}
        <p className="mt-2 text-base font-medium leading-relaxed text-foreground">
          {analysis.summary}
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card/60 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t("แนวทาง NPK ช่วงนี้", "NPK focus this stage")}
        </p>
        <NpkBarChart focus={analysis.npkFocus} />
      </section>

      {analysis.prepSteps && analysis.prepSteps.length > 0 ? (
        <section className="rounded-xl border border-border bg-card/60 p-5">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Shovel className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
            {t("การเตรียมและผสม", "Prep & mixing")}
          </p>
          <ol className="mt-4 space-y-2">
            {analysis.prepSteps.map((step) => (
              <li key={step} className="flex gap-2 text-sm text-foreground/90">
                <span className="text-emerald-500">·</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {analysis.products.length > 0 ? (
        <section className="rounded-xl border border-border bg-card/60 p-5">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Leaf className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
            {analysis.organicNatural
              ? t("วัสดุธรรมชาติที่แนะนำ", "Recommended natural inputs")
              : t("ชุดปุ๋ยที่แนะนำ", "Recommended line")}
          </p>
          <ul className="mt-3 space-y-1 sm:mt-4 sm:space-y-1.5">
            {buyLinks.map((item) => {
              const ItemIcon = getSoilMaterialIcon(item.ingredientId ?? item.name);
              return (
                <li
                  key={`${item.keyword}-${item.name}`}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-2 py-2 sm:px-2.5"
                >
                  <ItemIcon
                    className="h-3.5 w-3.5 shrink-0 text-emerald-400/80"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium leading-snug text-foreground sm:text-xs">
                      {item.name}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
                      {item.role}
                    </p>
                  </div>
                  <a
                    href={item.shopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t(`ซื้อ ${item.name} บน Shopee`, `Buy ${item.name} on Shopee`)}
                    className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md bg-orange-500 px-2 text-white transition hover:bg-orange-400"
                  >
                    <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {analysis.feedingTips.length > 0 ? (
        <section className="rounded-xl border border-border bg-card/60 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("เทคนิคการให้ปุ๋ย", "Feeding tips")}
          </p>
          <ul className="mt-4 space-y-2">
            {analysis.feedingTips.map((tip) => (
              <li key={tip} className="flex gap-2 text-sm text-foreground/90">
                <span className="text-emerald-500">·</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {analysis.cautions.length > 0 ? (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
            {t("ข้อควรระวัง", "Cautions")}
          </p>
          <ul className="mt-4 space-y-2">
            {analysis.cautions.map((tip) => (
              <li key={tip} className="flex gap-2 text-sm text-foreground/90">
                <span className="text-amber-500">·</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
