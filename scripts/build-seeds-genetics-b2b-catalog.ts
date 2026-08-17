/**
 * Rebuild SG catalog from B2B EN 2026 PDF + Photo FF hand stock labels.
 * Run: npx tsx scripts/build-seeds-genetics-b2b-catalog.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const OLD = path.join(process.cwd(), "data/partners/seeds-genetics/catalog.json");
const OUT = OLD;

type OldRow = {
  id: number;
  name: string;
  slug: string;
  sourceUrl: string;
  primaryCategory: string;
};

type CatalogStrain = {
  id: number;
  name: string;
  slug: string;
  sourceUrl: string;
  categories: { slug: string; label: string }[];
  primaryCategory: string;
  bulkPackQty?: number;
  fastFlowering?: boolean;
  listSource?: "b2b-2026" | "photo-ff-hand";
};

const CATEGORY_META: Record<string, { slug: string; label: string }> = {
  "feminized-seeds": { slug: "feminized-seeds", label: "Feminized seeds" },
  "cali-feminized": { slug: "cali-feminized", label: "Cali feminized" },
  "supreme-feminized": { slug: "supreme-feminized", label: "Supreme feminized" },
  "autoflower-seeds": { slug: "autoflower-seeds", label: "Autoflower seeds" },
  "cali-autoflower": { slug: "cali-autoflower", label: "Cali autoflower" },
  "supreme-autoflower": { slug: "supreme-autoflower", label: "Supreme autoflower" },
  "cbd-seeds": { slug: "cbd-seeds", label: "CBD seeds" },
  "photo-ff": { slug: "photo-ff", label: "Photo FF" },
};

const B2B: { category: keyof typeof CATEGORY_META; names: string[] }[] = [
  {
    category: "feminized-seeds",
    names: [
      "AK 420",
      "Amnesia Haze",
      "Big Bud",
      "Blueberry",
      "Bubbles",
      "Cheese",
      "Critical 2.0",
      "Jack Herer",
      "Northern Light",
      "O.G. Kush",
      "Power Plant",
      "Purple Haze",
      "Purple Kush",
      "Royal Moby",
      "Sour Diesel",
      "Super Lemon Haze",
      "Super Silver Haze",
      "White Widow",
    ],
  },
  {
    category: "cali-feminized",
    names: [
      "24K Gold",
      "Apple Fritter",
      "Banana Sherbet",
      "Biscotti",
      "Blue Dream Cake",
      "Bruce Banner",
      "Cherry Punch",
      "Cookies",
      "Do Si Dos x Zkittlez",
      "Forbidden Fruit Cake",
      "Fritter Licker",
      "Gelato 41",
      "GMO",
      "Gorilla Glue",
      "Granddaddy Purple",
      "Jealouz",
      "Kreamz",
      "Mango Kush",
      "Mimosa Evo",
      "Oreoz",
      "Permanent Marker",
      "Pineapple Chunk",
      "Purple Punch",
      "Red Wine",
      "Runtz",
      "RS11",
      "Skywalker Kush",
      "Super Boof",
      "Tangie",
      "Watermelon Punch",
      "Wedding Cake",
      "Zkittlez",
      "Zoap",
      "Zupa Zips",
      "Zushi",
    ],
  },
  {
    category: "supreme-feminized",
    names: [
      "Black Maple",
      "Dank Schrader",
      "Frosted MAC",
      "Guavaz",
      "Honey Banana",
      "Slurricane",
    ],
  },
  {
    category: "autoflower-seeds",
    names: [
      "AK 420",
      "Amnesia Haze",
      "Big Bud",
      "Blueberry",
      "Bubbles",
      "Cheese",
      "Critical 2.0",
      "Jack Herer",
      "Northern Light",
      "O.G. Kush",
      "Purple Kush",
      "Sour Diesel Haze",
      "Super Lemon Haze",
      "White Widow",
      "XXL Boombastic",
    ],
  },
  {
    category: "cali-autoflower",
    names: [
      "Apple Fritter",
      "Blue Dream Cake",
      "Bruce Banner",
      "Cookies",
      "Gelato 41",
      "Gorilla Glue",
      "Mimosa Evo",
      "Purple Punch",
      "Runtz",
      "Sunset Sherbet",
      "Super Boof",
      "Wedding Cake",
      "Zkittlez",
    ],
  },
  {
    category: "supreme-autoflower",
    names: [
      "Fritter Glitter",
      "Grape Cream Cake",
      "Grape Smoothie",
      "Rainbow Jelly",
      "Strawberry Gelato",
      "Watermelon Z",
    ],
  },
  {
    category: "cbd-seeds",
    names: ["CBD Critical Autoflower", "CBD Critical feminized", "CBD Northern Light feminized"],
  },
];

const PHOTO_FF_BAGS = [
  "Apple Fritter",
  "Forbidden Fruit",
  "Cherry Pie",
  "GMO",
  "Poison",
  "Mimosa Evo",
  "Gorilla",
  "Runtz",
  "Green Crack",
  "Velvet Moon",
];

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function displayName(pdfName: string, category: string): string {
  if (category === "cbd-seeds") return pdfName;
  if (category === "autoflower-seeds" || category === "cali-autoflower" || category === "supreme-autoflower") {
    if (pdfName.endsWith(" Autoflower")) return pdfName;
    return `${pdfName} Autoflower`;
  }
  if (pdfName.endsWith(" feminized") || pdfName.endsWith(" Feminized")) return pdfName.replace(/Feminized$/i, "feminized");
  return `${pdfName} feminized`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function findWebMatch(
  pdfName: string,
  category: string,
  byNorm: Map<string, OldRow>
): OldRow | undefined {
  const display = displayName(pdfName, category);
  const key = norm(display);
  if (byNorm.has(key)) return byNorm.get(key);

  const altKeys = [
    key,
    norm(display.replace("Northern Light", "Northern Lights")),
    norm(display.replace("feminized", "Feminized")),
    norm(display.replace("GMO feminized", "GMO Feminized")),
    norm(display.replace("Red Wine feminized", "Red Wine Feminized")),
  ];
  for (const k of altKeys) {
    if (byNorm.has(k)) return byNorm.get(k);
  }

  if (category === "cali-feminized" || category === "feminized-seeds" || category === "supreme-feminized") {
    for (const [k, row] of byNorm) {
      if (row.primaryCategory !== category && row.primaryCategory !== "feminized-seeds" && category !== "cali-feminized") continue;
      if (k.startsWith(norm(pdfName)) && k.includes("feminized")) return row;
    }
  }
  if (category.includes("autoflower")) {
    for (const [k, row] of byNorm) {
      if (!row.primaryCategory.includes("autoflower")) continue;
      if (k.startsWith(norm(pdfName))) return row;
    }
  }
  return undefined;
}

let synthId = 900_000;

function rowFromB2b(pdfName: string, category: keyof typeof CATEGORY_META, byNorm: Map<string, OldRow>): CatalogStrain {
  const meta = CATEGORY_META[category]!;
  const name = displayName(pdfName, category);
  const hit = findWebMatch(pdfName, category, byNorm);
  const id = hit?.id ?? ++synthId;
  const slug = hit?.slug ?? slugify(name);
  const sourceUrl = hit?.sourceUrl ?? "";
  return {
    id,
    name,
    slug,
    sourceUrl,
    categories: [meta],
    primaryCategory: category,
    listSource: "b2b-2026",
  };
}

function rowFromPhotoFf(labelName: string): CatalogStrain {
  const meta = CATEGORY_META["photo-ff"]!;
  const name = labelName;
  return {
    id: ++synthId,
    name,
    slug: slugify(`photo-ff-${name}`),
    sourceUrl: "",
    categories: [meta],
    primaryCategory: "photo-ff",
    bulkPackQty: 1000,
    fastFlowering: true,
    listSource: "photo-ff-hand",
  };
}

function main() {
  const old = JSON.parse(readFileSync(OLD, "utf8")) as { strains: OldRow[] };
  const byNorm = new Map<string, OldRow>();
  for (const s of old.strains) {
    byNorm.set(norm(s.name), s);
  }

  const strains: CatalogStrain[] = [];
  const seen = new Set<string>();

  for (const block of B2B) {
    for (const pdfName of block.names) {
      const row = rowFromB2b(pdfName, block.category, byNorm);
      const dedupe = `${row.primaryCategory}|${norm(row.name)}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      strains.push(row);
    }
  }

  for (const label of PHOTO_FF_BAGS) {
    strains.push(rowFromPhotoFf(label));
  }

  strains.sort((a, b) => {
    const catOrder = Object.keys(CATEGORY_META);
    const ca = catOrder.indexOf(a.primaryCategory);
    const cb = catOrder.indexOf(b.primaryCategory);
    if (ca !== cb) return ca - cb;
    return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
  });

  const byCategory: Record<string, CatalogStrain[]> = {};
  for (const slug of Object.keys(CATEGORY_META)) {
    byCategory[slug] = strains.filter((s) => s.primaryCategory === slug);
  }

  const out = {
    fetchedAt: new Date().toISOString(),
    source: "B2B EN 2026 (Seeds Genetics) + Photo FF hand stock",
    sourceDocument: "B2B EN 2026.pdf",
    strains,
    byCategory,
  };

  writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(`Wrote ${strains.length} strains`);
  for (const [slug, rows] of Object.entries(byCategory)) {
    if (rows.length) console.log(`  ${slug}: ${rows.length}`);
  }
}

main();
