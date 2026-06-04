"use client";

import { useEffect, useMemo, useState } from "react";
import { Tag, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { shopQuickChipClasses } from "@/components/storefront/shop-filter-chip-styles";
import { cn, formatPrice } from "@/lib/utils";
import {
  activeBudgetPresetId,
  budgetPresetsForCap,
  priceFilterActive,
  type PriceBudgetPreset,
} from "@/lib/shop-price-filter";

type TFn = (th: string, en: string) => string;

const pricePanelClass =
  "space-y-4 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/[0.05] via-white to-secondary/25 p-4 font-sans text-zinc-800 shadow-sm";

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
              "min-h-11 rounded-xl border-2 px-3 py-2.5 text-center font-sans text-[11px] font-semibold transition-all active:scale-[0.98]",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "border-primary/15 bg-white text-primary hover:border-primary/35 hover:bg-primary/[0.06]"
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
            className="inline-flex shrink-0 items-center self-center pr-0.5 font-sans text-sm font-semibold tabular-nums text-primary/50"
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
          <span className="shrink-0 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 font-sans text-[10px] font-semibold text-primary">
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
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary/70">
            {t("งบประมาณ", "Budget")}
          </span>
        </div>
        <div className="hidden w-px shrink-0 self-stretch bg-primary/15 sm:block" aria-hidden />
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
              <span className="shrink-0 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1.5 font-sans text-[10px] font-semibold text-primary">
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

  return (
    <div className={cn(pricePanelClass, className)}>
      <div className="mb-1 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
          <Tag className="h-5 w-5" strokeWidth={2} aria-hidden />
        </div>
        <div>
          <p className="text-sm font-bold text-primary">{t("ช่วงราคา", "Price range")}</p>
          <p className="text-xs text-zinc-500">
            {t("เลือกงบหรือลากสไลเดอร์", "Pick a budget or drag the slider")}
          </p>
        </div>
      </div>

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
                "inline-flex items-center justify-center rounded-xl border border-primary/25 bg-secondary/50 font-sans text-[11px] font-semibold text-primary",
                isSheet ? "min-h-11 px-3" : "px-2.5 py-1.5 text-[10px]"
              )}
            >
              {t("กำหนดเอง", "Custom")}
            </span>
          )}
        </div>
      )}

      {showSlider && (
        <div className="space-y-3 rounded-xl border border-primary/10 bg-white/80 p-3">
          <div className="flex justify-between font-sans text-sm font-semibold tabular-nums text-primary">
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
              className="font-sans text-xs font-semibold text-primary/80 underline-offset-2 hover:text-primary hover:underline"
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
        className="flex max-h-[min(88dvh,640px)] flex-col gap-0 rounded-t-2xl border-t-0 bg-gradient-to-b from-secondary/20 via-white to-white p-0 font-sans shadow-2xl [&>button]:hidden"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-primary/25" aria-hidden />

        <div className="relative shrink-0 overflow-hidden rounded-t-2xl bg-gradient-to-br from-primary via-primary to-primary/85 px-4 pb-4 pt-3 text-primary-foreground shadow-md">
          <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-secondary/30 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <Tag className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <SheetTitle className="text-left text-lg font-bold tracking-tight text-primary-foreground">
                  {t("กรองตามราคา", "Filter by price")}
                </SheetTitle>
              </div>
              <p className="pl-11 text-xs leading-snug text-primary-foreground/85">
                {t("เลือกช่วงงบหรือปรับสไลเดอร์", "Pick a budget or adjust the slider")}
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
          <ShopPriceFilterPanel
            t={t}
            cap={cap}
            min={min}
            max={max}
            onRangeChange={onRangeChange}
            showChips
            showSlider
            variant="sheet"
            className="border-0 shadow-none"
          />
        </div>

        <div className="shrink-0 border-t border-primary/10 bg-white/98 px-4 py-4 shadow-[0_-8px_24px_rgba(18,70,62,0.1)] backdrop-blur-md pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            className="h-14 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90"
            onClick={() => onOpenChange(false)}
          >
            {t(`ดูสินค้า ${resultCount} รายการ`, `View ${resultCount} products`)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
