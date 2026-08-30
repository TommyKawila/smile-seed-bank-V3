/** GF pilot programme — 4×50 sealed pouches, 5 strains (quotation/regulatory review) */

export const GF_PILOT_POUCH_QTY = 50;

export const GF_PILOT_POUCHES_PER_STRAIN = 4;

export const GF_PILOT_DEFAULT_QTY =
  GF_PILOT_POUCH_QTY * GF_PILOT_POUCHES_PER_STRAIN;

/** Indicative GF test-order cost — not a public sell rate */
export const GF_PILOT_THB_PER_SEED = 44.21;

/** Sealed-pouch B2B sell tiers — keyed on total cart seeds (all strains). */
export const GF_PILOT_POUCH_TIERS = [
  { minTotalSeeds: 50, maxTotalSeeds: 200, thbPerSeed: 125 },
  { minTotalSeeds: 250, maxTotalSeeds: 450, thbPerSeed: 100 },
  { minTotalSeeds: 500, maxTotalSeeds: 1000, thbPerSeed: 80 },
] as const;

/** @deprecated Use gfPilotSellThbPerSeed(totalSeeds) — tier 1 rate */
export const GF_PILOT_SELL_THB_PER_SEED = GF_PILOT_POUCH_TIERS[0].thbPerSeed;

export function gfPilotSellThbPerSeed(totalSeeds: number): number {
  const q = Math.floor(totalSeeds);
  if (q < GF_PILOT_POUCH_QTY) return 0;
  for (const tier of GF_PILOT_POUCH_TIERS) {
    if (q >= tier.minTotalSeeds && q <= tier.maxTotalSeeds) {
      return tier.thbPerSeed;
    }
  }
  if (q > 1000) return GF_PILOT_POUCH_TIERS[2].thbPerSeed;
  return 0;
}

export function gfPilotNextTier(totalSeeds: number): {
  needSeeds: number;
  nextThbPerSeed: number;
} | null {
  const q = Math.floor(totalSeeds);
  for (let i = 0; i < GF_PILOT_POUCH_TIERS.length - 1; i++) {
    const cur = GF_PILOT_POUCH_TIERS[i];
    const next = GF_PILOT_POUCH_TIERS[i + 1];
    if (q >= cur.minTotalSeeds && q <= cur.maxTotalSeeds) {
      return {
        needSeeds: next.minTotalSeeds - q,
        nextThbPerSeed: next.thbPerSeed,
      };
    }
  }
  return null;
}

export const GF_PILOT_STRAIN_CODES = [
  "AF99",
  "AF143",
  "AF02",
  "AF22",
  "AF102",
] as const;

export function isGfPilotPackQty(qty: number): boolean {
  const q = Math.floor(qty);
  if (q < GF_PILOT_POUCH_QTY) return false;
  if (q > GF_PILOT_DEFAULT_QTY) return false;
  return q % GF_PILOT_POUCH_QTY === 0;
}

export function gfPilotPouchCount(qty: number): number {
  return Math.floor(qty / GF_PILOT_POUCH_QTY);
}
