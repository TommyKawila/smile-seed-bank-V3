import type { Prisma, PrismaClient } from "@prisma/client";
import {
  CATEGORY_NAME_PLAIN_PHOTO,
  FLOWERING_DB_PHOTO_3N,
  FLOWERING_DB_PHOTO_PLAIN,
} from "@/lib/constants";

export function adminProductsOrderBy(
  featured: boolean
): Prisma.productsOrderByWithRelationInput[] {
  if (featured) {
    return [{ featured_priority: "asc" }, { id: "desc" }];
  }
  return [{ id: "desc" }];
}

export async function buildAdminProductsWhere(
  prisma: PrismaClient,
  sp: URLSearchParams
): Promise<Prisma.productsWhereInput> {
  const where: Prisma.productsWhereInput = {};

  const featured = sp.get("featured") === "1" || sp.get("view") === "featured";
  if (featured) where.is_featured = true;

  const breeder = sp.get("breeder");
  if (breeder && /^\d+$/.test(breeder)) {
    where.breeder_id = BigInt(breeder);
  }

  const dom = sp.get("dominance");
  if (dom && dom !== "all") {
    where.strain_dominance = dom;
  }

  const category = sp.get("category");
  if (category && category !== "all") {
    if (category === FLOWERING_DB_PHOTO_3N) {
      where.flowering_type = FLOWERING_DB_PHOTO_3N;
    } else if (/^\d+$/.test(category)) {
      const bid = BigInt(category);
      const row = await prisma.product_categories.findUnique({
        where: { id: bid },
        select: { name: true },
      });
      const n = row?.name.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
      if ((CATEGORY_NAME_PLAIN_PHOTO as readonly string[]).includes(n)) {
        where.OR = [
          { flowering_type: { in: [...FLOWERING_DB_PHOTO_PLAIN] } },
          { AND: [{ flowering_type: null }, { category_id: bid }] },
        ];
      } else {
        where.category_id = bid;
      }
    }
  }

  const q = sp.get("q")?.trim();
  if (q) {
    where.name = { contains: q, mode: "insensitive" };
  }

  const isActiveParam = sp.get("isActive") ?? "all";
  if (isActiveParam === "true") {
    where.is_active = true;
  } else if (isActiveParam === "false") {
    where.is_active = false;
  }

  const stockStatus = sp.get("stockStatus") ?? "all";
  if (stockStatus === "inStock") {
    where.stock = { gt: 0 };
  } else if (stockStatus === "outOfStock") {
    where.stock = 0;
  }

  const hasImage = sp.get("hasImage") ?? "all";
  if (hasImage === "true") {
    return {
      AND: [
        where,
        { image_url: { not: null } },
        { image_url: { not: "" } },
      ],
    };
  }
  if (hasImage === "false") {
    return {
      AND: [where, { OR: [{ image_url: null }, { image_url: "" }] }],
    };
  }

  return where;
}
