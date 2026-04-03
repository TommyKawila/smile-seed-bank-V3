/** Normalize Sativa/Indica integer percents so they sum to 100 when any side is known. */
export function normalizeSativaIndicaPercents(
  sativa: number | null | undefined,
  indica: number | null | undefined
): { sativa_percent: number | null; indica_percent: number | null } {
  const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
  let s =
    sativa != null && Number.isFinite(Number(sativa)) ? clamp(Number(sativa)) : null;
  let i =
    indica != null && Number.isFinite(Number(indica)) ? clamp(Number(indica)) : null;

  if (s == null && i == null) {
    return { sativa_percent: null, indica_percent: null };
  }
  if (s != null && i == null) {
    i = clamp(100 - s);
    return { sativa_percent: s, indica_percent: i };
  }
  if (i != null && s == null) {
    s = clamp(100 - i);
    return { sativa_percent: s, indica_percent: i };
  }
  if (s != null && i != null) {
    if (s + i === 100) return { sativa_percent: s, indica_percent: i };
    const sum = s + i;
    if (sum <= 0) return { sativa_percent: 50, indica_percent: 50 };
    s = clamp(Math.round((s / sum) * 100));
    i = 100 - s;
    return { sativa_percent: s, indica_percent: i };
  }
  return { sativa_percent: null, indica_percent: null };
}

export function formatGeneticRatioString(sativa: number, indica: number): string {
  return `Sativa ${sativa}% / Indica ${indica}%`;
}
