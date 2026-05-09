import { bahtToSatangInt, quantizeBaht2, satangIntToBaht } from "@/lib/money-thb";

export interface PromoInfo {
  discount_type: "PERCENTAGE" | "FIXED" | string;
  discount_value: number;
}

export function isCouponPercentageType(discountType: string | null | undefined): boolean {
  const dt = String(discountType ?? "").trim().toUpperCase();
  return dt === "PERCENTAGE" || dt === "PERCENT";
}

export function satangDiscountToBaht(discSatang: number): number {
  if (!Number.isFinite(discSatang) || discSatang <= 0) return 0;
  return quantizeBaht2(satangIntToBaht(Math.round(discSatang)));
}

function computePercentDiscountSatang(subtotalSatang: number, percentPoints: number): number {
  const subSat = Math.round(Number(subtotalSatang));
  const pct = Number(percentPoints);
  if (!Number.isFinite(subSat) || subSat <= 0 || !Number.isFinite(pct) || pct <= 0) return 0;
  const roundedDiscountSatang = Math.round(subSat * (pct / 100));
  return bahtToSatangInt(quantizeBaht2(satangIntToBaht(roundedDiscountSatang)));
}

/** Coupon discount in integer satang from subtotal BAHT (canonical for % and fixed cap). */
export function computeCouponDiscountSatang(subtotalBaht: number, promo: PromoInfo): number {
  const subSat = bahtToSatangInt(subtotalBaht);
  if (!Number.isFinite(subSat) || subSat <= 0) return 0;
  if (isCouponPercentageType(promo.discount_type)) {
    return computePercentDiscountSatang(subSat, promo.discount_value);
  }
  const fixedSat = bahtToSatangInt(promo.discount_value);
  if (!Number.isFinite(fixedSat) || fixedSat <= 0) return 0;
  return Math.min(fixedSat, subSat);
}

export function computeCouponDiscountBahtOnSubtotal(subtotalBaht: number, promo: PromoInfo): number {
  return satangDiscountToBaht(computeCouponDiscountSatang(subtotalBaht, promo));
}

/** Auto tier / spend-tier percent off subtotal (satang). */
export function computePercentOfSubtotalDiscountSatang(
  subtotalSatang: number,
  percentPoints: number
): number {
  return computePercentDiscountSatang(subtotalSatang, percentPoints);
}
