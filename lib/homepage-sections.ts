/** Keys must match `homepage_sections.key` and `HomePageClient` section map. */
export const DEFAULT_HOME_SECTION_KEYS = [
  "hero",
  "categories",
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
