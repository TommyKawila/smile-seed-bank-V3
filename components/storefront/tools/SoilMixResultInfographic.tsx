"use client";

import { ExternalLink } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  aggregateShortagesFromRecipes,
  formatLiters,
  type SoilMixAnalysis,
  type SoilMixBuyLink,
  type SoilMixRecipeLine,
} from "@/lib/soil-mixer";
import {
  getSoilPrepGuides,
  soilTermBaseSoil,
  soilTermSuperSoil,
} from "@/lib/soil-mixer-terms";
import { buildShopeeSearchUrl } from "@/lib/shopee-affiliate";
import { cn } from "@/lib/utils";

function PrepGuideCard({
  title,
  steps,
  accent,
}: {
  title: string;
  steps: string[];
  accent?: "emerald" | "neutral";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        accent === "emerald"
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-border bg-card/60"
      )}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
        {steps.map((s) => (
          <li key={s} className="text-foreground/90">
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

function RecipeLineRow({ line }: { line: SoilMixRecipeLine }) {
  const { t } = useLanguage();

  const badge =
    line.status === "ok"
      ? { label: t("ครบ", "OK"), className: "bg-emerald-500/15 text-emerald-400" }
      : line.status === "short"
        ? {
            label: t(`ซื้อเพิ่ม ${line.buyMore || "—"}`, `Buy +${line.buyMore || "—"}`),
            className: "bg-amber-500/15 text-amber-400",
          }
        : {
            label: t(
              `ไม่มี · ซื้อ ${line.buyMore || line.need}`,
              `None · buy ${line.buyMore || line.need}`
            ),
            className: "bg-orange-500/15 text-orange-400",
          };

  return (
    <li
      className={cn(
        "rounded-lg border px-3 py-2.5",
        line.status === "ok" && "border-emerald-500/20 bg-emerald-500/5",
        line.status === "short" && "border-amber-500/25 bg-amber-500/5",
        line.status === "missing" && "border-orange-500/30 bg-orange-500/5"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{line.name}</p>
        <span
          className={cn(
            "shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold leading-none",
            badge.className
          )}
        >
          {badge.label}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-background/50 px-2 py-1.5">
          <p className="text-muted-foreground">{t("ต้องใช้", "Need")}</p>
          <p className="mt-0.5 font-medium tabular-nums text-foreground">{line.need}</p>
        </div>
        <div className="rounded-md bg-background/50 px-2 py-1.5">
          <p className="text-muted-foreground">{t("มีในมือ", "On hand")}</p>
          <p className="mt-0.5 font-medium tabular-nums text-foreground">
            {line.have && line.have !== "—" ? line.have : "0"}
          </p>
        </div>
      </div>
    </li>
  );
}

function RecipeCard({
  title,
  lines,
}: {
  title: string;
  lines: SoilMixRecipeLine[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 sm:p-5">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {lines.length ? (
        <ul className="mt-3 space-y-2">
          {lines.map((line, i) => (
            <RecipeLineRow key={`${line.name}-${i}`} line={line} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">—</p>
      )}
    </div>
  );
}

export function SoilMixResultInfographic({
  analysis,
  buyLinks,
}: {
  analysis: SoilMixAnalysis;
  buyLinks: SoilMixBuyLink[];
}) {
  const { t, locale } = useLanguage();
  const isEn = locale === "en";
  const baseL = formatLiters(analysis.volumes.baseSoilLiters);
  const superL = formatLiters(analysis.volumes.superSoilLiters);
  const superLabel = soilTermSuperSoil(isEn);
  const baseLabel = soilTermBaseSoil(isEn);

  // Source of truth = recipe cards (sum Base + Super buyMore)
  const synced = aggregateShortagesFromRecipes(
    analysis.baseMixPlan,
    analysis.superMixPlan,
    isEn ? "en" : "th"
  );
  const gaps = synced.gaps;
  const shopByName = new Map(
    buyLinks.map((b) => [b.name.toLowerCase(), b.shopUrl] as const)
  );
  const syncedBuyLinks: SoilMixBuyLink[] = synced.buyList.map((item) => ({
    ...item,
    shopUrl:
      shopByName.get(item.name.toLowerCase()) ?? buildShopeeSearchUrl(item.keyword),
  }));

  const potCount = Math.max(1, analysis.volumes.potCount || 1);
  const prepGuides = getSoilPrepGuides({
    isEn,
    superLitersLabel: superL,
    baseLitersLabel: baseL,
    superPerPotLabel: formatLiters(analysis.volumes.superSoilLiters / potCount),
    basePerPotLabel: formatLiters(analysis.volumes.baseSoilLiters / potCount),
  });

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
          {t("สรุปการวิเคราะห์", "Analysis summary")}
        </p>
        <p className="mt-2 text-base font-medium leading-relaxed text-foreground">
          {analysis.summary}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-background/50 p-4 text-center">
            <p className="text-xs text-muted-foreground">
              {t(`${baseLabel} (ส่วนบน 2/3)`, `${baseLabel} (top 2/3)`)}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {baseL} L
            </p>
          </div>
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <p className="text-xs text-emerald-300/90">
              {t(`${superLabel} (รองก้น 1/3)`, `${superLabel} (bottom 1/3)`)}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-400">
              {superL} L
            </p>
          </div>
        </div>
      </section>

      {(analysis.baseMixPlan.length > 0 || analysis.superMixPlan.length > 0) && (
        <section className="space-y-3">
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-md bg-emerald-500/15 px-2 py-1 font-medium text-emerald-400">
              {t("ครบ", "OK")}
            </span>
            <span className="rounded-md bg-amber-500/15 px-2 py-1 font-medium text-amber-400">
              {t("ซื้อเพิ่ม", "Buy more")}
            </span>
            <span className="rounded-md bg-orange-500/15 px-2 py-1 font-medium text-orange-400">
              {t("ไม่มีในมือ", "None on hand")}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <RecipeCard
              title={t(`สูตร${baseLabel} ~${baseL} L`, `${baseLabel} mix ~${baseL} L`)}
              lines={analysis.baseMixPlan}
            />
            <RecipeCard
              title={t(`สูตร${superLabel} ~${superL} L`, `${superLabel} mix ~${superL} L`)}
              lines={analysis.superMixPlan}
            />
          </div>
        </section>
      )}

      <section className="rounded-xl border border-border bg-card/60 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t("คุณขาดอะไรบ้าง", "What you're missing")}
        </p>
        {gaps.length ? (
          <ol className="mt-4 space-y-3">
            {gaps.map((gap, i) => (
              <li key={`${i}-${gap}`} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-sm font-bold text-emerald-400">
                  {i + 1}
                </span>
                <span className="pt-1 text-sm font-medium text-foreground">{gap}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("วัสดุที่มีครบเป้าโดยประมาณแล้ว", "Looks like you have enough for the target")}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card/60 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t(
            `ต้องซื้อเพิ่ม เพื่อครบ ${baseLabel} ${baseL} L + ${superLabel} ${superL} L`,
            `Buy more to finish ${baseLabel} ${baseL} L + ${superLabel} ${superL} L`
          )}
        </p>
        {syncedBuyLinks.length ? (
          <ul className="mt-4 space-y-3">
            {syncedBuyLinks.map((item) => (
              <li
                key={`${item.keyword}-${item.name}`}
                className="flex flex-col gap-3 rounded-lg border border-border bg-background/50 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-orange-400">
                    {t("ปริมาณ", "Qty")}: {item.amount}
                  </p>
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
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("ไม่ต้องซื้อเพิ่มในรอบนี้", "No extra purchases needed this round")}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t("วิธีผสมและเตรียมดินก่อนปลูก", "Mix & prep before planting")}
        </p>
        {analysis.howToUse.why ? (
          <p className="text-sm text-muted-foreground">{analysis.howToUse.why}</p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <PrepGuideCard
            title={prepGuides.superPrep.title}
            steps={prepGuides.superPrep.steps}
            accent="emerald"
          />
          <PrepGuideCard
            title={prepGuides.basePrep.title}
            steps={prepGuides.basePrep.steps}
            accent="neutral"
          />
        </div>
        <PrepGuideCard
          title={prepGuides.potFill.title}
          steps={prepGuides.potFill.steps}
          accent="neutral"
        />
      </section>
    </div>
  );
}
