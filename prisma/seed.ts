// prisma/seed.ts — product defaults + Digital Magazine mock data
import "./load-env";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedMagazine } from "./seed-magazine";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const cats = await prisma.product_categories.findMany({ orderBy: { sort_order: 'asc' } });
  if (cats.length === 0) {
    await prisma.product_categories.createMany({
      data: [
        { name: 'Photo', sort_order: 1 },
        { name: 'Auto', sort_order: 2 },
        { name: 'Auto Original Line', sort_order: 3 },
        { name: 'CBD', sort_order: 4 },
        { name: 'Photo 3N', sort_order: 5 },
      ],
    });
    console.log('✅ สร้าง product_categories เรียบร้อย');
  }

  const catList = await prisma.product_categories.findMany();
  if (!catList.some((c: { name: string }) => c.name === 'Photo 3N')) {
    await prisma.product_categories.create({ data: { name: 'Photo 3N', sort_order: 5 } });
    console.log('✅ เพิ่ม product category Photo 3N');
  }
  const photoId = catList.find((c: { name: string }) => c.name === 'Photo' || c.name.includes('Photo'))?.id ?? null;
  const autoId = catList.find((c: { name: string }) => c.name === 'Auto' && !c.name.includes('Original'))?.id ?? null;

  const fastbudsData = [
    {
      master_sku: 'FB-RBMELON-FF',
      name: 'RainbowMelon (FEM) 2025',
      category: 'Photo (FF)',
      category_id: photoId,
      thc_percent: 25.0,
      seed_type: 'Feminized',
      flowering_type: '7-8 Weeks',
      genetics: 'Sweet, Fruity',
    },
    {
      master_sku: 'FB-ZUP-AUTO',
      name: 'Z-Up 2025',
      category: 'Auto',
      category_id: autoId,
      thc_percent: 23.0,
      seed_type: 'Autoflower',
      flowering_type: '9-10 Weeks',
      genetics: 'Zesty, Citrus',
    },
  ];

  for (const item of fastbudsData) {
    const existing = await prisma.products.findFirst({ where: { master_sku: item.master_sku } });
    if (existing) {
      await prisma.products.update({
        where: { id: existing.id },
        data: { category_id: item.category_id },
      });
    } else {
      await prisma.products.create({
        data: {
          master_sku: item.master_sku,
          name: item.name,
          category: item.category,
          category_id: item.category_id,
          thc_percent: item.thc_percent,
          seed_type: item.seed_type,
          flowering_type: item.flowering_type,
          genetics: item.genetics,
          is_active: true,
          stock: 50,
        },
      });
    }
    console.log(`✅ นำเข้า: ${item.name}`);
  }

  console.log("🌿 Running magazine seed…");
  await seedMagazine();
  const { prisma: prismaLib } = await import("@/lib/prisma");
  await prismaLib.$disconnect();

  await prisma.$disconnect();
  await pool.end();
  console.log("✨ เสร็จสิ้น!");
}

main().catch((e) => {
  console.error('❌ พังเพราะ:', e);
  process.exit(1);
});