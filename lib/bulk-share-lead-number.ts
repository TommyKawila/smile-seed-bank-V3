/** Format SSB-BL-YYYY-NNN */
export function formatBulkShareLeadNumber(year: string, seq: number): string {
  const n = String(Math.max(1, seq)).padStart(3, "0");
  return `SSB-BL-${year}-${n}`;
}

export function currentBulkShareLeadYear(d = new Date()): string {
  return String(d.getFullYear());
}
