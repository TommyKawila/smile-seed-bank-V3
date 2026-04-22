"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn, formatPrice } from "@/lib/utils";
import {
  activeBudgetPresetId,
  budgetPresetsForCap,
  priceFilterActive,
  type PriceBudgetPreset,
} from "@/lib/shop-price-filter";

type TFn = (th: string, en: string) => string;

const chipBase =
  "shrink-0 whitespace-nowrap rounded-lg border px-3.5 py-2 font-sans text-xs font-medium transition-colors";

const chipBaseCompact =
  "shrink-0 whitespace-nowrap rounded-lg border px-2.5 py-1.5 font-sans text-[11px] font-medium transition-colors";

const chipInactive =
  "border-transparent bg-zinc-100/50 text-zinc-600 hover:bg-zinc-200/50";
const chipActive =
  "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80";

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
  /** Single-line strip: no label row; use inside parent `overflow-x-auto`. */
  compact?: boolean;
  /** Prefix ฿ in compact row (replaces budget label). */
  showBahtGlyph?: boolean;
}) {
  const presets = useMemo(() => budgetPresetsForCap(cap), [cap]);
  const activeId = activeBudgetPresetId(min, max, cap);

  const onChip = (p: PriceBudgetPreset) => {
    if (activeId === p.id) onRangeChange(null, null);
    else onRangeChange(p.min, p.max);
  };

  const chipCls = compact ? chipBaseCompact : chipBase;

  if (compact) {
    return (
      <div className={cn("contents font-sans", className)}>
        {showBahtGlyph && (
          <span
            className="inline-flex shrink-0 items-center self-center pr-0.5 font-sans text-sm font-semibold tabular-nums text-zinc-400"
            aria-hidden
          >
            ฿
          </span>
        )}
        {presets.map((p) => {
          const on = activeId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChip(p)}
              className={cn(chipCls, on ? chipActive : chipInactive)}
            >
              {t(p.labelTh, p.labelEn)}
            </button>
          );
        })}
        {priceFilterActive(min, max) && activeId == null && (
          <span className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 font-sans text-[10px] font-semibold text-emerald-700">
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
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            {t("งบประมาณ", "Budget")}
          </span>
        </div>
        <div
          className="hidden w-px shrink-0 self-stretch bg-zinc-200/60 sm:block"
          aria-hidden
        />
        <div className="relative min-w-0 flex-1">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-7 bg-gradient-to-r from-white to-transparent sm:w-6"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-7 bg-gradient-to-l from-white to-transparent sm:w-6"
            aria-hidden
          />
          <div className="flex items-center gap-3 overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {presets.map((p) => {
              const on = activeId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChip(p)}
                  className={cn(chipCls, on ? chipActive : chipInactive)}
                >
                  {t(p.labelTh, p.labelEn)}
                </button>
              );
            })}
            {priceFilterActive(min, max) && activeId == null && (
              <span className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 font-sans text-[10px] font-semibold text-emerald-700">
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
}: {
  t: TFn;
  cap: number;
  min: number | null;
  max: number | null;
  onRangeChange: (min: number | null, max: number | null) => void;
  className?: string;
  showChips?: boolean;
  showSlider?: boolean;
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

  return (
    <div
      className={cn(
        "space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 font-sans text-zinc-800 shadow-sm",
        className
      )}
    >
      <p className="border-b border-zinc-200 pb-2.5 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
        {t("ช่วงราคา", "Price range")}
      </p>

      {showChips && (
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const on = activeId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChip(p)}
                className={cn(chipBase, "py-1.5 text-[11px]", on ? chipActive : chipInactive)}
              >
                {t(p.labelTh, p.labelEn)}
              </button>
            );
          })}
        </div>
      )}

      {showSlider && (
        <div className="space-y-3 pt-0.5">
          <div className="flex justify-between font-sans text-xs font-medium tabular-nums text-zinc-700">
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
              className="font-sans text-xs font-medium text-emerald-700 underline-offset-2 hover:underline"
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
        className="flex max-h-[min(88dvh,640px)] flex-col gap-0 rounded-t-2xl border-zinc-200 bg-white p-0 font-sans text-zinc-900 shadow-2xl [&>button]:hidden"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
          <SheetTitle className="text-left text-base font-semibold text-emerald-800">
            {t("กรองตามราคา", "Filter by price")}
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
        <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-50/50 px-4 py-4">
          <ShopPriceFilterPanel
            t={t}
            cap={cap}
            min={min}
            max={max}
            onRangeChange={onRangeChange}
            showChips
            showSlider
            className="border-zinc-200 bg-white"
          />
        </div>
        <div className="shrink-0 border-t border-zinc-200 bg-white px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            className="w-full bg-emerald-600 font-sans font-semibold text-white hover:bg-emerald-700"
            onClick={() => onOpenChange(false)}
          >
            {t(`แสดง ${resultCount} รายการ`, `Show ${resultCount} results`)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
