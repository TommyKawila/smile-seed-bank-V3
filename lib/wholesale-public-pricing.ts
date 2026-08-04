/**
 * Public B2B wholesale landing — tiered seed pricing (THB / EUR).
 * Separate from admin B2B_MOQ_SEEDS (500).
 */

import type { B2BCurrency } from "@/types/b2b-quote";
import { B2B_PRESET_STRAINS } from "@/types/b2b-quote";
import { formatB2BMoney, roundMoney } from "@/lib/b2b-quote-calc";

export const WHOLESALE_PUBLIC_MOQ = 100;

export type WholesaleTierId = 1 | 2 | 3;

export type WholesaleTier = {
  id: WholesaleTierId;
  minQty: number;
  maxQty: number | null;
  thbPerSeed: number;
  eurPerSeed: number;
  bestValue: boolean;
};

export const WHOLESALE_TIERS: WholesaleTier[] = [
  {
    id: 1,
    minQty: 100,
    maxQty: 999,
    thbPerSeed: 65,
    eurPerSeed: 1.75,
    bestValue: false,
  },
  {
    id: 2,
    minQty: 1000,
    maxQty: 2499,
    thbPerSeed: 55,
    eurPerSeed: 1.5,
    bestValue: false,
  },
  {
    id: 3,
    minQty: 2500,
    maxQty: null,
    thbPerSeed: 50,
    eurPerSeed: 1.35,
    bestValue: true,
  },
];

export const GACP_FEE_THB = 3500;
export const GACP_FEE_EUR = 100;

export type WholesaleCatalogStrain = {
  id: string;
  name: string;
  typeLabel: string;
};

export const WHOLESALE_CATALOG: WholesaleCatalogStrain[] =
  B2B_PRESET_STRAINS.map((name) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    typeLabel: "Feminized",
  }));

export function resolveTier(quantity: number): WholesaleTier {
  const qty = Math.max(0, Math.floor(quantity));
  if (qty >= 2500) return WHOLESALE_TIERS[2];
  if (qty >= 1000) return WHOLESALE_TIERS[1];
  return WHOLESALE_TIERS[0];
}

export function unitPrice(quantity: number, currency: B2BCurrency): number {
  const tier = resolveTier(quantity);
  return currency === "THB" ? tier.thbPerSeed : tier.eurPerSeed;
}

export function lineTotal(
  quantity: number,
  currency: B2BCurrency
): number {
  const qty = Math.max(0, Math.floor(quantity));
  return roundMoney(qty * unitPrice(qty, currency), currency);
}

export function gacpFeePerStrain(currency: B2BCurrency): number {
  return currency === "THB" ? GACP_FEE_THB : GACP_FEE_EUR;
}

export function gacpFeeTotal(
  strainCount: number,
  currency: B2BCurrency
): number {
  const n = Math.max(0, Math.floor(strainCount));
  return roundMoney(n * gacpFeePerStrain(currency), currency);
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
