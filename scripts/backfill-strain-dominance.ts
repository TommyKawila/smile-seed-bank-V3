import { config } from "dotenv";
import { resolve } from "node:path";
import { prisma } from "@/lib/prisma";
import {
  classifyGeneticsSlugFromProduct,
  GENETICS_SLUG_TO_DB,
} from "@/lib/shop-attribute-filters";

config({ path: resolve(process.cwd(), ".env.local") });

const SLUG_TO_DOMINANCE: Record<string, string> = {
  "sativa-dom": GENETICS_SLUG_TO_DB["sativa-dom"],
  "indica-dom": GENETICS_SLUG_TO_DB["indica-dom"],
  hybrid: GENETICS_SLUG_TO_DB.hybrid,
};

async function main() {
  const rows = await prisma.products.findMany({
    where: {
      OR: [{ strain_dominance: null }, { strain_dominance: "" }],
    },
    select: {
      id: true,
      strain_dominance: true,
      sativa_ratio: true,
      indica_ratio: true,
      genetic_ratio: true,
      genetics: true,
    },
  });

  let updated = 0;
  for (const row of rows) {
    const slug = classifyGeneticsSlugFromProduct({
      strain_dominance: row.strain_dominance,
      sativa_ratio: row.sativa_ratio,
      indica_ratio: row.indica_ratio,
      genetic_ratio: row.genetic_ratio,
      genetics: row.genetics,
    });
    if (!slug) continue;
    const dominance = SLUG_TO_DOMINANCE[slug];
    if (!dominance) continue;
    await prisma.products.update({
      where: { id: row.id },
      data: { strain_dominance: dominance },
    });
    updated += 1;
  }

  console.log(`[backfill-strain-dominance] scanned=${rows.length} updated=${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
