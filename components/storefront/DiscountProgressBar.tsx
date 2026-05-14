"use client";

import { useLanguage } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/utils";
import { QUOTATION_SHIPPING_FREE_THRESHOLD } from "@/lib/order-financials";
import { roundCheckoutBahtWhole } from "@/lib/money-thb";

interface DiscountProgressBarProps {
  /** Subtotal after brand discounts minus coupon (same basis as free-shipping rule). */
  netBeforeShipping: number;
  freeShippingThreshold?: number;
}

/** Progress toward free shipping threshold (no tiered % discounts). */
export function DiscountProgressBar({
  netBeforeShipping,
  freeShippingThreshold = QUOTATION_SHIPPING_FREE_THRESHOLD,
}: DiscountProgressBarProps) {
  const { t, locale } = useLanguage();
  const threshold = Math.max(0, Number(freeShippingThreshold) || 0);
  if (threshold <= 0) return null;

  const net = Math.max(0, roundCheckoutBahtWhole(netBeforeShipping));

  if (net >= threshold) {
    return (
      <div className="rounded-xl bg-accent px-3 py-2 font-sans text-xs font-medium text-primary">
        ✓ {t("คุณได้รับจัดส่งฟรีแล้ว!", "You qualify for free shipping!")}
      </div>
    );
  }

  const gap = threshold - net;
  const progress = Math.min(100, (net / threshold) * 100);
  const hint =
    locale === "th"
      ? `ซื้ออีก ${formatPrice(gap)} เพื่อจัดส่งฟรี`
      : `Add ${formatPrice(gap)} more for free shipping`;

  return (
    <div className="space-y-2 font-sans">
      <div className="flex justify-end font-sans text-xs text-zinc-600">
        <span className="tabular-nums">{formatPrice(threshold)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="rounded-xl bg-primary/5 px-3 py-2 font-sans text-xs text-primary">
        💡 {hint}
      </div>
    </div>
  );
}
