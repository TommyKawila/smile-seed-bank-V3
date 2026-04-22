"use client";

import { useCallback } from "react";
import { Mars, Venus, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseListParam, type ShopFilterOptionCounts, defaultFilterOptionCounts } from "@/lib/shop-attribute-filters";
import { useProductFilters } from "@/hooks/use-product-filters";
import { useTranslations } from "@/hooks/use-translations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ShopPriceFilterPanel } from "@/components/storefront/ShopPriceFilter";

type TFn = (th: string, en: string) => string;

type ListKey = "genetics" | "difficulty" | "thc" | "cbd" | "sex";

function toggleListParam(
  router: ReturnType<typeof useRouter>,
  pathname: string,
  searchParams: URLSearchParams,
  key: ListKey,
  slug: string
) {
  const sp = new URLSearchParams(searchParams.toString());
  const cur = parseListParam(sp.get(key));
  const lower = slug.toLowerCase();
  const next = cur.includes(lower) ? cur.filter((s) => s !== lower) : [...cur, lower];
  if (next.length === 0) sp.delete(key);
  else sp.set(key, next.join(","));
  const q = sp.toString();
  router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
}

const GENETICS_ROWS: {
  slug: string;
  labelTh: string;
  labelEn: string;
  icon: "hybrid" | "sativa" | "indica";
}[] = [
  { slug: "hybrid", labelTh: "ไฮบริด", labelEn: "Hybrid", icon: "hybrid" },
  { slug: "sativa-dom", labelTh: "เน้นซาติวา", labelEn: "Sativa-dom", icon: "sativa" },
  { slug: "indica-dom", labelTh: "เน้นอินดิกา", labelEn: "Indica-dom", icon: "indica" },
];

const GENETICS_ICON_COLORS = {
  sativa: "text-emerald-500",
  indica: "text-violet-500",
  hybrid: "text-teal-600",
} as const;

function SativaNarrowLeafIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <ellipse cx="12" cy="10" rx="2.25" ry="8.25" fill="currentColor" />
      <rect x="11" y="17.25" width="2" height="4.5" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function IndicaBroadLeafIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <ellipse cx="12" cy="11" rx="8" ry="5" fill="currentColor" />
      <rect x="11" y="14.5" width="2" height="4.5" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function HybridBalancedLeafIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <ellipse cx="12" cy="10.5" rx="4.75" ry="7" fill="currentColor" />
      <rect x="11" y="16.25" width="2" height="4.5" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function GeneticsDominanceIcon({
  variant,
  className,
}: {
  variant: "hybrid" | "sativa" | "indica";
  className?: string;
}) {
  switch (variant) {
    case "sativa":
      return <SativaNarrowLeafIcon className={className} />;
    case "indica":
      return <IndicaBroadLeafIcon className={className} />;
    default:
      return <HybridBalancedLeafIcon className={className} />;
  }
}

const DIFF_ROWS: { slug: string; labelTh: string; labelEn: string }[] = [
  { slug: "easy", labelTh: "ง่าย", labelEn: "Easy" },
  { slug: "moderate", labelTh: "ปานกลาง", labelEn: "Moderate" },
  { slug: "hard", labelTh: "ยาก", labelEn: "Hard" },
];

const THC_ROWS: { slug: string; labelTh: string; labelEn: string }[] = [
  { slug: "high", labelTh: "สูง (>20%)", labelEn: "High (>20%)" },
  { slug: "mid", labelTh: "กลาง (15–20%)", labelEn: "Mid (15–20%)" },
  { slug: "low", labelTh: "ต่ำ (<15%)", labelEn: "Low (<15%)" },
];

const CBD_ROWS: { slug: string; labelTh: string; labelEn: string }[] = [
  { slug: "high", labelTh: "สูง (>5%)", labelEn: "High (>5%)" },
  { slug: "mid", labelTh: "กลาง (2–5%)", labelEn: "Mid (2–5%)" },
  { slug: "low", labelTh: "ต่ำ (<2%)", labelEn: "Low (<2%)" },
];

const SEX_ROWS: { slug: "feminized" | "regular"; labelTh: string; labelEn: string; fem: boolean }[] = [
  { slug: "feminized", labelTh: "Fem", labelEn: "Fem", fem: true },
  { slug: "regular", labelTh: "Reg", labelEn: "Reg", fem: false },
];

const SEEDS_PACK_ROWS: { slug: string; labelTh: string; labelEn: string; i18n?: "pack_2" | "other" }[] = [
  { slug: "1", labelTh: "1 เมล็ด", labelEn: "1 Seeds Pack" },
  { slug: "2", labelTh: "2 เมล็ด", labelEn: "2 Seeds", i18n: "pack_2" },
  { slug: "3", labelTh: "3 เมล็ด", labelEn: "3 Seeds Pack" },
  { slug: "5", labelTh: "5 เมล็ด", labelEn: "5 Seeds Pack" },
  { slug: "10", labelTh: "10 เมล็ด", labelEn: "10 Seeds Pack" },
  { slug: "gt10", labelTh: "มากกว่า 10 เมล็ด", labelEn: "More than 10 seeds" },
  { slug: "other", labelTh: "ขนาดอื่นๆ", labelEn: "Other Sizes", i18n: "other" },
];

/** Shared filter fields (URL-driven). */
export function FilterSidebarContent({
  t,
  counts = defaultFilterOptionCounts(),
  priceFilter,
}: {
  t: TFn;
  counts?: ShopFilterOptionCounts;
  priceFilter?: {
    cap: number;
    min: number | null;
    max: number | null;
    onRangeChange: (min: number | null, max: number | null) => void;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { seeds: seedsSelected, toggleSeed } = useProductFilters();
  const { t: tMsg } = useTranslations();

  const geneticsOn = useCallback(
    (slug: string) => parseListParam(searchParams.get("genetics")).includes(slug),
    [searchParams]
  );
  const difficultyOn = useCallback(
    (slug: string) => parseListParam(searchParams.get("difficulty")).includes(slug),
    [searchParams]
  );
  const thcOn = useCallback(
    (slug: string) => parseListParam(searchParams.get("thc")).includes(slug),
    [searchParams]
  );
  const cbdOn = useCallback(
    (slug: string) => parseListParam(searchParams.get("cbd")).includes(slug),
    [searchParams]
  );
  const sexOn = useCallback(
    (slug: string) => parseListParam(searchParams.get("sex")).includes(slug),
    [searchParams]
  );

  const toggleG = useCallback(
    (slug: string) => toggleListParam(router, pathname, searchParams, "genetics", slug),
    [router, pathname, searchParams]
  );
  const toggleD = useCallback(
    (slug: string) => toggleListParam(router, pathname, searchParams, "difficulty", slug),
    [router, pathname, searchParams]
  );
  const toggleT = useCallback(
    (slug: string) => toggleListParam(router, pathname, searchParams, "thc", slug),
    [router, pathname, searchParams]
  );
  const toggleC = useCallback(
    (slug: string) => toggleListParam(router, pathname, searchParams, "cbd", slug),
    [router, pathname, searchParams]
  );
  const toggleS = useCallback(
    (slug: string) => toggleListParam(router, pathname, searchParams, "sex", slug),
    [router, pathname, searchParams]
  );

  const checkboxClass =
    "peer h-3 w-3 shrink-0 rounded-sm border border-primary/55 text-primary accent-primary focus:ring-1 focus:ring-primary/35 focus:ring-offset-0";

  const seedsCheckboxClass =
    "peer h-3 w-3 shrink-0 rounded-sm border border-emerald-600/45 text-emerald-600 accent-emerald-600 focus:ring-1 focus:ring-emerald-500/35 focus:ring-offset-0";

  const rowClass = (on: boolean, isZero: boolean) =>
    `flex w-full cursor-pointer items-center gap-2 rounded-sm border px-2.5 py-2 text-sm font-sans transition-colors ${
      isZero ? "opacity-60" : ""
    } ${
      on
        ? "border-primary/40 bg-primary/[0.06] text-zinc-900"
        : "border-zinc-200/90 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50/80"
    }`;

  const sexRowClass = (on: boolean, isFem: boolean, isZero: boolean) =>
    `flex w-full cursor-pointer items-center gap-2 rounded-sm border px-2.5 py-2 text-sm font-sans transition-colors ${
      isZero ? "opacity-60" : ""
    } ${
      on
        ? isFem
          ? "border-zinc-300 bg-secondary/40 text-zinc-900"
          : "border-primary/40 bg-primary/[0.06] text-primary"
        : "border-zinc-200/90 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50/80"
    }`;

  const seedsRowClass = (on: boolean, isZero: boolean) =>
    `flex w-full cursor-pointer items-center gap-2 rounded-sm border px-2.5 py-2 text-sm font-sans transition-colors ${
      isZero ? "opacity-60" : ""
    } ${
      on
        ? "border-emerald-600/35 bg-emerald-50/60 text-emerald-900"
        : "border-zinc-200/90 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50/80"
    }`;

  return (
    <div className="space-y-5 font-sans">
      {priceFilter ? (
        <ShopPriceFilterPanel
          t={t}
          cap={priceFilter.cap}
          min={priceFilter.min}
          max={priceFilter.max}
          onRangeChange={priceFilter.onRangeChange}
          showChips={false}
          showSlider
          className="mb-0"
        />
      ) : null}
      <div>
        <p className="mb-2 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
          {t("ขนาดแพ็กเกจ", "Package size")}
        </p>
        <div className="space-y-1.5">
          {SEEDS_PACK_ROWS.map(({ slug, labelTh, labelEn, i18n }) => {
            const on = seedsSelected.includes(slug);
            const cnt = counts.seeds[slug] ?? 0;
            const label =
              i18n === "pack_2"
                ? tMsg("seed_filter.pack_2", labelEn)
                : i18n === "other"
                  ? tMsg("seed_filter.other", labelEn)
                  : t(labelTh, labelEn);
            return (
              <label key={slug} className={seedsRowClass(on, cnt === 0)}>
                <input
                  type="checkbox"
                  className={seedsCheckboxClass}
                  checked={on}
                  onChange={() => toggleSeed(slug)}
                />
                <span className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="font-sans text-[11px] font-medium tabular-nums tracking-wide text-zinc-600">
                    {label}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-sans text-[10px] font-normal tabular-nums",
                      cnt === 0 ? "text-zinc-400" : "text-zinc-500"
                    )}
                  >
                    ({cnt})
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>
      <p className="border-b border-zinc-200/90 pb-2.5 font-sans text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-500">
        {t("ห้องปฏิบัติการกรอง", "THE LAB")}
      </p>
      <div>
        <p className="mb-2 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
          {t("พันธุกรรม", "Genetics")}
        </p>
        <div className="space-y-1.5">
          {GENETICS_ROWS.map(({ slug, labelTh, labelEn, icon }) => {
            const on = geneticsOn(slug);
            const tint = GENETICS_ICON_COLORS[icon];
            const cnt = counts.genetics[slug] ?? 0;
            return (
              <label key={slug} className={rowClass(on, cnt === 0)}>
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={on}
                  onChange={() => toggleG(slug)}
                />
                <span className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center [&_svg]:h-5 [&_svg]:w-5 ${tint} ${
                      on ? "" : "opacity-40"
                    }`}
                    aria-hidden
                  >
                    <GeneticsDominanceIcon variant={icon} />
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      className={cn(
                        "font-sans text-[11px] font-medium leading-tight tabular-nums tracking-wide",
                        on ? "text-primary" : "text-zinc-600"
                      )}
                    >
                      {t(labelTh, labelEn)}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-sans text-[10px] font-normal tabular-nums",
                        cnt === 0 ? "text-zinc-400" : "text-zinc-500"
                      )}
                    >
                      ({cnt})
                    </span>
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2.5 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
          {t("THC & CBD", "THC & CBD")}
        </p>
        <p className="mb-1.5 font-sans text-[9px] font-medium uppercase tracking-[0.18em] text-zinc-500">
          THC
        </p>
        <div className="mb-3 space-y-1.5">
          {THC_ROWS.map(({ slug, labelTh, labelEn }) => {
            const on = thcOn(slug);
            const cnt = counts.thc[slug] ?? 0;
            return (
              <label key={`thc-${slug}`} className={rowClass(on, cnt === 0)}>
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={on}
                  onChange={() => toggleT(slug)}
                />
                <span className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="font-sans text-[11px] font-medium tabular-nums tracking-wide text-zinc-700">
                    {t(labelTh, labelEn)}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-sans text-[10px] font-normal tabular-nums",
                      cnt === 0 ? "text-zinc-400" : "text-zinc-500"
                    )}
                  >
                    ({cnt})
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <p className="mb-1.5 font-sans text-[9px] font-medium uppercase tracking-[0.18em] text-zinc-500">
          CBD
        </p>
        <div className="space-y-1.5">
          {CBD_ROWS.map(({ slug, labelTh, labelEn }) => {
            const on = cbdOn(slug);
            const cnt = counts.cbd[slug] ?? 0;
            return (
              <label key={`cbd-${slug}`} className={rowClass(on, cnt === 0)}>
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={on}
                  onChange={() => toggleC(slug)}
                />
                <span className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="font-sans text-[11px] font-medium tabular-nums tracking-wide text-zinc-700">
                    {t(labelTh, labelEn)}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-sans text-[10px] font-normal tabular-nums",
                      cnt === 0 ? "text-zinc-400" : "text-zinc-500"
                    )}
                  >
                    ({cnt})
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
          {t("ระดับความยาก", "Difficulty")}
        </p>
        <div className="space-y-1.5">
          {DIFF_ROWS.map(({ slug, labelTh, labelEn }) => {
            const on = difficultyOn(slug);
            const cnt = counts.difficulty[slug] ?? 0;
            return (
              <label key={slug} className={rowClass(on, cnt === 0)}>
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={on}
                  onChange={() => toggleD(slug)}
                />
                <span className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="font-sans text-[11px] font-medium tabular-nums tracking-wide text-zinc-700">
                    {t(labelTh, labelEn)}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-sans text-[10px] font-normal tabular-nums",
                      cnt === 0 ? "text-zinc-400" : "text-zinc-500"
                    )}
                  >
                    ({cnt})
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
          {t("ประเภทเพศเมล็ด", "Sex type")}
        </p>
        <div className="space-y-1.5">
          {SEX_ROWS.map(({ slug, labelTh, labelEn, fem }) => {
            const on = sexOn(slug);
            const cnt = counts.sex[slug] ?? 0;
            return (
              <label key={slug} className={sexRowClass(on, fem, cnt === 0)}>
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={on}
                  onChange={() => toggleS(slug)}
                />
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  {fem ? (
                    <Venus className="h-4 w-4 shrink-0 text-secondary-foreground" aria-hidden />
                  ) : (
                    <Mars className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  )}
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="font-sans text-[11px] font-medium tabular-nums tracking-wide text-zinc-700">
                      {t(labelTh, labelEn)}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-sans text-[10px] font-normal tabular-nums",
                        cnt === 0 ? "text-zinc-400" : "text-zinc-500"
                      )}
                    >
                      ({cnt})
                    </span>
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Desktop / lg+ sticky sidebar. top ≈ Navbar 112px + search strip ~110px + 8px gap → 230px. */
export function FilterSidebar({
  t,
  counts,
  priceFilter,
}: {
  t: TFn;
  counts: ShopFilterOptionCounts;
  priceFilter?: {
    cap: number;
    min: number | null;
    max: number | null;
    onRangeChange: (min: number | null, max: number | null) => void;
  };
}) {
  return (
    <div
      id="shop-filters-desktop"
      className="sticky z-10 flex min-h-0 w-full max-w-[280px] flex-1 flex-col self-stretch rounded-sm border border-zinc-200/90 bg-white shadow-sm lg:top-[230px] lg:max-h-[calc(100vh-230px)]"
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl px-4 pb-5 pt-5 [-webkit-overflow-scrolling:touch]">
        <FilterSidebarContent t={t} counts={counts} priceFilter={priceFilter} />
      </div>
    </div>
  );
}

/** Mobile sheet with header, scroll, sticky footer. */
export function ShopFilterMobileSheet({
  t,
  counts,
  open,
  onOpenChange,
  resultCount,
  onClearAll,
}: {
  t: TFn;
  counts: ShopFilterOptionCounts;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resultCount: number;
  onClearAll: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        id="shop-filters"
        side="right"
        className="flex h-full max-h-[100dvh] w-full max-w-md flex-col gap-0 border-l border-zinc-200/90 bg-white p-0 shadow-xl [&>button]:hidden"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/90 px-4 py-3.5 backdrop-blur-md">
          <SheetTitle className="text-left text-base font-semibold text-primary">
            {t("ตัวกรอง", "Filters")}
          </SheetTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
            aria-label={t("ปิด", "Close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch]">
          <FilterSidebarContent t={t} counts={counts} />
        </div>

        <div className="shrink-0 border-t border-zinc-200/80 bg-white/90 p-4 backdrop-blur-md pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="w-full border-zinc-200 sm:flex-1"
              onClick={() => onClearAll()}
            >
              {t("ล้างทั้งหมด", "Clear all")}
            </Button>
            <Button
              type="button"
              className="w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90 sm:flex-[1.15]"
              onClick={() => onOpenChange(false)}
            >
              {t(`แสดงผล (${resultCount}) รายการ`, `Show ${resultCount} results`)}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
