/** Matches `LanguageContext` locale; kept local to avoid pulling client modules into RSC. */
export type BlogCategoryLocale = "th" | "en";

/** Known blog index category slugs → localized pill labels (TH editorial / EN catalog). */
export const BLOG_CATEGORY_LABELS = {
  all: { th: "ทั้งหมด", en: "All" },
  knowledge: { th: "เกร็ดความรู้", en: "Knowledge" },
  lifestyle: { th: "วิถีสายเขียว", en: "Lifestyle" },
  news: { th: "ข่าวสารวงการ", en: "News" },
  grower_tips: { th: "เทคนิคการปลูก", en: "Grower Tips" },
} as const;

export type BlogCategoryLabelId = keyof typeof BLOG_CATEGORY_LABELS;

function knowledgeLike(cat: { name: string; slug: string }): boolean {
  const slug = cat.slug.toLowerCase().replace(/_/g, "-");
  const name = cat.name.toLowerCase();
  return (
    slug.includes("knowledge") ||
    slug.includes("ความรู้") ||
    name.includes("knowledge") ||
    name.includes("ความรู้") ||
    name.includes("องค์ความรู้")
  );
}

/** Maps API category to a known label id, or null to use `cat.name`. */
export function blogCategoryLabelId(cat: { name: string; slug: string }): BlogCategoryLabelId | null {
  const slug = cat.slug.toLowerCase().replace(/_/g, "-");
  const name = cat.name.toLowerCase();

  if (knowledgeLike(cat)) return "knowledge";
  if (slug === "lifestyle" || name === "lifestyle") return "lifestyle";
  if (slug === "news" || name === "news") return "news";
  if (
    slug === "grower-tips" ||
    slug === "grower_tips" ||
    name.includes("grower tip") ||
    name === "grower tips"
  ) {
    return "grower_tips";
  }
  return null;
}

export function magazineCategoryLabel(
  cat: { name: string; slug: string } | null | undefined,
  locale: BlogCategoryLocale
): string {
  if (!cat) return "";
  const id = blogCategoryLabelId(cat);
  if (id && id !== "all") {
    return BLOG_CATEGORY_LABELS[id][locale];
  }
  return cat.name;
}

export function allCategoriesLabel(locale: BlogCategoryLocale): string {
  return BLOG_CATEGORY_LABELS.all[locale];
}
