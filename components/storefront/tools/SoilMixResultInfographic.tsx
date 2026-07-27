"use client";

import { useCallback, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Download,
  Droplets,
  ExternalLink,
  Flame,
  Layers,
  Leaf,
  Loader2,
  Package,
  Shovel,
  Sprout,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { domElementToPngBlob, saveOrSharePngBlob } from "@/lib/save-dom-image";
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
import {
  getSoilMaterialIcon,
  SOIL_SECTION_ICONS,
} from "@/lib/soil-mixer-icons";
import { SoilMixRecipePie } from "@/components/storefront/tools/SoilMixRecipePie";
import Link from "next/link";
import { articleHref } from "@/lib/soil-mixer-knowledge";
import { buildShopeeSearchUrl } from "@/lib/shopee-affiliate";
import { cn } from "@/lib/utils";

function PrepGuideCard({
  title,
  steps,
  accent,
  headerIcon: HeaderIcon,
  stepIcons,
}: {
  title: string;
  steps: string[];
  accent?: "emerald" | "neutral";
  headerIcon: LucideIcon;
  stepIcons: LucideIcon[];
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2.5 sm:p-3",
        accent === "emerald"
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-border bg-card/60"
      )}
    >
      <div className="mb-2 flex items-start gap-2">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            accent === "emerald" ? "bg-emerald-500/20" : "bg-background/60"
          )}
        >
          <HeaderIcon
            className={cn(
              "h-4 w-4",
              accent === "emerald" ? "text-emerald-400" : "text-muted-foreground"
            )}
            aria-hidden
          />
        </div>
        <p className="pt-0.5 text-xs font-semibold leading-snug text-foreground sm:text-sm">
          {title}
        </p>
      </div>
      <ol className="space-y-2">
        {steps.map((s, i) => {
          const StepIcon = stepIcons[i] ?? Leaf;
          return (
            <li key={s} className="flex gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/50 bg-background/50">
                <StepIcon className="h-3.5 w-3.5 text-emerald-400/80" aria-hidden />
              </div>
              <span className="pt-0.5 text-[11px] leading-relaxed text-foreground/90 sm:text-xs">
                {s}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function RecipeLineRow({ line }: { line: SoilMixRecipeLine }) {
  const { t } = useLanguage();
  const MatIcon = getSoilMaterialIcon(line.ingredientId ?? line.name);
  const have = line.have && line.have !== "—" ? line.have : "0";

  const badge =
    line.status === "ok"
      ? { label: t("ครบ", "OK"), className: "bg-emerald-500/15 text-emerald-400" }
      : line.status === "short"
        ? {
            label: t(`+${line.buyMore || "—"}`, `+${line.buyMore || "—"}`),
            className: "bg-amber-500/15 text-amber-400",
          }
        : {
            label: t(
              `ซื้อ ${line.buyMore || line.need}`,
              `Buy ${line.buyMore || line.need}`
            ),
            className: "bg-orange-500/15 text-orange-400",
          };

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-md border px-2 py-1.5 text-[11px] sm:flex-nowrap sm:text-xs",
        line.status === "ok" && "border-emerald-500/20 bg-emerald-500/5",
        line.status === "short" && "border-amber-500/25 bg-amber-500/5",
        line.status === "missing" && "border-orange-500/30 bg-orange-500/5"
      )}
    >
      <MatIcon className="h-3.5 w-3.5 shrink-0 text-emerald-400/80" aria-hidden />
      <span className="min-w-0 flex-1 truncate font-medium text-foreground">{line.name}</span>
      <span className="hidden shrink-0 tabular-nums text-muted-foreground sm:inline">
        {line.need}
      </span>
      <span className="hidden shrink-0 text-muted-foreground/50 sm:inline">/</span>
      <span className="hidden shrink-0 tabular-nums text-muted-foreground sm:inline">{have}</span>
      <span className="shrink-0 tabular-nums text-muted-foreground sm:hidden">{line.need}</span>
      <span
        className={cn(
          "shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold leading-none sm:text-[10px]",
          badge.className
        )}
      >
        {badge.label}
      </span>
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
    <div className="rounded-lg border border-border bg-card/60 p-2.5 sm:p-3">
      <p className="text-[11px] font-semibold text-foreground sm:text-xs">{title}</p>
      {lines.length ? (
        <>
          <SoilMixRecipePie lines={lines} totalLabel={title} className="mt-2" />
          <ul className="mt-2 space-y-1">
            {lines.map((line, i) => (
              <RecipeLineRow key={`${line.name}-${i}`} line={line} />
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">—</p>
      )}
    </div>
  );
}

export function SoilMixResultInfographic({
  analysis,
  buyLinks,
  aiEnabled = true,
  onAsk,
}: {
  analysis: SoilMixAnalysis;
  buyLinks: SoilMixBuyLink[];
  aiEnabled?: boolean;
  onAsk?: (question: string) => Promise<string | null>;
}) {
  const { t, locale } = useLanguage();
  const isEn = locale === "en";
  const [askQ, setAskQ] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
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

  const recipeExportRef = useRef<HTMLDivElement>(null);
  const [savingRecipe, setSavingRecipe] = useState(false);

  const saveRecipeImage = useCallback(async () => {
    const el = recipeExportRef.current;
    if (!el || savingRecipe) return;
    setSavingRecipe(true);
    try {
      const blob = await domElementToPngBlob(el);
      if (!blob) {
        toast.error(t("บันทึกรูปไม่สำเร็จ ลองใหม่", "Could not save image — try again"));
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      const filename = `smile-soil-mix-${stamp}.png`;
      const result = await saveOrSharePngBlob(
        blob,
        filename,
        t("สูตรผสมดิน Smile Seed Bank", "Smile Seed Bank soil mix")
      );
      if (result === "downloaded" || result === "shared") {
        toast.success(t("บันทึกรูปแล้ว", "Image saved"));
      }
    } finally {
      setSavingRecipe(false);
    }
  }, [savingRecipe, t]);

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3.5 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400 sm:text-[11px]">
          {t("สรุปการวิเคราะห์", "Analysis summary")}
        </p>
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-foreground sm:mt-2 sm:text-base">
          {analysis.summary}
        </p>
        <Link
          href={articleHref()}
          className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-emerald-400 underline-offset-4 hover:underline sm:text-sm"
        >
          {t("อ่านหลักการสูตร Super soil", "Read Super soil recipe principles")}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
          <div className="rounded-lg border border-border bg-background/50 p-3 text-center sm:p-4">
            <SOIL_SECTION_ICONS.base
              className="mx-auto h-4 w-4 text-muted-foreground sm:h-5 sm:w-5"
              aria-hidden
            />
            <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">
              {t(`${baseLabel} 2/3`, `${baseLabel} 2/3`)}
            </p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground sm:text-2xl">
              {baseL} L
            </p>
          </div>
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center sm:p-4">
            <SOIL_SECTION_ICONS.super
              className="mx-auto h-4 w-4 text-emerald-400 sm:h-5 sm:w-5"
              aria-hidden
            />
            <p className="mt-1 text-[10px] text-emerald-300/90 sm:text-xs">
              {t(`${superLabel} 1/3`, `${superLabel} 1/3`)}
            </p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-emerald-400 sm:text-2xl">
              {superL} L
            </p>
          </div>
        </div>
      </section>

      {(analysis.baseMixPlan.length > 0 || analysis.superMixPlan.length > 0) && (
        <section className="space-y-2 sm:space-y-3">
          <div className="flex sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={savingRecipe}
              className="min-h-11 w-full gap-2 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 sm:w-auto"
              onClick={() => void saveRecipeImage()}
            >
              {savingRecipe ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Download className="h-4 w-4" aria-hidden />
              )}
              {t("บันทึกรูปสูตร", "Save recipe")}
            </Button>
          </div>
          <div
            ref={recipeExportRef}
            className="space-y-2 rounded-xl border border-border bg-background p-3 sm:space-y-3 sm:p-4"
          >
            <div className="flex flex-wrap gap-1.5 text-[10px] sm:gap-2 sm:text-[11px]">
              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-400 sm:py-1">
                {t("ครบ", "OK")}
              </span>
              <span className="rounded-md bg-amber-500/15 px-2 py-0.5 font-medium text-amber-400 sm:py-1">
                {t("ซื้อเพิ่ม", "Buy more")}
              </span>
              <span className="rounded-md bg-orange-500/15 px-2 py-0.5 font-medium text-orange-400 sm:py-1">
                {t("ไม่มีในมือ", "None on hand")}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <RecipeCard
                title={t(`สูตร ${baseLabel} ~${baseL} L`, `${baseLabel} mix ~${baseL} L`)}
                lines={analysis.baseMixPlan}
              />
              <RecipeCard
                title={t(`สูตร ${superLabel} ~${superL} L`, `${superLabel} mix ~${superL} L`)}
                lines={analysis.superMixPlan}
              />
            </div>
            <p className="text-center text-[10px] text-muted-foreground sm:text-[11px]">
              Smile Seed Bank · {potCount} {t("กระถาง", "pots")} · {baseL} L + {superL} L
            </p>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-border bg-card/60 p-3 sm:p-4">
        <div className="flex items-start gap-2">
          <SOIL_SECTION_ICONS.missing
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">
              {t("คุณขาดอะไรบ้าง", "What you're missing")}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground/80 sm:text-[11px]">
              {t(
                `ซื้อเพิ่ม · ${baseL} L + ${superL} L`,
                `Buy more · ${baseL} L + ${superL} L`
              )}
            </p>
          </div>
        </div>
        {syncedBuyLinks.length ? (
          <ul className="mt-2 space-y-1 sm:mt-2.5">
            {syncedBuyLinks.map((item) => {
              const ItemIcon = getSoilMaterialIcon(item.ingredientId ?? item.name);
              return (
                <li
                  key={`${item.keyword}-${item.name}`}
                  className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/40 px-2 py-2 sm:gap-2 sm:px-2.5 sm:py-1.5"
                >
                  <ItemIcon
                    className="h-3.5 w-3.5 shrink-0 text-amber-400/80"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 text-[11px] font-medium leading-snug text-foreground sm:truncate sm:text-xs">
                    {item.name}
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold tabular-nums text-orange-400 sm:text-[11px]">
                    {item.amount}
                  </span>
                  <a
                    href={item.shopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t(`ซื้อ ${item.name} บน Shopee`, `Buy ${item.name} on Shopee`)}
                    className="inline-flex min-h-11 min-w-[3.25rem] shrink-0 items-center justify-center gap-1 rounded-md bg-orange-500 px-2.5 text-[10px] font-semibold text-white transition hover:bg-orange-400 sm:min-w-11 sm:px-2.5 sm:text-[11px]"
                  >
                    <span className="hidden sm:inline">{t("Shopee", "Shopee")}</span>
                    <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                  </a>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
            {t("วัสดุที่มีครบเป้าโดยประมาณแล้ว — ไม่ต้องซื้อเพิ่มในรอบนี้", "Looks like you have enough — no extra purchases needed")}
          </p>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card/40 p-3 sm:p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
              <SOIL_SECTION_ICONS.prep className="h-5 w-5 text-emerald-400" aria-hidden />
            </div>
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              {t("วิธีผสมและเตรียมดิน", "Mix & prep soil")}
            </h2>
          </div>
          <p className="mx-auto w-full max-w-prose rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-xs font-medium leading-relaxed text-amber-300 sm:text-sm">
              {t(
                "Super soil สารอาหารเข้มมาก และ ร้อน ห้ามใช้ปลูกทันที ต้องหมักก่อนใช้",
                "Super soil is very hot and nutrient-rich — do not plant directly; cure before use"
              )}
            </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
          <PrepGuideCard
            title={prepGuides.superPrep.title}
            steps={prepGuides.superPrep.steps}
            accent="emerald"
            headerIcon={SOIL_SECTION_ICONS.super}
            stepIcons={[Package, Shovel, Droplets, Timer, Leaf]}
          />
          <PrepGuideCard
            title={prepGuides.basePrep.title}
            steps={prepGuides.basePrep.steps}
            accent="neutral"
            headerIcon={SOIL_SECTION_ICONS.base}
            stepIcons={[Layers, Shovel, Flame, Droplets]}
          />
        </div>
        <PrepGuideCard
          title={prepGuides.potFill.title}
          steps={prepGuides.potFill.steps}
          accent="neutral"
          headerIcon={SOIL_SECTION_ICONS.pot}
          stepIcons={[Layers, Droplets, Layers, Sprout, Flame]}
        />
      </section>

      {aiEnabled && onAsk ? (
        <section className="rounded-xl border border-border bg-card/40 p-3 sm:p-4">
          <p className="text-xs font-semibold text-foreground sm:text-sm">
            {t("ถามเพิ่มเกี่ยวกับสูตรนี้", "Ask about this mix")}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">
            {t(
              "ตอบจากหลักการ Smile Seed Bank เท่านั้น",
              "Answers use Smile Seed Bank knowledge only"
            )}
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={askQ}
              maxLength={400}
              placeholder={t("เช่น ทำไม guano อยู่แค่ Super?", "e.g. Why is guano only in Super?")}
              className="min-h-11 flex-1 rounded-lg border border-border bg-background px-3 text-sm"
              onChange={(e) => setAskQ(e.target.value)}
            />
            <Button
              type="button"
              disabled={askLoading || !askQ.trim()}
              className="min-h-11 shrink-0 bg-emerald-600 hover:bg-emerald-500"
              onClick={() => {
                if (!onAsk || !askQ.trim()) return;
                setAskLoading(true);
                void onAsk(askQ.trim())
                  .then((a) => {
                    setAskAnswer(a);
                    if (!a) toast.error(t("ถามไม่สำเร็จ", "Question failed"));
                  })
                  .finally(() => setAskLoading(false));
              }}
            >
              {askLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                t("ถาม", "Ask")
              )}
            </Button>
          </div>
          {askAnswer ? (
            <p className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-xs leading-relaxed text-foreground sm:text-sm">
              {askAnswer}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
