/** Keys must match `homepage_sections.key` and `HomePageClient` section map. */
export const DEFAULT_HOME_SECTION_KEYS = [
  "hero",
  "categories",
  "breeder_showcase",
  "blog",
  "featured",
  "breeders",
  "trust",
  "new_strains",
  "newsletter",
] as const;

export type HomepageSectionKey = (typeof DEFAULT_HOME_SECTION_KEYS)[number];

/** Server → `HomePageClient`: active sections with admin labels. */
export type HomePageSectionPayload = {
  key: string;
  label_th: string;
  label_en: string;
};

/** Fallback copy when DB has no `homepage_sections` rows yet. */
export const DEFAULT_SECTION_FALLBACK_LABELS: Record<
  string,
  { label_th: string; label_en: string }
> = {
  hero: { label_th: "แบนเนอร์หลัก", label_en: "Hero" },
  categories: { label_th: "เลือกสไตล์การปลูก", label_en: "Find your grow style" },
  breeder_showcase: {
    label_th: "กริด Breeder เด่น (ไอคอน)",
    label_en: "Featured Breeders Grid (Icons)",
  },
  blog: { label_th: "คลังความรู้ / บทความ", label_en: "Blog / Insights" },
  featured: { label_th: "สินค้าแนะนำ", label_en: "Featured products" },
  breeders: {
    label_th: "แถบ Breeder บนสุด (สไลด์)",
    label_en: "Top Breeders Bar (Slider)",
  },
  trust: { label_th: "จุดเด่นร้าน (3 คอลัมน์)", label_en: "Trust highlights" },
  new_strains: { label_th: "สายพันธุ์มาใหม่", label_en: "New arrivals grid" },
  newsletter: { label_th: "แบนเนอร์สมัครสมาชิก", label_en: "Newsletter / sign-up" },
};
