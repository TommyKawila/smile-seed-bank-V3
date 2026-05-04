import { prisma } from "@/lib/prisma";

const PHOTO_CATEGORY_ID = BigInt(1);
const CATEGORY_MAP: { pattern: RegExp; categoryName: string }[] = [
  { pattern: /auto\s+original\s+line/i, categoryName: "Auto Original Line" },
  { pattern: /^auto$/i, categoryName: "Auto" },
  { pattern: /photo/i, categoryName: "Photo" },
  { pattern: /cbd/i, categoryName: "CBD" },
  { pattern: /regular/i, categoryName: "Regular" },
  { pattern: /seeds/i, categoryName: "Photo" },
];

export async function migrateCategoryIds(): Promise<number> {
  const categories = await prisma.product_categories.findMany();
  const catByName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  const products = await prisma.products.findMany({
    where: { category_id: null },
    select: { id: true, category: true },
  });

  let updated = 0;
  for (const p of products) {
    const legacy = (p.category ?? "").trim();
    let categoryId: bigint | null = null;

    if (/^seeds$/i.test(legacy) || /photo\s*\(?\s*ff\s*\)?/i.test(legacy)) {
      categoryId = PHOTO_CATEGORY_ID;
    } else if (legacy) {
      for (const { pattern, categoryName } of CATEGORY_MAP) {
        if (pattern.test(legacy)) {
          categoryId = catByName.get(categoryName.toLowerCase()) ?? null;
          break;
        }
      }
    }

    if (categoryId) {
      await prisma.products.update({
        where: { id: p.id },
        data: { category_id: categoryId },
      });
      updated++;
    }
  }
  return updated;
}
