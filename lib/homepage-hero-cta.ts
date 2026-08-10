/** Storefront-safe hero CTA types (no server imports). */
export type HeroCtaColor = "green" | "red" | "yellow" | "outline";

/** @deprecated Use HeroCtaColor */
export type HeroCtaVariant = HeroCtaColor;

export type HeroCtaButtonPayload = {
  id: string;
  labelTh: string;
  labelEn: string;
  href: string;
  color: HeroCtaColor;
};

export const HERO_CTA_COLOR_OPTIONS: {
  value: HeroCtaColor;
  label: string;
  swatchClass: string;
}[] = [
  { value: "green", label: "เขียว (Teal / โลโก้)", swatchClass: "bg-primary" },
  { value: "red", label: "แดง (Smile)", swatchClass: "bg-red-600" },
  { value: "yellow", label: "เหลือง (Smile)", swatchClass: "bg-amber-400" },
  { value: "outline", label: "Outline (glass)", swatchClass: "bg-card ring-1 ring-border" },
];

export function normalizeHeroCtaColor(raw: string | null | undefined): HeroCtaColor {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "primary" || v === "green") return "green";
  if (v === "red" || v === "yellow" || v === "outline") return v;
  return "outline";
}

export function heroCtaButtonClassName(color: HeroCtaColor): string {
  switch (color) {
    case "green":
      return "border border-primary bg-primary font-semibold text-primary-foreground hover:border-emerald-400 hover:bg-emerald-400";
    case "red":
      return "border border-red-500 bg-red-600/90 font-semibold text-white hover:bg-red-500";
    case "yellow":
      return "border border-amber-400/80 bg-amber-400/90 font-semibold text-slate-950 hover:bg-amber-300";
    case "outline":
      return "border border-zinc-700 bg-zinc-900/50 font-medium text-zinc-200 hover:border-zinc-600 hover:bg-zinc-900/70 hover:text-zinc-100";
  }
}

export function heroCtaShowsChevron(color: HeroCtaColor): boolean {
  return color !== "outline";
}

export function normalizeHeroCtaHref(href: string, ctaId?: string): string {
  if (ctaId === "hero_cta_clearance") return "/clearance";
  if (ctaId === "hero_cta_new") return "/new";
  const h = href.trim();
  if (!h) return "/";
  const lower = h.toLowerCase();
  if (lower === "/clearance" || lower.startsWith("/clearance?")) return "/clearance";
  if (lower.includes("quick=clearance") || lower.includes("filter=clearance")) {
    return "/clearance";
  }
  if (lower.includes("quick=sale") && ctaId === "hero_cta_clearance") {
    return "/clearance";
  }
  if (lower === "/new" || lower.startsWith("/new?")) return "/new";
  if (
    lower.includes("sort=new_arrivals") ||
    lower.includes("quick=new") ||
    lower.includes("filter=new")
  ) {
    return "/new";
  }
  return h;
}

export const DEFAULT_HERO_CTA_BUTTONS: HeroCtaButtonPayload[] = [
  { id: "default_0", labelTh: "เมล็ดพันธุ์ทั้งหมด", labelEn: "All Seeds", href: "/seeds", color: "green" },
  { id: "default_1", labelTh: "เมล็ดพันธุ์มาใหม่", labelEn: "New Arrivals", href: "/new", color: "outline" },
  { id: "default_2", labelTh: "เมล็ดพันธุ์ลดราคา", labelEn: "Clearance Seeds", href: "/clearance", color: "red" },
  { id: "default_3", labelTh: "บทความน่าสนใจ", labelEn: "Featured Articles", href: "/blog", color: "outline" },
];
