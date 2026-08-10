/** Storefront category accent classes — New Seeds = violet/cyan, Clearance = orange/red, Vault = emerald/teal. */

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
  availabilityPill:
    "border-orange-500/15 bg-orange-500/5 text-orange-300/75",
  discountBadgeHigh: "bg-gradient-to-r from-red-500 to-red-600 text-white",
  discountBadgeMid: "bg-gradient-to-r from-orange-500 to-red-500 text-zinc-950",
  discountBadgeLow: "bg-gradient-to-r from-orange-400 to-orange-500 text-zinc-950",
  packChip: "border-orange-500/40 bg-orange-500/15 text-orange-300",
} as const;

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
} as const;

export function vaultSkeletonClass(index: number): string {
  const base = VAULT_ACCENT.skeleton;
  if (index === 0) return `${base} md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-[22rem]`;
  return base;
}
