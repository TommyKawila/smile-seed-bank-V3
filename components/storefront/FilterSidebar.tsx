"use client";

import { useCallback, type ReactNode } from "react";
import {
  Check,
  FlaskConical,
  Package,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import {
  CatalogSidebarQuickFilters,
  type CatalogSidebarQuickFiltersProps,
} from "@/components/storefront/CatalogSidebarQuickFilters";
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

const SEEDS_PACK_ROWS: { slug: string; labelTh: string; labelEn: string; i18n?: "pack_2" | "other" }[] = [
  { slug: "1", labelTh: "1 เมล็ด", labelEn: "1 Seeds Pack" },
  { slug: "2", labelTh: "2 เมล็ด", labelEn: "2 Seeds", i18n: "pack_2" },
  { slug: "3", labelTh: "3 เมล็ด", labelEn: "3 Seeds Pack" },
  { slug: "5", labelTh: "5 เมล็ด", labelEn: "5 Seeds Pack" },
  { slug: "10", labelTh: "10 เมล็ด", labelEn: "10 Seeds Pack" },
  { slug: "gt10", labelTh: "มากกว่า 10 เมล็ด", labelEn: "More than 10 seeds" },
  { slug: "other", labelTh: "ขนาดอื่นๆ", labelEn: "Other Sizes", i18n: "other" },
];

type FilterPresentation = "sidebar" | "mobile";

const sectionHeadingClass =
  "font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500";
const subSectionHeadingClass =
  "font-sans text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500/80";

/** V4 filter panel tokens. */
const filterCardClass =
  "rounded-2xl border border-border/60 bg-zinc-950/40 p-4";
const filterCardTintClass =
  "rounded-2xl border border-border/60 bg-zinc-950/40 p-4";
const filterLabDividerClass =
  "flex items-center gap-3 rounded-xl border border-border/60 bg-zinc-950/30 px-4 py-3";

function FilterSectionHeading({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="shrink-0 text-zinc-500 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight text-zinc-200">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 text-xs leading-snug text-zinc-500">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Shared filter fields (URL-driven). */
export function FilterSidebarContent({
  t,
  counts = defaultFilterOptionCounts(),
  priceFilter,
  presentation = "sidebar",
}: {
  t: TFn;
  counts?: ShopFilterOptionCounts;
  priceFilter?: {
    cap: number;
    min: number | null;
    max: number | null;
    onRangeChange: (min: number | null, max: number | null) => void;
  };
  presentation?: FilterPresentation;
}) {
  const isMobile = presentation === "mobile";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { seeds: seedsSelected, toggleSeed } = useProductFilters();
  const { t: tMsg } = useTranslations();

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
  const checkboxClass =
    "peer h-3 w-3 shrink-0 rounded-sm border border-zinc-600 text-zinc-400 accent-zinc-400 focus:ring-1 focus:ring-zinc-500/35 focus:ring-offset-0";

  const seedsCheckboxClass =
    "peer h-3 w-3 shrink-0 rounded-sm border border-zinc-600 text-zinc-400 accent-zinc-400 focus:ring-1 focus:ring-zinc-500/35 focus:ring-offset-0";

  const rowClass = (on: boolean, isZero: boolean) =>
    isMobile
      ? mobileRowClass(on, isZero, "default")
      : cn(
          "flex w-full cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-sm font-sans transition-colors",
          isZero && "opacity-55",
          on
            ? "border-zinc-600 bg-zinc-900 text-zinc-100"
            : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-300"
        );

  const seedsRowClass = (on: boolean, isZero: boolean) =>
    isMobile
      ? mobileRowClass(on, isZero, "seeds")
      : cn(
          "flex w-full cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-sm font-sans transition-colors",
          isZero && "opacity-55",
          on
            ? "border-zinc-600 bg-zinc-900 text-zinc-100"
            : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-300"
        );

  const mobileRowClass = (
    on: boolean,
    isZero: boolean,
    tone: "default" | "fem" | "reg" | "seeds"
  ) => {
    const base =
      "flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 font-sans transition-colors active:scale-[0.98]";
    if (isZero) return cn(base, "opacity-50");
    if (!on) {
      return cn(
        base,
        "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-300"
      );
    }
    if (tone === "fem")
      return cn(base, "border-zinc-600 bg-zinc-800/80 text-zinc-100");
    return cn(base, "border-zinc-600 bg-zinc-800/80 text-zinc-100");
  };

  const countBadgeClass = (on: boolean, isZero: boolean, tone: "default" | "fem" | "seeds" = "default") => {
    if (isMobile) {
      if (on) return "rounded-full bg-zinc-700/60 px-2.5 py-0.5 text-xs font-medium tabular-nums text-zinc-300";
      return cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums",
        isZero ? "text-zinc-600" : "text-zinc-500"
      );
    }
    return cn(
      "shrink-0 font-sans text-[10px] font-medium tabular-nums",
      isZero ? "text-zinc-600" : on ? "text-zinc-400" : "text-zinc-500"
    );
  };

  const labelTextClass = (on: boolean) =>
    isMobile
      ? cn("text-sm font-semibold leading-tight", on ? "text-zinc-100" : "text-zinc-400")
      : cn(
          "font-sans text-[11px] font-medium tracking-wide",
          on ? "font-semibold text-zinc-100" : "text-zinc-400"
        );

  const mobileCheck = (on: boolean) =>
    on ? (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-500 bg-zinc-700/60">
        <Check className="h-4 w-4 stroke-[2.5] text-zinc-200" aria-hidden />
      </span>
    ) : (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50" />
    );

  return (
    <div className={cn("font-sans", isMobile ? "space-y-6" : "space-y-5")}>
      {priceFilter ? (
        <ShopPriceFilterPanel
          t={t}
          cap={priceFilter.cap}
          min={priceFilter.min}
          max={priceFilter.max}
          onRangeChange={priceFilter.onRangeChange}
          showChips={false}
          showSlider
          presentation="sidebar"
          className="mb-0"
        />
      ) : null}
      <div className={cn(isMobile && filterCardTintClass)}>
        {isMobile ? (
          <FilterSectionHeading
            icon={<Package className="h-5 w-5" strokeWidth={2} />}
            title={t("ขนาดแพ็กเกจ", "Package size")}
            subtitle={t("เลือกจำนวนเมล็ดต่อแพ็ก", "Seeds per pack")}
          />
        ) : (
          <p className={cn(sectionHeadingClass, "mb-2")}>
            {t("ขนาดแพ็กเกจ", "Package size")}
          </p>
        )}
        <div className={cn(isMobile ? "grid grid-cols-2 gap-2" : "space-y-1.5")}>
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
                  className={isMobile ? "sr-only" : seedsCheckboxClass}
                  checked={on}
                  onChange={() => toggleSeed(slug)}
                />
                {isMobile ? mobileCheck(on) : null}
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className={labelTextClass(on)}>{label}</span>
                  <span className={countBadgeClass(on, cnt === 0, "seeds")}>
                    {isMobile ? cnt : `(${cnt})`}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>
      {isMobile ? (
        <div className={filterLabDividerClass}>
          <FlaskConical className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
          <p className="text-sm font-medium text-zinc-400">
            {t("กรองแบบละเอียด", "Refine your search")}
          </p>
        </div>
      ) : (
        <p className={cn(sectionHeadingClass, "border-b border-border pb-2.5")}>
          {t("กรองละเอียด", "Refine filters")}
        </p>
      )}

      <div className={cn(isMobile && filterCardClass)}>
        {isMobile ? (
          <FilterSectionHeading
            icon={<Sparkles className="h-5 w-5" strokeWidth={2} />}
            title={t("THC & CBD", "THC & CBD")}
            subtitle={t("ความเข้มข้นสารสำคัญ", "Potency ranges")}
          />
        ) : (
          <p className={cn(sectionHeadingClass, "mb-2.5")}>
            {t("THC & CBD", "THC & CBD")}
          </p>
        )}
        <p
          className={cn(
            isMobile
              ? "mb-2 text-[10px] font-medium uppercase tracking-wide text-zinc-500"
              : cn(subSectionHeadingClass, "mb-1.5")
          )}
        >
          THC
        </p>
        <div className={cn("mb-3", isMobile ? "space-y-2" : "space-y-1.5")}>
          {THC_ROWS.map(({ slug, labelTh, labelEn }) => {
            const on = thcOn(slug);
            const cnt = counts.thc[slug] ?? 0;
            return (
              <label key={`thc-${slug}`} className={rowClass(on, cnt === 0)}>
                <input
                  type="checkbox"
                  className={isMobile ? "sr-only" : checkboxClass}
                  checked={on}
                  onChange={() => toggleT(slug)}
                />
                {isMobile ? mobileCheck(on) : null}
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className={labelTextClass(on)}>{t(labelTh, labelEn)}</span>
                  <span className={countBadgeClass(on, cnt === 0)}>
                    {isMobile ? cnt : `(${cnt})`}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <p
          className={cn(
            isMobile
              ? "mb-2 text-[10px] font-medium uppercase tracking-wide text-zinc-500/80"
              : cn(subSectionHeadingClass, "mb-1.5")
          )}
        >
          CBD
        </p>
        <div className={cn(isMobile ? "space-y-2" : "space-y-1.5")}>
          {CBD_ROWS.map(({ slug, labelTh, labelEn }) => {
            const on = cbdOn(slug);
            const cnt = counts.cbd[slug] ?? 0;
            return (
              <label key={`cbd-${slug}`} className={rowClass(on, cnt === 0)}>
                <input
                  type="checkbox"
                  className={isMobile ? "sr-only" : checkboxClass}
                  checked={on}
                  onChange={() => toggleC(slug)}
                />
                {isMobile ? mobileCheck(on) : null}
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className={labelTextClass(on)}>{t(labelTh, labelEn)}</span>
                  <span className={countBadgeClass(on, cnt === 0)}>
                    {isMobile ? cnt : `(${cnt})`}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className={cn(isMobile && filterCardClass)}>
        {isMobile ? (
          <FilterSectionHeading
            icon={<SlidersHorizontal className="h-5 w-5" strokeWidth={2} />}
            title={t("ระดับความยาก", "Difficulty")}
            subtitle={t("เหมาะกับมือใหม่หรือโปร", "Grow skill level")}
          />
        ) : (
          <p className={cn(sectionHeadingClass, "mb-2")}>
            {t("ระดับความยาก", "Difficulty")}
          </p>
        )}
        <div className={cn(isMobile ? "space-y-2" : "space-y-1.5")}>
          {DIFF_ROWS.map(({ slug, labelTh, labelEn }) => {
            const on = difficultyOn(slug);
            const cnt = counts.difficulty[slug] ?? 0;
            return (
              <label key={slug} className={rowClass(on, cnt === 0)}>
                <input
                  type="checkbox"
                  className={isMobile ? "sr-only" : checkboxClass}
                  checked={on}
                  onChange={() => toggleD(slug)}
                />
                {isMobile ? mobileCheck(on) : null}
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className={labelTextClass(on)}>{t(labelTh, labelEn)}</span>
                  <span className={countBadgeClass(on, cnt === 0)}>
                    {isMobile ? cnt : `(${cnt})`}
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
  quickFilters,
}: {
  t: TFn;
  counts: ShopFilterOptionCounts;
  quickFilters: CatalogSidebarQuickFiltersProps;
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
      className="sticky z-10 flex min-h-0 w-full max-w-[280px] flex-1 flex-col self-stretch rounded-2xl border border-border/60 bg-zinc-950/40 lg:top-[11.5rem] lg:max-h-[calc(100vh-11.5rem)]"
    >
      <div className="shrink-0 px-4 pb-3 pt-4">
        <CatalogSidebarQuickFilters {...quickFilters} presentation="sidebar" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-border px-4 pb-5 pt-4 [-webkit-overflow-scrolling:touch]">
        <FilterSidebarContent t={t} counts={counts} priceFilter={priceFilter} />
      </div>
    </div>
  );
}

/** Mobile bottom sheet — colorful filter UI with quick chips + lab sections. */
export function ShopFilterMobileSheet({
  t,
  counts,
  open,
  onOpenChange,
  resultCount,
  onClearAll,
  quickFilters,
}: {
  t: TFn;
  counts: ShopFilterOptionCounts;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resultCount: number;
  onClearAll: () => void;
  quickFilters: CatalogSidebarQuickFiltersProps;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        id="shop-filters"
        side="bottom"
        className="storefront-v4 flex max-h-[92dvh] w-full flex-col gap-0 rounded-t-2xl border-t border-border bg-card p-0 text-foreground shadow-2xl shadow-black/50 [&>button]:hidden"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-primary/40" aria-hidden />

        <div className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/90 via-primary to-primary/70 px-4 pb-4 pt-3 text-primary-foreground">
          <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-emerald-300/20 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-black/20 backdrop-blur-sm">
                  <SlidersHorizontal className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <SheetTitle className="text-left text-lg font-bold tracking-tight text-primary-foreground">
                  {t("ตัวกรอง", "Filters")}
                </SheetTitle>
              </div>
              <p className="pl-11 text-xs leading-snug text-primary-foreground/85">
                {t("ออโต้ · โฟโต้ · พันธุกรรม · เพศ", "Type, genetics & sex")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="shrink-0 rounded-full border border-white/20 bg-black/20 p-2.5 text-primary-foreground transition-colors hover:bg-black/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label={t("ปิด", "Close")}
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-background px-4 py-4 [-webkit-overflow-scrolling:touch]">
          <div className="mb-5">
            <CatalogSidebarQuickFilters {...quickFilters} presentation="mobile" />
          </div>
          <FilterSidebarContent t={t} counts={counts} presentation="mobile" />
        </div>

        <div className="shrink-0 border-t border-border bg-card/95 px-4 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.45)] backdrop-blur-md pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            className="mb-2.5 h-14 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
            onClick={() => onOpenChange(false)}
          >
            {t(`ดูสินค้า ${resultCount} รายการ`, `View ${resultCount} products`)}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full rounded-xl text-sm font-semibold text-foreground/70 hover:bg-primary/10 hover:text-primary"
            onClick={() => onClearAll()}
          >
            {t("ล้างตัวกรองทั้งหมด", "Clear all filters")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
