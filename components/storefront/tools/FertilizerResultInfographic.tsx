"use client";

import { ExternalLink, Leaf, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { FertilizerAnalysis, FertilizerBuyLink } from "@/lib/fertilizer-advisor";
import { cn } from "@/lib/utils";

function NpkCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "sky" | "violet" | "amber";
}) {
  const styles = {
    sky: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    violet: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  };
  return (
    <div className={cn("rounded-lg border p-4", styles[accent])}>
      <p className="text-[11px] font-bold uppercase tracking-wider opacity-90">{label}</p>
      <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">{value}</p>
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
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <NpkCard label="N" value={analysis.npkFocus.n} accent="sky" />
          <NpkCard label="P" value={analysis.npkFocus.p} accent="violet" />
          <NpkCard label="K" value={analysis.npkFocus.k} accent="amber" />
        </div>
      </section>

      {analysis.products.length > 0 ? (
        <section className="rounded-xl border border-border bg-card/60 p-5">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Leaf className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
            {t("ชุดปุ๋ยที่แนะนำ", "Recommended line")}
          </p>
          <ul className="mt-4 space-y-3">
            {buyLinks.map((item) => (
              <li
                key={`${item.keyword}-${item.name}`}
                className="flex flex-col gap-3 rounded-lg border border-border bg-background/50 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.role}</p>
                </div>
                <a
                  href={item.shopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-400"
                >
                  {t("ซื้อบน Shopee", "Buy on Shopee")}
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              </li>
            ))}
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
