/**
 * Public B2B wholesale landing — tiered seed pricing (THB / EUR).
 * Defaults used for seed/migration; runtime values come from wholesale_settings.
 */

import type { B2BCurrency } from "@/types/b2b-quote";
import { formatB2BMoney, roundMoney } from "@/lib/b2b-quote-calc";

export const WHOLESALE_PUBLIC_MOQ = 100;

export type WholesaleTierId = 1 | 2 | 3 | number;

export type WholesaleTier = {
  id: WholesaleTierId;
  minQty: number;
  maxQty: number | null;
  thbPerSeed: number;
  eurPerSeed: number;
  bestValue: boolean;
};

/** Seed / fallback tiers (same as original landing). */
export const DEFAULT_WHOLESALE_TIERS: WholesaleTier[] = [
  {
    id: 1,
    minQty: 100,
    maxQty: 999,
    thbPerSeed: 66,
    eurPerSeed: 1.72,
    bestValue: false,
  },
  {
    id: 2,
    minQty: 1000,
    maxQty: 2499,
    thbPerSeed: 52,
    eurPerSeed: 1.35,
    bestValue: false,
  },
  {
    id: 3,
    minQty: 2500,
    maxQty: null,
    thbPerSeed: 52,
    eurPerSeed: 1.35,
    bestValue: true,
  },
];

/** @deprecated Use settings from DB — kept as alias for defaults. */
export const WHOLESALE_TIERS = DEFAULT_WHOLESALE_TIERS;

export const GACP_FEE_THB = 3500;
export const GACP_FEE_EUR = 100;

export type WholesaleCatalogStrain = {
  id: string;
  name: string;
  typeLabel: string;
};

export type WholesalePricingContext = {
  moq: number;
  tiers: WholesaleTier[];
  gacpFeeThb: number;
  gacpFeeEur: number;
};

export function resolveTier(
  quantity: number,
  tiers: WholesaleTier[] = DEFAULT_WHOLESALE_TIERS
): WholesaleTier {
  const qty = Math.max(0, Math.floor(quantity));
  const sorted = [...tiers].sort((a, b) => b.minQty - a.minQty);
  for (const tier of sorted) {
    if (qty >= tier.minQty) return tier;
  }
  return sorted[sorted.length - 1] ?? DEFAULT_WHOLESALE_TIERS[0];
}

export function unitPrice(
  quantity: number,
  currency: B2BCurrency,
  tiers: WholesaleTier[] = DEFAULT_WHOLESALE_TIERS
): number {
  const tier = resolveTier(quantity, tiers);
  return currency === "THB" ? tier.thbPerSeed : tier.eurPerSeed;
}

export function lineTotal(
  quantity: number,
  currency: B2BCurrency,
  tiers: WholesaleTier[] = DEFAULT_WHOLESALE_TIERS
): number {
  const qty = Math.max(0, Math.floor(quantity));
  return roundMoney(qty * unitPrice(qty, currency, tiers), currency);
}

export function gacpFeePerStrain(
  currency: B2BCurrency,
  fees?: { thb: number; eur: number }
): number {
  const thb = fees?.thb ?? GACP_FEE_THB;
  const eur = fees?.eur ?? GACP_FEE_EUR;
  return currency === "THB" ? thb : eur;
}

export function gacpFeeTotal(
  strainCount: number,
  currency: B2BCurrency,
  fees?: { thb: number; eur: number }
): number {
  const n = Math.max(0, Math.floor(strainCount));
  return roundMoney(n * gacpFeePerStrain(currency, fees), currency);
}

export function formatWholesaleMoney(
  amount: number,
  currency: B2BCurrency
): string {
  return formatB2BMoney(amount, currency);
}

export function tierLabel(tier: WholesaleTier): string {
  if (tier.maxQty == null) return `${tier.minQty.toLocaleString()}+ seeds`;
  return `${tier.minQty.toLocaleString()} – ${tier.maxQty.toLocaleString()} seeds`;
}
