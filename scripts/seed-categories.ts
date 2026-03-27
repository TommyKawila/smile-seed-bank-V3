import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const data = [
    { name: "Photo", sort_order: 1 },
    { name: "Auto", sort_order: 2 },
    { name: "Auto Original Line", sort_order: 3 },
    { name: "CBD", sort_order: 4 },
  ];
  const existing = await prisma.product_categories.count();
  if (existing > 0) {
    console.log("product_categories already has", existing, "rows. Skipping.");
    const all = await prisma.product_categories.findMany({ orderBy: { sort_order: "asc" } });
    console.log(all);
    return;
  }
  await prisma.product_categories.createMany({ data });
  console.log("Created 4 categories:", data.map((d) => d.name).join(", "));
  const all = await prisma.product_categories.findMany({ orderBy: { sort_order: "asc" } });
  console.log(all);
}

main()
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
