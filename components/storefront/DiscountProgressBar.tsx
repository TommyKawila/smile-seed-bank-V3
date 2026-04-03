"use client";

import type { TieredDiscountRule } from "@/lib/cart-utils";
import { useLanguage } from "@/context/LanguageContext";

interface DiscountProgressBarProps {
  subtotal: number;
  rules: TieredDiscountRule[];
  upsellMessage: string | null;
}

export function DiscountProgressBar({ subtotal, rules, upsellMessage }: DiscountProgressBarProps) {
  const { t } = useLanguage();
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

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-zinc-600">
        <span>
          {t("ซื้ออีก", "Spend")} ฿{gap.toLocaleString("th-TH")} {t("รับ", "for")} {nextTier.discount_percent}%
        </span>
        <span>฿{nextTier.min_spend.toLocaleString("th-TH")}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
