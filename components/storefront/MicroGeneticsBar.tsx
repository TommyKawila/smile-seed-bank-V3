"use client";

import { getGeneticPercents } from "@/components/storefront/ProductSpecs";
import type { Product } from "@/types/supabase";

/** Includes flowering_type so photoperiod & photo_ff stay aligned with storefront (bar uses genetics only). */
type MicroProduct = Pick<
  Product,
  | "sativa_percent"
  | "indica_percent"
  | "sativa_ratio"
  | "indica_ratio"
  | "strain_dominance"
  | "genetic_ratio"
  | "flowering_type"
>;

function parseGeneticRatioString(s: string | null | undefined): { sativa: number; indica: number } | null {
  if (!s?.trim()) return null;
  const m = s.match(/(\d{1,3})\s*%[^0-9]*(\d{1,3})\s*%/);
  if (!m) return null;
  const a = Math.min(100, Math.max(0, Math.round(Number(m[1]))));
  const b = Math.min(100, Math.max(0, Math.round(Number(m[2]))));
  if (Math.abs(a + b - 100) > 2) return null;
  const lower = s.toLowerCase();
  const satIdx = lower.indexOf("sativa");
  const indIdx = lower.indexOf("indica");
  if (satIdx !== -1 && indIdx !== -1) {
    if (satIdx < indIdx) return { sativa: a, indica: b };
    return { sativa: b, indica: a };
  }
  return { sativa: a, indica: b };
}

function inferFromStrainDominance(sd: string | null | undefined): { sativa: number; indica: number } | null {
  const d = (sd ?? "").trim().toLowerCase();
  if (d === "hybrid 50/50" || d.includes("50/50")) return { sativa: 50, indica: 50 };
  if (d.includes("mostly sativa")) return { sativa: 70, indica: 30 };
  if (d.includes("mostly indica")) return { sativa: 30, indica: 70 };
  if (d.includes("hybrid")) return { sativa: 50, indica: 50 };
  return null;
}

function resolveMicroGenetics(product: MicroProduct): { sativa: number; indica: number } | null {
  let p = getGeneticPercents(product);
  if (!p) p = parseGeneticRatioString(product.genetic_ratio);
  if (!p) p = inferFromStrainDominance(product.strain_dominance);
  return p;
}

export function MicroGeneticsBar({ product }: { product: MicroProduct }) {
  const p = resolveMicroGenetics(product);
  if (!p) return null;
  const { sativa, indica } = p;
  const isPerfectSplit = sativa === 50 && indica === 50;

  return (
    <div
      aria-hidden
      className="flex h-1 w-full overflow-hidden rounded-full shadow-[0_0_8px_hsl(var(--primary)/0.3)] transition-[height] duration-200 ease-out group-hover:h-1.5"
    >
      {isPerfectSplit ? (
        <div className="h-full w-full bg-teal-500" />
      ) : (
        <div className="flex h-full w-full min-h-0">
          <div className="h-full shrink-0 bg-emerald-400" style={{ width: `${sativa}%` }} />
          <div className="h-full shrink-0 bg-violet-400" style={{ width: `${indica}%` }} />
        </div>
      )}
    </div>
  );
}
