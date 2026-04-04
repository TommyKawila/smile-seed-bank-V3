"use client";

import { motion } from "framer-motion";
import { Mars, Venus } from "lucide-react";
import type { Product } from "@/types/supabase";

/** Compact feminized chip — flat secondary (lavender) per Premium Eco-Clinical. */
export function FeminizedSeedSpecChip({ className }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 ${className ?? ""}`}
    >
      <Venus className="h-6 w-6 shrink-0 text-secondary-foreground" aria-hidden />
      <span className="text-xs font-semibold tracking-wide text-secondary-foreground">Fem</span>
    </div>
  );
}

/** Compact regular seed chip — outline + Mars. */
export function RegularSeedSpecChip({ className }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 ${className ?? ""}`}
    >
      <Mars className="h-6 w-6 shrink-0 text-primary" aria-hidden />
      <span className="text-xs font-semibold tracking-wide text-primary">Reg</span>
    </div>
  );
}

/** Bento stat cell when sex / seed is feminized — lavender slot in 4-tone lab palette. */
export function FeminizedStatCard({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[length:var(--radius)] border border-border/40 bg-secondary p-4 text-center">
      <Venus className="mb-1.5 h-6 w-6 text-secondary-foreground" aria-hidden />
      <span className="text-xl font-semibold tracking-tight text-secondary-foreground">Fem</span>
      <span className="mt-0.5 text-xs font-medium uppercase tracking-wider text-secondary-foreground">
        {label}
      </span>
    </div>
  );
}

/** Bento stat cell when seed / sex is regular — muted slot + Mars. */
export function RegularStatCard({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[length:var(--radius)] border border-border/40 bg-muted/50 p-4 text-center">
      <Mars className="mb-1.5 h-6 w-6 text-primary" aria-hidden />
      <span className="text-xl font-semibold tracking-tight text-primary">Reg</span>
      <span className="mt-0.5 text-xs font-medium uppercase tracking-wider text-primary">
        {label}
      </span>
    </div>
  );
}

function toPct(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** Prefer integer columns; fall back to legacy ratio decimals. */
export function getGeneticPercents(product: Pick<
  Product,
  "sativa_percent" | "indica_percent" | "sativa_ratio" | "indica_ratio"
>): { sativa: number; indica: number } | null {
  let s = toPct(product.sativa_percent);
  let i = toPct(product.indica_percent);
  if (s == null && i == null) {
    s = toPct(product.sativa_ratio);
    i = toPct(product.indica_ratio);
  }
  if (s == null || i == null) return null;
  return { sativa: s, indica: i };
}

type TFn = (th: string, en: string) => string;

export function GeneticRatioBar({
  product,
  variant = "card",
  t,
}: {
  product: Pick<Product, "sativa_percent" | "indica_percent" | "sativa_ratio" | "indica_ratio">;
  variant?: "compact" | "card";
  t: TFn;
}) {
  const p = getGeneticPercents(product);
  if (!p) return null;

  const { sativa, indica } = p;

  const bar = (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold sm:text-sm">
        <span className="font-semibold text-primary">
          {t(`ซาติวา: ${sativa}%`, `Sativa: ${sativa}%`)}
        </span>
        <span className="font-semibold text-secondary-foreground">
          {t(`อินดิกา: ${indica}%`, `Indica: ${indica}%`)}
        </span>
      </div>
      <div className="flex h-3 w-full rounded-full bg-muted sm:h-3.5">
        <motion.div
          className="relative z-10 h-full shrink-0 rounded-l-full bg-sativa shadow-[0_0_10px_hsl(var(--sativa)/0.4)]"
          initial={{ width: "0%" }}
          animate={{ width: `${sativa}%` }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="relative z-0 h-full shrink-0 rounded-r-full bg-secondary shadow-[0_0_12px_hsl(var(--secondary)/0.5)]"
          initial={{ width: "0%" }}
          animate={{ width: `${indica}%` }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
        />
      </div>
    </div>
  );

  if (variant === "compact") {
    return <div className="space-y-1">{bar}</div>;
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {t("สัดส่วนพันธุกรรม", "Genetic ratio")}
      </p>
      {bar}
    </div>
  );
}
