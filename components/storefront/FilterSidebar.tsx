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

function FilterSectionHeading({
  icon,
  title,
  subtitle,
  accentClass,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  accentClass: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
          accentClass
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold leading-tight text-zinc-900">{title}</p>
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
    "peer h-3 w-3 shrink-0 rounded-sm border border-primary/55 text-primary accent-primary focus:ring-1 focus:ring-primary/35 focus:ring-offset-0";

  const seedsCheckboxClass =
    "peer h-3 w-3 shrink-0 rounded-sm border border-emerald-600/45 text-emerald-600 accent-emerald-600 focus:ring-1 focus:ring-emerald-500/35 focus:ring-offset-0";

  const rowClass = (on: boolean, isZero: boolean) =>
    isMobile
      ? mobileRowClass(on, isZero, "default")
      : `flex w-full cursor-pointer items-center gap-2 rounded-sm border px-2.5 py-2 text-sm font-sans transition-colors ${
          isZero ? "opacity-60" : ""
        } ${
          on
            ? "border-primary/40 bg-primary/[0.06] text-zinc-900"
            : "border-zinc-200/90 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50/80"
        }`;

  const seedsRowClass = (on: boolean, isZero: boolean) =>
    isMobile
      ? cn(
          "flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 font-sans transition-all active:scale-[0.98]",
          isZero ? "opacity-50" : "",
          on
            ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
            : "border-emerald-100 bg-emerald-50/80 text-emerald-950 hover:border-emerald-200"
        )
      : `flex w-full cursor-pointer items-center gap-2 rounded-sm border px-2.5 py-2 text-sm font-sans transition-colors ${
          isZero ? "opacity-60" : ""
        } ${
          on
            ? "border-emerald-600/35 bg-emerald-50/60 text-emerald-900"
            : "border-zinc-200/90 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50/80"
        }`;

  const mobileRowClass = (
    on: boolean,
    isZero: boolean,
    tone: "default" | "fem" | "reg" | "seeds"
  ) => {
    const base =
      "flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 font-sans transition-all active:scale-[0.98]";
    if (isZero) return cn(base, "opacity-50");
    if (!on) {
      return cn(
        base,
        tone === "seeds"
          ? "border-emerald-100 bg-emerald-50/80 text-emerald-950"
          : "border-zinc-200/90 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
      );
    }
    if (tone === "fem")
      return cn(
        base,
        "border-violet-300 bg-secondary text-zinc-900 shadow-md shadow-secondary/40"
      );
    if (tone === "reg")
      return cn(base, "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25");
    if (tone === "seeds")
      return cn(
        base,
        "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
      );
    return cn(base, "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25");
  };

  const countBadgeClass = (on: boolean, isZero: boolean, tone: "default" | "fem" | "seeds" = "default") => {
    if (isMobile) {
      if (on) return "rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-bold tabular-nums text-inherit";
      if (tone === "seeds")
        return cn(
          "rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums",
          isZero ? "bg-zinc-100 text-zinc-400" : "bg-emerald-100 text-emerald-800"
        );
      if (tone === "fem")
        return cn(
          "rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums",
          isZero ? "bg-zinc-100 text-zinc-400" : "bg-secondary text-secondary-foreground"
        );
      return cn(
        "rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums",
        isZero ? "bg-zinc-100 text-zinc-400" : "bg-zinc-100 text-zinc-600"
      );
    }
    return cn(
      "shrink-0 font-sans text-[10px] font-normal tabular-nums",
      isZero ? "text-zinc-400" : "text-zinc-500"
    );
  };

  const labelTextClass = (on: boolean) =>
    isMobile
      ? cn("text-sm font-semibold leading-tight", on ? "text-inherit" : "text-zinc-800")
      : cn(
          "font-sans text-[11px] font-medium tabular-nums tracking-wide",
          on ? "text-primary" : "text-zinc-600"
        );

  const mobileCheck = (on: boolean) =>
    on ? (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/25">
        <Check className="h-4 w-4 stroke-[2.5]" aria-hidden />
      </span>
    ) : (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-zinc-200/90 bg-white" />
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
          className="mb-0"
        />
      ) : null}
      <div
        className={cn(
          isMobile && "rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/90 to-white p-4 shadow-sm"
        )}
      >
        {isMobile ? (
          <FilterSectionHeading
            icon={<Package className="h-5 w-5 text-emerald-700" strokeWidth={2} />}
            title={t("ขนาดแพ็กเกจ", "Package size")}
            subtitle={t("เลือกจำนวนเมล็ดต่อแพ็ก", "Seeds per pack")}
            accentClass="bg-emerald-100"
          />
        ) : (
          <p className="mb-2 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
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
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary/10 via-secondary/30 to-primary/5 px-4 py-3">
          <FlaskConical className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <p className="text-sm font-semibold text-primary">
            {t("กรองแบบละเอียด", "Refine your search")}
          </p>
        </div>
      ) : (
        <p className="border-b border-zinc-200/90 pb-2.5 font-sans text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-500">
          {t("ห้องปฏิบัติการกรอง", "THE LAB")}
        </p>
      )}

      <div
        className={cn(
          isMobile && "rounded-2xl border border-amber-100/80 bg-gradient-to-br from-amber-50/50 to-white p-4 shadow-sm"
        )}
      >
        {isMobile ? (
          <FilterSectionHeading
            icon={<Sparkles className="h-5 w-5 text-amber-700" strokeWidth={2} />}
            title={t("THC & CBD", "THC & CBD")}
            subtitle={t("ความเข้มข้นสารสำคัญ", "Potency ranges")}
            accentClass="bg-amber-100"
          />
        ) : (
          <p className="mb-2.5 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
            {t("THC & CBD", "THC & CBD")}
          </p>
        )}
        <p
          className={cn(
            isMobile
              ? "mb-2 text-xs font-bold uppercase tracking-wide text-amber-800/80"
              : "mb-1.5 font-sans text-[9px] font-medium uppercase tracking-[0.18em] text-zinc-500"
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
              ? "mb-2 text-xs font-bold uppercase tracking-wide text-teal-800/80"
              : "mb-1.5 font-sans text-[9px] font-medium uppercase tracking-[0.18em] text-zinc-500"
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

      <div
        className={cn(
          isMobile && "rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 shadow-sm"
        )}
      >
        {isMobile ? (
          <FilterSectionHeading
            icon={<SlidersHorizontal className="h-5 w-5 text-zinc-700" strokeWidth={2} />}
            title={t("ระดับความยาก", "Difficulty")}
            subtitle={t("เหมาะกับมือใหม่หรือโปร", "Grow skill level")}
            accentClass="bg-zinc-200/80"
          />
        ) : (
          <p className="mb-2 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
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
      className="sticky z-10 flex min-h-0 w-full max-w-[280px] flex-1 flex-col self-stretch rounded-2xl border border-zinc-200/90 bg-white shadow-sm lg:top-[11.5rem] lg:max-h-[calc(100vh-11.5rem)]"
    >
      <div className="shrink-0 px-4 pb-3 pt-4">
        <CatalogSidebarQuickFilters {...quickFilters} presentation="sidebar" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-zinc-100 px-4 pb-5 pt-4 [-webkit-overflow-scrolling:touch]">
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
        className="flex max-h-[92dvh] w-full flex-col gap-0 rounded-t-2xl border-t-0 bg-zinc-50/95 p-0 shadow-2xl [&>button]:hidden"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-zinc-300/90" aria-hidden />

        <div className="relative shrink-0 overflow-hidden rounded-t-2xl bg-gradient-to-br from-primary via-primary to-primary/85 px-4 pb-4 pt-3 text-primary-foreground shadow-md">
          <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-secondary/30 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
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
              className="shrink-0 rounded-full bg-white/15 p-2.5 text-primary-foreground transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              aria-label={t("ปิด", "Close")}
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch]">
          <div className="mb-5">
            <CatalogSidebarQuickFilters {...quickFilters} presentation="mobile" />
          </div>
          <FilterSidebarContent t={t} counts={counts} presentation="mobile" />
        </div>

        <div className="shrink-0 border-t border-zinc-200/80 bg-white/95 px-4 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md pb-[max(1rem,env(safe-area-inset-bottom))]">
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
            className="h-11 w-full rounded-xl text-sm font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            onClick={() => onClearAll()}
          >
            {t("ล้างตัวกรองทั้งหมด", "Clear all filters")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
