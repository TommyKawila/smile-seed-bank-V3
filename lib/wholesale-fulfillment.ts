import { GF_PILOT_STRAIN_CODES } from "@/lib/green-future-pilot-config";
import type { WholesaleCatalogStrain } from "@/lib/wholesale-public-pricing";

export type FulfillmentTier = "docs_ready" | "docs_pending";

const DOCS_READY = new Set<string>(
  GF_PILOT_STRAIN_CODES.map((c) => c.toUpperCase())
);

export function gfFulfillmentTier(varietyCode: string): FulfillmentTier {
  return DOCS_READY.has(varietyCode.trim().toUpperCase())
    ? "docs_ready"
    : "docs_pending";
}

export function countDocsPendingLines(
  lines: Array<{ fulfillmentTier?: FulfillmentTier; quantity: number }>
): number {
  return lines.filter(
    (l) => l.fulfillmentTier === "docs_pending" && Math.floor(l.quantity) > 0
  ).length;
}

function csvCell(value: string): string {
  const v = value.replace(/"/g, '""');
  return /[",\n]/.test(v) ? `"${v}"` : v;
}

export function wholesaleCatalogCsv(rows: WholesaleCatalogStrain[]): string {
  const header = ["code", "name", "format"].join(",");
  const lines = rows.map((row) => {
    const code = (row.varietyCode ?? row.id).trim();
    const format = row.seedFormat === "FEM" ? "Photo" : "Auto";
    return [code, row.name, format].map(csvCell).join(",");
  });
  return [header, ...lines].join("\n");
}

export function wholesaleCatalogShareText(
  rows: WholesaleCatalogStrain[],
  locale: "th" | "en"
): string {
  const title =
    locale === "th"
      ? `SGF SEEDS · ${rows.length} สาย`
      : `SGF SEEDS · ${rows.length} strains`;
  const body = rows
    .map((row) => {
      const code = (row.varietyCode ?? row.id).trim();
      const format = row.seedFormat === "FEM" ? "Photo" : "Auto";
      return `${code} · ${row.name} · ${format}`;
    })
    .join("\n");
  return `${title}\n${body}`;
}
