import {
  GF_TRACEABILITY_LAUNCH_STATUS,
  normalizeLotNumber,
  type TraceabilityLookup,
} from "@/lib/green-future-traceability";

/**
 * Public lot lookup — GF/SSB/2026-0824 two-tier model.
 * Does not enumerate lots. Preview mode never confirms existence.
 */
export function lookupPublicTraceabilityLot(raw: string): TraceabilityLookup {
  const lot = normalizeLotNumber(raw);
  if (!lot) return { kind: "invalid" };
  if (GF_TRACEABILITY_LAUNCH_STATUS !== "live") {
    return { kind: "unpublished", lot };
  }
  return { kind: "unknown", lot };
}
