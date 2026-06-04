/** Shared catalog sticky-strip labels (TH/EN keys passed through `t()`). */

export const CATALOG_SEX_STRIP_SLUGS = ["feminized", "regular"] as const;
export type CatalogSexStripSlug = (typeof CATALOG_SEX_STRIP_SLUGS)[number];

export const CATALOG_SEX_STRIP_LABELS: Record<
  CatalogSexStripSlug,
  { th: string; en: string }
> = {
  feminized: { th: "เพศเมีย", en: "Feminized" },
  regular: { th: "สุ่มเพศ", en: "Regular" },
};

export const CATALOG_GENETICS_STRIP_SLUGS = ["sativa-dom", "indica-dom", "hybrid"] as const;

export const CATALOG_GENETICS_STRIP_LABELS: Record<
  (typeof CATALOG_GENETICS_STRIP_SLUGS)[number],
  { th: string; en: string }
> = {
  "sativa-dom": { th: "ซาติวา", en: "Sativa" },
  "indica-dom": { th: "อินดิกา", en: "Indica" },
  hybrid: { th: "ไฮบริด 50/50", en: "Hybrid 50/50" },
};
