import { config } from "dotenv";
import { resolve } from "node:path";
import { prisma } from "@/lib/prisma";
import { parseCbdNumeric } from "@/lib/shop-attribute-filters";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const rows = await prisma.products.findMany({
    where: { cbd_percent: { not: null } },
    select: { id: true, cbd_percent: true },
  });

  let updated = 0;
  for (const row of rows) {
    const n = parseCbdNumeric(row.cbd_percent);
    if (n == null) continue;
    await prisma.$executeRaw`
      UPDATE products SET cbd_percent_num = ${n}::double precision WHERE id = ${row.id}
    `;
    updated += 1;
  }

  console.log(`[backfill-cbd-percent-num] scanned=${rows.length} updated=${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
