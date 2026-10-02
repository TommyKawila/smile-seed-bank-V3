import { GF_PILOT_STRAIN_CODES } from "@/lib/green-future-pilot-config";

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
