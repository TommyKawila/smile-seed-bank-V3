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
    <div className="space-y-2 rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-900/75">
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
                  ? "border-zinc-200/90 bg-zinc-100/80 text-zinc-500"
                  : "border-emerald-300/50 bg-white hover:border-emerald-400/80",
              )}
            >
              <span className={cn(mono, "min-w-0 font-semibold text-emerald-900")}>{c.promo_code}</span>
              <span className="shrink-0 text-xs text-zinc-600">
                {applied ? t("ใช้แล้ว", "Applied") : t("แตะเพื่อใช้", "Tap to apply")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
