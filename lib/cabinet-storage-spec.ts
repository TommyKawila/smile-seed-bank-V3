/** Locked seed cabinet storage spec — GF meeting 28 Aug 2026 */

export const CABINET_STORAGE_SPEC = {
  tempMinC: 5,
  tempMaxC: 10,
  rhMaxPct: 50,
  typicalRhMinPct: 30,
  typicalRhMaxPct: 40,
  cabinetLabelTh: "ตู้เก็บไวน์แม่อาย (SANDEN +5°C)",
  cabinetLabelEn: "Wine cellar cabinet (SANDEN +5°C)",
  historyDays: 30,
  photoMaxBytes: 5 * 1024 * 1024,
} as const;

export function isCabinetReadingInSpec(tempC: number, rhPct: number): boolean {
  return (
    Number.isFinite(tempC) &&
    Number.isFinite(rhPct) &&
    tempC >= CABINET_STORAGE_SPEC.tempMinC &&
    tempC <= CABINET_STORAGE_SPEC.tempMaxC &&
    rhPct <= CABINET_STORAGE_SPEC.rhMaxPct
  );
}

export function bangkokDateKey(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}
