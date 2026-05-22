/** Storefront-safe hero CTA types (no server imports). */
export type HeroCtaVariant = "primary" | "outline";

export type HeroCtaButtonPayload = {
  id: string;
  labelTh: string;
  labelEn: string;
  href: string;
  variant: HeroCtaVariant;
};

export const DEFAULT_HERO_CTA_BUTTONS: HeroCtaButtonPayload[] = [
  { id: "default_0", labelTh: "เมล็ดพันธุ์ทั้งหมด", labelEn: "All Seeds", href: "/seeds", variant: "primary" },
  { id: "default_1", labelTh: "เมล็ดพันธุ์มาใหม่", labelEn: "New Arrivals", href: "/shop?sort=new_arrivals", variant: "outline" },
  { id: "default_2", labelTh: "เมล็ดพันธุ์ลดราคา", labelEn: "Clearance Seeds", href: "/shop", variant: "outline" },
  { id: "default_3", labelTh: "บทความน่าสนใจ", labelEn: "Featured Articles", href: "/blog", variant: "outline" },
];
