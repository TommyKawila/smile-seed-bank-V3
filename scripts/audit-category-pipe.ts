/**
 * Data Pipe Audit: Category field in Manual Grid
 * Run: npx tsx scripts/audit-category-pipe.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function audit() {
  console.log("=== 1. DATABASE LAYER (Prisma) ===\n");

  const categories = await prisma.product_categories.findMany({ orderBy: { sort_order: "asc" } });
  console.log("product_categories table:", categories.map((c) => ({ id: String(c.id), name: c.name })));

  const sampleProducts = await prisma.products.findMany({
    take: 5,
    include: { product_categories: true },
  });

  console.log("\nSample products (raw Prisma):");
  for (const p of sampleProducts) {
    console.log({
      id: String(p.id),
      name: p.name,
      "category (legacy)": p.category,
      "category_id": p.category_id != null ? String(p.category_id) : "NULL",
      "product_categories": p.product_categories
        ? { id: String(p.product_categories.id), name: p.product_categories.name }
        : "null",
    });
  }

  const nullCategoryCount = await prisma.products.count({ where: { category_id: null } });
  const withCategoryCount = await prisma.products.count({ where: { category_id: { not: null } } });
  console.log(`\nProducts with category_id NULL: ${nullCategoryCount}`);
  console.log(`Products with category_id set: ${withCategoryCount}`);

  console.log("\n=== 2. API LAYER (simulated grid response) ===\n");

  const breeder = await prisma.breeders.findFirst();
  if (!breeder) {
    console.log("No breeders found. Skipping API simulation.");
    return;
  }

  const products = await prisma.products.findMany({
    where: { breeder_id: breeder.id },
    include: {
      product_variants: { where: { is_active: true } },
      product_categories: true,
    },
    orderBy: { name: "asc" },
    take: 3,
  });

  const rows = products.map((p) => ({
    productId: Number(p.id),
    masterSku: p.master_sku ?? "",
    name: p.name,
    category: p.product_categories?.name ?? "",
    categoryId: p.category_id != null ? String(p.category_id) : undefined,
  }));

  console.log("Grid API payload (rows only):");
  console.log(JSON.stringify(rows, null, 2));

  console.log("\n=== 3. FRONTEND MAPPING ===\n");
  console.log("ManualInventoryPage expects: row.category (string)");
  console.log("Display: {row.category || '—'}");
  console.log("When category is '', shows '—'");
}

audit()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
