/** GF pilot programme — 4×50 sealed pouches, 5 strains (quotation/regulatory review) */

export const GF_PILOT_POUCH_QTY = 50;

export const GF_PILOT_POUCHES_PER_STRAIN = 4;

export const GF_PILOT_DEFAULT_QTY =
  GF_PILOT_POUCH_QTY * GF_PILOT_POUCHES_PER_STRAIN;

/** Indicative test-order landed rate — confirm in GF quotation */
export const GF_PILOT_THB_PER_SEED = 44.21;

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
