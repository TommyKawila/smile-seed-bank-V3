import sgCatalog from "@/data/partners/seeds-genetics/catalog.json";

export type SgCatalogStrain = {
  id: number;
  name: string;
  slug: string;
  sourceUrl: string;
  categories: { slug: string; label: string }[];
  primaryCategory: string;
};

export type SgCatalogFile = {
  fetchedAt: string;
  source: string;
  strains: SgCatalogStrain[];
  byCategory: Record<string, SgCatalogStrain[]>;
};

export const SEEDS_GENETICS_CATALOG = sgCatalog as SgCatalogFile;

/** Display order — most specific buckets first. */
export const SG_CATEGORY_ORDER = [
  "cbd-seeds",
  "supreme-feminized",
  "supreme-autoflower",
  "cali-feminized",
  "cali-autoflower",
  "feminized-seeds",
  "autoflower-seeds",
] as const;

export type SgCategorySlug = (typeof SG_CATEGORY_ORDER)[number];

export const SG_CATEGORY_LABEL: Record<SgCategorySlug, string> = {
  "cbd-seeds": "CBD seeds",
  "supreme-feminized": "Supreme feminized",
  "supreme-autoflower": "Supreme autoflower",
  "cali-feminized": "Cali feminized",
  "cali-autoflower": "Cali autoflower",
  "feminized-seeds": "Feminized seeds",
  "autoflower-seeds": "Autoflower seeds",
};

export function sgStrainsGrouped(): { slug: SgCategorySlug; label: string; strains: SgCatalogStrain[] }[] {
  return SG_CATEGORY_ORDER.map((slug) => ({
    slug,
    label: SG_CATEGORY_LABEL[slug],
    strains: SEEDS_GENETICS_CATALOG.byCategory[slug] ?? [],
  })).filter((g) => g.strains.length > 0);
}

export function filterSgCatalog(
  query: string
): { slug: SgCategorySlug; label: string; strains: SgCatalogStrain[] }[] {
  const q = query.trim().toLowerCase();
  const groups = sgStrainsGrouped();
  if (!q) return groups;
  return groups
    .map((g) => ({
      ...g,
      strains: g.strains.filter((s) => s.name.toLowerCase().includes(q)),
    }))
    .filter((g) => g.strains.length > 0);
}

export function sgCatalogFetchedLabel(): string {
  try {
    return new Date(SEEDS_GENETICS_CATALOG.fetchedAt).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return SEEDS_GENETICS_CATALOG.fetchedAt;
  }
}
