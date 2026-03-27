/**
 * Migrate products with null category_id to link to product_categories
 * Run: npx tsx scripts/migrate-category-id.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { migrateCategoryIds } from "../lib/migrate-category-id";
import { prisma } from "../lib/prisma";

async function main() {
  const updated = await migrateCategoryIds();
  console.log(`Migrated ${updated} products.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
