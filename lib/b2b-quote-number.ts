/** Format SSB-B2B-YYYY-NNN */
export function formatB2BQuoteNumber(year: string, seq: number): string {
  const n = String(Math.max(1, seq)).padStart(3, "0");
  return `SSB-B2B-${year}-${n}`;
}

export function currentB2BQuoteYear(d = new Date()): string {
  return String(d.getFullYear());
}
