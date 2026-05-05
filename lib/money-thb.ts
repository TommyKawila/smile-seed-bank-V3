/**
 * THB helpers: callers supply **already combined** totals (shipping included in grand total inside `calculateCartSummary`).
 * Never add shipping here — only quantization / comparisons.
 */

/** BAHT→integer satang; does not mutate business totals beyond IEEE754 stabilization. */
export function bahtToSatangInt(baht: number): number {
  const x = Number(baht);
  if (!Number.isFinite(x)) return NaN;
  const scaled = x * 100;
  const sign = scaled >= 0 ? 1 : -1;
  const ROUND_GUARD = Number.EPSILON;
  const mag = Math.abs(scaled) + ROUND_GUARD;
  return sign * Math.round(mag);
}

export function satangIntToBaht(satang: number): number {
  if (!Number.isFinite(satang)) return NaN;
  return satang / 100;
}

/** Normalize to 2 decimal THB for persistence / EMV amount field. */
export function quantizeBaht2(baht: number): number {
  return satangIntToBaht(bahtToSatangInt(baht));
}

export function sameBahtSatang(a: number, b: number): boolean {
  return bahtToSatangInt(a) === bahtToSatangInt(b);
}
