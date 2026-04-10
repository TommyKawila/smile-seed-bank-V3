"use client";

import type { TieredDiscountRule } from "@/lib/cart-utils";
import { useLanguage } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/utils";

interface DiscountProgressBarProps {
  subtotal: number;
  rules: TieredDiscountRule[];
}

export function DiscountProgressBar({ subtotal, rules }: DiscountProgressBarProps) {
  const { t, locale } = useLanguage();
  if (!rules.length) return null;

  const sorted = [...rules].sort((a, b) => a.min_spend - b.min_spend);
  const currentTier = sorted.filter((r) => subtotal >= r.min_spend).pop();
  const nextTier = sorted.find((r) => r.min_spend > subtotal);

  if (!nextTier) {
    return currentTier ? (
      <div className="rounded-xl bg-accent px-3 py-2 text-xs font-medium text-primary">
        ✓ {t("รับส่วนลด", "You get")} {currentTier.discount_percent}% {t("แล้ว!", "off!")}
      </div>
    ) : null;
  }

  const progress = Math.min(100, (subtotal / nextTier.min_spend) * 100);
  const gap = nextTier.min_spend - subtotal;
  const hint =
    locale === "th"
      ? `ซื้ออีก ${formatPrice(gap)} เพื่อรับส่วนลด ${nextTier.discount_percent}%`
      : `Spend ${formatPrice(gap)} more to get ${nextTier.discount_percent}% off`;

  return (
    <div className="space-y-2">
      <div className="flex justify-end text-xs text-zinc-600">
        <span>{formatPrice(nextTier.min_spend)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="rounded-xl bg-primary/5 px-3 py-2 text-xs text-primary">
        💡 {hint}
      </div>
    </div>
  );
}
