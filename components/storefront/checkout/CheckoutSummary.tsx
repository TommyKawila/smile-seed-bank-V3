"use client";

import { cn } from "@/lib/utils";
import type { ApiSavedCoupon } from "@/services/checkout-service";

type TFn = (th: string, en: string) => string;

/** Saved-promotion taps inside checkout order-summary card (“คูปองที่เก็บไว้”). */
export function SavedCouponsCheckoutSection({
  coupons,
  hasUser,
  appliedPromoCode,
  isValidatingPromo,
  mono,
  t,
  getPhoneForPromo,
  onPhoneMissing,
  onApplyCoupon,
}: {
  coupons: ApiSavedCoupon[];
  hasUser: boolean;
  appliedPromoCode?: string | null;
  isValidatingPromo: boolean;
  mono: string;
  t: TFn;
  getPhoneForPromo: () => string;
  onPhoneMissing: () => void;
  onApplyCoupon: (code: string) => void;
}) {
  if (!hasUser || coupons.length === 0) return null;

  const appliedUpper = appliedPromoCode?.trim().toUpperCase() ?? "";

  return (
    <div className="space-y-2 rounded-xl border border-border/60 bg-zinc-950/40 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        {t("คูปองที่เก็บไว้", "Available coupons")}
      </p>
      <div className="flex flex-col gap-2">
        {coupons.map((c) => {
          const applied = appliedUpper !== "" && appliedUpper === c.promo_code.trim().toUpperCase();
          return (
            <button
              key={`${c.campaign_id}-${c.promo_code}`}
              type="button"
              disabled={applied || isValidatingPromo}
              onClick={() => {
                const phone = getPhoneForPromo().trim();
                if (!phone || phone.replace(/\D/g, "").length < 9) {
                  onPhoneMissing();
                  return;
                }
                onApplyCoupon(c.promo_code);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                applied
                  ? "border-zinc-800 bg-zinc-900/50 text-zinc-500"
                  : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-900/70",
              )}
            >
              <span className={cn(mono, "min-w-0 font-semibold text-zinc-200")}>{c.promo_code}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {applied ? t("ใช้แล้ว", "Applied") : t("แตะเพื่อใช้", "Tap to apply")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
