import { config } from "dotenv";
import { resolve } from "node:path";
import { prisma } from "@/lib/prisma";
import { packBucketsFromVariants } from "@/lib/shop-attribute-filters";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const rows = await prisma.products.findMany({
    select: {
      id: true,
      product_variants: {
        where: { is_active: true },
        select: { unit_label: true, is_active: true },
      },
    },
  });

  let updated = 0;
  for (const row of rows) {
    const buckets = packBucketsFromVariants(row.product_variants);
    await prisma.$executeRaw`
      UPDATE products SET pack_buckets = ${buckets}::text[] WHERE id = ${row.id}
    `;
    if (buckets.length > 0) updated += 1;
  }

  console.log(`[backfill-product-pack-buckets] products=${rows.length} with_buckets=${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
