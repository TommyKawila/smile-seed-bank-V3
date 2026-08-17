/**
 * One-off snapshot: Seeds Genetics public WooCommerce catalog.
 * Run: npx tsx scripts/fetch-seeds-genetics-catalog.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE = "https://seedsgenetics.com/wp-json/wc/store/v1/products";
const OUT = path.join(
  process.cwd(),
  "data/partners/seeds-genetics/catalog.json"
);

/** Seed categories to crawl (WooCommerce product_cat id). */
const SEED_CATEGORIES: { id: number; slug: string; label: string }[] = [
  { id: 16, slug: "feminized-seeds", label: "Feminized seeds" },
  { id: 17, slug: "autoflower-seeds", label: "Autoflower seeds" },
  { id: 20, slug: "cbd-seeds", label: "CBD seeds" },
  { id: 26, slug: "cali-feminized", label: "Cali feminized" },
  { id: 25, slug: "cali-autoflower", label: "Cali autoflower" },
  { id: 241, slug: "supreme-feminized", label: "Supreme feminized" },
  { id: 240, slug: "supreme-autoflower", label: "Supreme autoflower" },
];

const SKIP_CATEGORY_SLUGS = new Set([
  "merchandise",
  "bulk-seeds",
  "bestseller",
  "price-winner",
  "prijswinnend",
  "sale",
  "freebies",
  "hoog",
  "laag",
  "midden",
  "uncategorized",
]);

/** Display bucket priority — most specific wins. */
const PRIMARY_PRIORITY: Record<string, number> = {
  "cbd-seeds": 1,
  "supreme-feminized": 2,
  "supreme-autoflower": 3,
  "cali-feminized": 4,
  "cali-autoflower": 5,
  "feminized-seeds": 6,
  "autoflower-seeds": 7,
};

type WcCategory = { id: number; name: string; slug: string };
type WcProduct = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  categories: WcCategory[];
};

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

function primaryCategory(slugs: string[]): string {
  let best = slugs[0] ?? "feminized-seeds";
  let bestRank = PRIMARY_PRIORITY[best] ?? 99;
  for (const slug of slugs) {
    const rank = PRIMARY_PRIORITY[slug];
    if (rank != null && rank < bestRank) {
      best = slug;
      bestRank = rank;
    }
  }
  return best;
}

function seedCategorySlugs(categories: WcCategory[]): string[] {
  return categories
    .map((c) => c.slug)
    .filter((slug) => !SKIP_CATEGORY_SLUGS.has(slug) && slug in PRIMARY_PRIORITY);
}

async function fetchCategoryProducts(categoryId: number): Promise<WcProduct[]> {
  const all: WcProduct[] = [];
  let page = 1;
  while (true) {
    const url = `${BASE}?category=${categoryId}&per_page=100&page=${page}&_fields=id,name,slug,permalink,categories`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for category ${categoryId} page ${page}`);
    const batch = (await res.json()) as WcProduct[];
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    const totalPages = Number(res.headers.get("x-wp-totalpages") ?? "1");
    if (page >= totalPages) break;
    page += 1;
    await new Promise((r) => setTimeout(r, 300));
  }
  return all;
}

async function main() {
  const byId = new Map<number, SgCatalogStrain>();

  for (const cat of SEED_CATEGORIES) {
    console.log(`Fetching ${cat.label} (${cat.id})…`);
    const products = await fetchCategoryProducts(cat.id);
    for (const p of products) {
      const seedSlugs = seedCategorySlugs(p.categories);
      if (seedSlugs.length === 0) continue;
      const cats = p.categories
        .filter((c) => seedSlugs.includes(c.slug))
        .map((c) => ({ slug: c.slug, label: c.name }));
      const primary = primaryCategory(seedSlugs);
      const row: SgCatalogStrain = {
        id: p.id,
        name: p.name.trim(),
        slug: p.slug,
        sourceUrl: p.permalink,
        categories: cats,
        primaryCategory: primary,
      };
      const existing = byId.get(p.id);
      if (!existing) {
        byId.set(p.id, row);
      } else {
        const mergedSlugs = new Set([
          ...existing.categories.map((c) => c.slug),
          ...cats.map((c) => c.slug),
        ]);
        const mergedCats = [...mergedSlugs].map((slug) => {
          const hit = cats.find((c) => c.slug === slug) ?? existing.categories.find((c) => c.slug === slug);
          return { slug, label: hit?.label ?? slug };
        });
        byId.set(p.id, {
          ...existing,
          categories: mergedCats,
          primaryCategory: primaryCategory([...mergedSlugs]),
        });
      }
    }
  }

  const strains = [...byId.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "en", { sensitivity: "base" })
  );

  const byCategory: Record<string, SgCatalogStrain[]> = {};
  for (const slug of Object.keys(PRIMARY_PRIORITY).sort(
    (a, b) => PRIMARY_PRIORITY[a]! - PRIMARY_PRIORITY[b]!
  )) {
    byCategory[slug] = strains
      .filter((s) => s.primaryCategory === slug)
      .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  }

  const out: SgCatalogFile = {
    fetchedAt: new Date().toISOString(),
    source: "https://seedsgenetics.com/",
    strains,
    byCategory,
  };

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`, "utf8");

  console.log(`Wrote ${strains.length} strains → ${OUT}`);
  for (const [slug, rows] of Object.entries(byCategory)) {
    if (rows.length > 0) console.log(`  ${slug}: ${rows.length}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
