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
  { value: "outline", label: "ขาว (Outline)", swatchClass: "bg-white ring-1 ring-zinc-300" },
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
      return "border border-primary bg-primary font-medium text-primary-foreground hover:bg-primary/90";
    case "red":
      return "border border-red-600 bg-red-600 font-medium text-white hover:bg-red-700";
    case "yellow":
      return "border border-amber-400 bg-amber-400 font-medium text-zinc-900 hover:bg-amber-500";
    case "outline":
      return "border border-zinc-300 bg-transparent font-normal text-zinc-800 hover:border-primary/40 hover:bg-zinc-50";
  }
}

export function heroCtaShowsChevron(color: HeroCtaColor): boolean {
  return color !== "outline";
}

export const DEFAULT_HERO_CTA_BUTTONS: HeroCtaButtonPayload[] = [
  { id: "default_0", labelTh: "เมล็ดพันธุ์ทั้งหมด", labelEn: "All Seeds", href: "/seeds", color: "green" },
  { id: "default_1", labelTh: "เมล็ดพันธุ์มาใหม่", labelEn: "New Arrivals", href: "/shop?sort=new_arrivals", color: "outline" },
  { id: "default_2", labelTh: "เมล็ดพันธุ์ลดราคา", labelEn: "Clearance Seeds", href: "/seeds?quick=clearance", color: "outline" },
  { id: "default_3", labelTh: "บทความน่าสนใจ", labelEn: "Featured Articles", href: "/blog", color: "outline" },
];
