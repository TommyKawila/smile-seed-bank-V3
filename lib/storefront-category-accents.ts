/** Storefront category accent classes — New Seeds = violet/cyan, Clearance = orange/red, Vault = emerald/teal. */

export type ProductStatusAccent = "vault" | "new" | "clearance";

export function resolveProductAccent(product: {
  is_clearance?: boolean | null;
  is_pinned_new_arrival?: boolean | null;
}): ProductStatusAccent {
  if (product.is_clearance === true) return "clearance";
  if (product.is_pinned_new_arrival === true) return "new";
  return "vault";
}

export function productAccentTokens(accent: ProductStatusAccent) {
  switch (accent) {
    case "clearance":
      return CLEARANCE_ACCENT;
    case "new":
      return NEW_SEEDS_ACCENT;
    default:
      return VAULT_ACCENT;
  }
}

export const CLEARANCE_ACCENT = {
  heroRadial:
    "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(249,115,22,0.18),_transparent_55%)] motion-safe:animate-pulse motion-safe:duration-[3s]",
  eyebrow: "text-[11px] font-medium uppercase tracking-[0.22em] text-orange-400/90",
  titleGradient:
    "mt-2 max-w-2xl bg-gradient-to-r from-white via-orange-100 to-red-300 bg-clip-text font-sans text-3xl font-semibold tracking-tight text-transparent sm:text-4xl",
  titlePlain:
    "mt-1.5 max-w-2xl font-sans text-2xl font-semibold tracking-tight text-white sm:mt-2 sm:text-4xl",
  backLink: "text-orange-400 hover:text-orange-300",
  drillBadge:
    "ml-2 inline-flex align-middle rounded-md bg-gradient-to-r from-orange-500 to-red-500 px-2 py-0.5 text-sm font-bold text-zinc-950 sm:text-base",
  logoRing: "border border-orange-500/30 ring-1 ring-orange-500/20",
  tierPercentHigh: "text-red-400",
  tierPercentMid: "text-orange-400",
  tierPercentLow: "text-orange-300",
  ctaOutline:
    "border-orange-500/40 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20",
  ctaOutlineGhost:
    "border-orange-500/40 bg-zinc-900 text-orange-300 hover:bg-zinc-800 hover:text-orange-200",
  skeleton: "animate-pulse rounded-2xl bg-orange-950/40 aspect-[4/3]",
  boxBorder:
    "border-orange-500/25 shadow-[0_0_40px_-12px_rgba(249,115,22,0.45)] hover:border-red-400/40 hover:shadow-[0_0_48px_-8px_rgba(239,68,68,0.35)]",
  boxRadial:
    "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(249,115,22,0.35),_transparent_55%)] opacity-80 transition group-hover:opacity-100",
  boxSubtitle: "text-orange-200/90",
  boxFocusRing: "focus-visible:ring-orange-400",
  cardBorder: "border-orange-500/20 hover:border-orange-400/35",
  cardBreederLogo: "border-orange-500/30 ring-orange-500/15",
  cardTitleHover: "hover:text-orange-300",
  cardPrice: "text-orange-100",
  cardBreederLink: "hover:text-orange-300",
  cardThcPill: "text-orange-300/90",
  cardPackLabel: "text-orange-300/80",
  addButton:
    "border-orange-500/40 bg-orange-500/10 text-orange-200 hover:border-orange-400/50 hover:bg-orange-500/20",
  availabilityPill:
    "border-orange-500/15 bg-orange-500/5 text-orange-300/75",
  discountBadgeHigh: "bg-gradient-to-r from-red-500 to-red-600 text-white",
  discountBadgeMid: "bg-gradient-to-r from-orange-500 to-red-500 text-zinc-950",
  discountBadgeLow: "bg-gradient-to-r from-orange-400 to-orange-500 text-zinc-950",
  packChip: "border-orange-500/40 bg-orange-500/15 text-orange-300",
  brandDiscountBadge: "bg-gradient-to-r from-orange-500 to-red-500 text-zinc-950",
  pdpBackLink: "text-zinc-500 hover:text-zinc-300",
  pdpPrice: "text-zinc-100",
  pdpPackSelected: "border-zinc-600 bg-zinc-800/80 text-zinc-100",
  pdpPackIdle:
    "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-300",
  pdpPackSelectedPrice: "text-zinc-100",
  pdpPackBadge: "border border-orange-500/25 bg-transparent text-orange-400/80",
  pdpStockPill: "border-orange-500/25 bg-transparent text-orange-400/80",
  pdpSaleBadge: "border border-orange-500/25 bg-transparent text-orange-400/80",
  geneticTrack: "bg-zinc-800/80",
  geneticSativaLabel: "text-amber-400",
  geneticIndicaLabel: "text-orange-400",
  geneticSativaBar: "bg-amber-500",
  geneticIndicaBar: "bg-orange-600",
  chipIdle:
    "border-orange-500/35 bg-card text-orange-300/90 hover:border-orange-400/50 hover:bg-orange-500/10",
  chipActive: "border-orange-500 bg-orange-500/20 text-orange-100 shadow-sm",
  filterTitle: "text-orange-300",
} as const;

export function pdpClearanceSaleBadgeClass(percent: number): string {
  if (percent >= 50) return "border border-red-500/25 bg-transparent text-red-400/80";
  if (percent >= 30) return "border border-orange-500/25 bg-transparent text-orange-400/80";
  return "border border-orange-500/20 bg-transparent text-orange-300/80";
}

export function clearanceDiscountBadgeClass(percent: number): string {
  if (percent >= 50) return CLEARANCE_ACCENT.discountBadgeHigh;
  if (percent >= 30) return CLEARANCE_ACCENT.discountBadgeMid;
  return CLEARANCE_ACCENT.discountBadgeLow;
}

export function clearanceTierPercentClass(percent: number): string {
  if (percent >= 50) return CLEARANCE_ACCENT.tierPercentHigh;
  if (percent >= 30) return CLEARANCE_ACCENT.tierPercentMid;
  return CLEARANCE_ACCENT.tierPercentLow;
}

export const NEW_SEEDS_ACCENT = {
  backLink: "text-violet-400 hover:text-violet-300",
  cardBorder: "border-violet-500/20 hover:border-violet-400/35",
  cardBreederLogo: "border-violet-500/30 ring-violet-500/15",
  cardTitleHover: "hover:text-cyan-300",
  cardPrice: "text-violet-200",
  cardBreederLink: "hover:text-violet-300",
  cardThcPill: "text-violet-300/90",
  cardPackLabel: "text-cyan-400/80",
  availabilityPill: "border-violet-500/15 bg-violet-500/5 text-violet-300/75",
  packChip: "border-violet-500/40 bg-violet-500/15 text-violet-300",
  newBadge: "bg-gradient-to-r from-violet-500 to-cyan-400 text-zinc-950",
  brandDiscountBadge: "bg-gradient-to-r from-violet-500 to-cyan-400 text-zinc-950",
  pdpBackLink: "text-zinc-500 hover:text-zinc-300",
  pdpPrice: "text-zinc-100",
  pdpPackSelected: "border-zinc-600 bg-zinc-800/80 text-zinc-100",
  pdpPackIdle:
    "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-300",
  pdpPackSelectedPrice: "text-zinc-100",
  pdpPackBadge: "border border-violet-500/25 bg-transparent text-violet-400/80",
  pdpStockPill: "border-violet-500/25 bg-transparent text-violet-400/80",
  pdpSaleBadge: "border border-violet-500/25 bg-transparent text-violet-400/80",
  geneticTrack: "bg-zinc-800/80",
  geneticSativaLabel: "text-cyan-400",
  geneticIndicaLabel: "text-violet-400",
  geneticSativaBar: "bg-cyan-500",
  geneticIndicaBar: "bg-violet-500",
  addButton:
    "border-violet-500/40 bg-violet-500/10 text-violet-200 hover:border-violet-400/50 hover:bg-violet-500/20",
  chipIdle:
    "border-violet-500/35 bg-card text-violet-300/90 hover:border-violet-400/50 hover:bg-violet-500/10",
  chipActive: "border-violet-500 bg-violet-500/20 text-violet-100 shadow-sm",
  filterTitle: "text-violet-300",
} as const;

export const VAULT_ACCENT = {
  heroRadial:
    "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.18),_transparent_55%)] motion-safe:animate-pulse motion-safe:duration-[3s]",
  eyebrow: "text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-400/90",
  titleGradient:
    "mt-1.5 max-w-2xl bg-gradient-to-r from-white via-emerald-100 to-teal-300 bg-clip-text font-sans text-2xl font-semibold tracking-tight text-transparent sm:mt-2 sm:text-4xl",
  sectionHint: "text-emerald-400/70",
  ctaOutline:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 focus-visible:ring-teal-400",
  skeleton: "animate-pulse rounded-2xl bg-emerald-950/40 aspect-[4/3]",
  boxBorder:
    "border-emerald-500/25 shadow-[0_0_40px_-12px_rgba(16,185,129,0.45)] hover:border-teal-400/40 hover:shadow-[0_0_48px_-8px_rgba(45,212,191,0.35)]",
  boxRadial:
    "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.35),_transparent_55%)] opacity-80 transition group-hover:opacity-100",
  boxSubtitle: "text-emerald-200/90",
  boxFocusRing: "focus-visible:ring-teal-400",
  facetRing: "ring-1 ring-emerald-500/10 hover:ring-emerald-500/20",
  cardBorder: "border-emerald-500/20 hover:border-emerald-400/35",
  cardBreederLogo: "border-emerald-500/30 ring-emerald-500/15",
  cardTitleHover: "hover:text-emerald-300",
  cardPrice: "text-emerald-200",
  cardBreederLink: "hover:text-emerald-300",
  cardThcPill: "text-emerald-300/90",
  cardPackLabel: "text-teal-400/80",
  availabilityPill: "border-emerald-500/15 bg-emerald-500/5 text-emerald-300/75",
  packChip: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  brandDiscountBadge: "bg-primary/90 text-primary-foreground",
  pdpBackLink: "text-zinc-500 hover:text-zinc-300",
  pdpPrice: "text-zinc-100",
  pdpPackSelected: "border-zinc-600 bg-zinc-800/80 text-zinc-100",
  pdpPackIdle:
    "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-300",
  pdpPackSelectedPrice: "text-zinc-100",
  pdpPackBadge: "border border-zinc-600 bg-transparent text-zinc-400",
  pdpStockPill: "border-zinc-700 bg-transparent text-zinc-400",
  pdpSaleBadge: "border border-zinc-600 bg-transparent text-zinc-300",
  geneticTrack: "bg-zinc-800/80",
  geneticSativaLabel: "text-emerald-400",
  geneticIndicaLabel: "text-indica",
  geneticSativaBar: "bg-emerald-500",
  geneticIndicaBar: "bg-indica",
  addButton:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400/50 hover:bg-emerald-500/20",
  chipIdle:
    "border-emerald-500/35 bg-card text-emerald-300/90 hover:border-emerald-400/50 hover:bg-emerald-500/10",
  chipActive: "border-primary bg-primary text-white shadow-sm",
  filterTitle: "text-emerald-300",
} as const;

export function vaultSkeletonClass(index: number): string {
  const base = VAULT_ACCENT.skeleton;
  if (index === 0) return `${base} md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-[22rem]`;
  return base;
}
