export type SectionTitle = { th: string; en: string };

/** Use DB labels when set; `"—"` or blank falls back to default copy. */
export function resolveSectionHeading(
  locale: "th" | "en",
  sectionTitle: SectionTitle | undefined,
  fallbackTh: string,
  fallbackEn: string
): string {
  const raw = locale === "en" ? sectionTitle?.en?.trim() : sectionTitle?.th?.trim();
  if (!raw || raw === "—") return locale === "en" ? fallbackEn : fallbackTh;
  return raw;
}
