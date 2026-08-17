"use client";

import { useEffect, useMemo, useState } from "react";
import { Tag, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { shopQuickChipClasses, FILTER_ACTIVE, FILTER_IDLE } from "@/components/storefront/shop-filter-chip-styles";
import { cn, formatPrice } from "@/lib/utils";
import {
  activeBudgetPresetId,
  budgetPresetsForCap,
  priceFilterActive,
  type PriceBudgetPreset,
} from "@/lib/shop-price-filter";

type TFn = (th: string, en: string) => string;

const pricePanelClass =
  "space-y-4 rounded-2xl border border-border bg-card/50 p-4 font-sans text-foreground shadow-sm surface-glass";

const sectionHeadingClass =
  "font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500";

function PricePresetChip({
  label,
  active,
  onClick,
  compact,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        compact
          ? shopQuickChipClasses(active, true)
          : cn(
              "min-h-11 rounded-xl border px-3 py-2.5 text-center font-sans text-[11px] font-medium transition-colors active:scale-[0.98]",
              active ? FILTER_ACTIVE : FILTER_IDLE
            )
      )}
    >
      {label}
    </button>
  );
}

export function ShopPriceChipsRow({
  t,
  cap,
  min,
  max,
  onRangeChange,
  className,
  compact = false,
  showBahtGlyph = false,
}: {
  t: TFn;
  cap: number;
  min: number | null;
  max: number | null;
  onRangeChange: (min: number | null, max: number | null) => void;
  className?: string;
  compact?: boolean;
  showBahtGlyph?: boolean;
}) {
  const presets = useMemo(() => budgetPresetsForCap(cap), [cap]);
  const activeId = activeBudgetPresetId(min, max, cap);

  const onChip = (p: PriceBudgetPreset) => {
    if (activeId === p.id) onRangeChange(null, null);
    else onRangeChange(p.min, p.max);
  };

  if (compact) {
    return (
      <div className={cn("contents font-sans", className)}>
        {showBahtGlyph && (
          <span
            className="inline-flex shrink-0 items-center self-center pr-0.5 font-sans text-sm font-medium tabular-nums text-muted-foreground"
            aria-hidden
          >
            ฿
          </span>
        )}
        {presets.map((p) => (
          <PricePresetChip
            key={p.id}
            label={t(p.labelTh, p.labelEn)}
            active={activeId === p.id}
            onClick={() => onChip(p)}
            compact
          />
        ))}
        {priceFilterActive(min, max) && activeId == null && (
          <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 font-sans text-[10px] font-medium text-primary">
            {t("กำหนดเอง", "Custom")}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("font-sans", className)}>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch sm:gap-3">
        <div className="flex shrink-0 items-center sm:py-0.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            {t("งบประมาณ", "Budget")}
          </span>
        </div>
        <div className="hidden w-px shrink-0 self-stretch bg-border sm:block" aria-hidden />
        <div className="relative min-w-0 flex-1">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-7 bg-gradient-to-r from-white to-transparent sm:w-6"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-7 bg-gradient-to-l from-white to-transparent sm:w-6"
            aria-hidden
          />
          <div className="flex items-center gap-2 overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {presets.map((p) => (
              <PricePresetChip
                key={p.id}
                label={t(p.labelTh, p.labelEn)}
                active={activeId === p.id}
                onClick={() => onChip(p)}
                compact
              />
            ))}
            {priceFilterActive(min, max) && activeId == null && (
              <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1.5 font-sans text-[10px] font-medium text-primary">
                {t("กำหนดเอง", "Custom")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ShopPriceFilterPanel({
  t,
  cap,
  min,
  max,
  onRangeChange,
  className,
  showChips = true,
  showSlider = true,
  variant = "default",
  presentation = "default",
}: {
  t: TFn;
  cap: number;
  min: number | null;
  max: number | null;
  onRangeChange: (min: number | null, max: number | null) => void;
  className?: string;
  showChips?: boolean;
  showSlider?: boolean;
  /** `sheet` — full-width chips grid for mobile bottom sheet. */
  variant?: "default" | "sheet";
  /** `sidebar` — compact V4 typography for desktop filter column. */
  presentation?: "default" | "sidebar";
}) {
  const presets = useMemo(() => budgetPresetsForCap(cap), [cap]);
  const activeId = activeBudgetPresetId(min, max, cap);

  const lo = Math.min(min ?? 0, cap);
  const hi = Math.min(max ?? cap, cap);
  const [pair, setPair] = useState<[number, number]>([lo, hi]);

  useEffect(() => {
    setPair([Math.min(min ?? 0, cap), Math.min(max ?? cap, cap)]);
  }, [min, max, cap]);

  const onChip = (p: PriceBudgetPreset) => {
    if (activeId === p.id) onRangeChange(null, null);
    else onRangeChange(p.min, p.max);
  };

  const onSlider = (v: number[]) => {
    if (v.length < 2) return;
    const a = Math.max(0, Math.min(v[0]!, cap));
    const b = Math.max(0, Math.min(v[1]!, cap));
    const lo2 = Math.min(a, b);
    const hi2 = Math.max(a, b);
    setPair([lo2, hi2]);
    if (lo2 <= 0 && hi2 >= cap) onRangeChange(null, null);
    else onRangeChange(lo2, hi2);
  };

  const isSheet = variant === "sheet";
  const isSidebar = presentation === "sidebar";

  return (
    <div
      className={cn(
        isSidebar ? "space-y-3 font-sans text-foreground" : pricePanelClass,
        className
      )}
    >
      {isSidebar ? (
        <div className="space-y-1">
          <p className={sectionHeadingClass}>{t("ช่วงราคา", "Price range")}</p>
          <p className="text-xs text-foreground/65">
            {t("เลือกงบหรือลากสไลเดอร์", "Pick a budget or drag the slider")}
          </p>
        </div>
      ) : (
        <div className="mb-1 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground">
            <Tag className="h-5 w-5" strokeWidth={2} aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t("ช่วงราคา", "Price range")}</p>
            <p className="text-xs text-foreground/65">
              {t("เลือกงบหรือลากสไลเดอร์", "Pick a budget or drag the slider")}
            </p>
          </div>
        </div>
      )}

      {showChips && (
        <div
          className={cn(
            isSheet ? "grid grid-cols-2 gap-2 sm:grid-cols-3" : "flex flex-wrap gap-2"
          )}
        >
          {presets.map((p) => (
            <PricePresetChip
              key={p.id}
              label={t(p.labelTh, p.labelEn)}
              active={activeId === p.id}
              onClick={() => onChip(p)}
              compact={!isSheet}
            />
          ))}
          {priceFilterActive(min, max) && activeId == null && (
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-xl border border-primary/40 bg-primary/10 font-sans text-[11px] font-medium text-primary",
                isSheet ? "min-h-11 px-3" : "px-2.5 py-1.5 text-[10px]"
              )}
            >
              {t("กำหนดเอง", "Custom")}
            </span>
          )}
        </div>
      )}

      {showSlider && (
        <div
          className={cn(
            "space-y-3 rounded-xl border p-3",
            isSidebar ? "border-border bg-muted/15" : "border-border bg-card/60"
          )}
        >
          <div
            className={cn(
              "flex justify-between font-sans text-sm font-semibold tabular-nums",
              isSidebar ? "text-foreground" : "text-foreground"
            )}
          >
            <span>{formatPrice(pair[0])}</span>
            <span>{formatPrice(pair[1])}</span>
          </div>
          <Slider
            min={0}
            max={cap}
            step={50}
            value={[pair[0], pair[1]]}
            onValueChange={onSlider}
            aria-label={t("ช่วงราคา", "Price range")}
          />
          {priceFilterActive(min, max) && (
            <button
              type="button"
              onClick={() => onRangeChange(null, null)}
              className="font-sans text-xs font-medium text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
            >
              {t("ล้างช่วงราคา", "Clear price range")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ShopPriceFilterBottomSheet({
  t,
  open,
  onOpenChange,
  cap,
  min,
  max,
  onRangeChange,
  resultCount,
}: {
  t: TFn;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cap: number;
  min: number | null;
  max: number | null;
  onRangeChange: (min: number | null, max: number | null) => void;
  resultCount: number;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="storefront-v4 flex max-h-[min(88dvh,640px)] flex-col gap-0 rounded-t-2xl border-t border-border bg-card p-0 font-sans text-foreground shadow-2xl shadow-black/50 [&>button]:hidden"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-zinc-700" aria-hidden />

        <div className="shrink-0 border-b border-border px-4 pb-3 pt-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border">
                  <Tag className="h-5 w-5 text-muted-foreground" strokeWidth={2} aria-hidden />
                </span>
                <SheetTitle className="text-left text-lg font-semibold tracking-tight text-foreground">
                  {t("กรองตามราคา", "Filter by price")}
                </SheetTitle>
              </div>
              <p className="pl-11 text-xs leading-snug text-muted-foreground">
                {t("เลือกช่วงงบหรือปรับสไลเดอร์", "Pick a budget or adjust the slider")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="shrink-0 rounded-full border border-border p-2.5 text-muted-foreground transition-colors hover:bg-zinc-900/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              aria-label={t("ปิด", "Close")}
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-background px-4 py-4 [-webkit-overflow-scrolling:touch]">
          <ShopPriceFilterPanel
            t={t}
            cap={cap}
            min={min}
            max={max}
            onRangeChange={onRangeChange}
            showChips
            showSlider
            variant="sheet"
            className="border-border bg-card/60 shadow-none surface-glass"
          />
        </div>

        <div className="shrink-0 border-t border-border bg-card/95 px-4 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.45)] backdrop-blur-md pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            className="h-14 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
            onClick={() => onOpenChange(false)}
          >
            {t(`ดูสินค้า ${resultCount} รายการ`, `View ${resultCount} products`)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
