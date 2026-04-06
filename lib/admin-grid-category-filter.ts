/**
 * Manual Inventory grid category filter — strict `products.flowering_type` for flowering buckets
 * (aligned with storefront `catalogFloweringBucket` / DB snake_case values).
 *
 * DB column `products.flowering_type` is free-form; canonical saves use `photoperiod` | `photo` | `autoflower` | `photo_ff` | `photo_3n`.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FLOWERING_DB_PHOTO_3N, FLOWERING_DB_PHOTO_PLAIN } from "@/lib/constants";

const PHOTO_SYNONYMS = FLOWERING_DB_PHOTO_PLAIN;

/** Sentinel from manual grid dropdown (same as FLOWERING_DB_PHOTO_3N). */
export function parseAdminCategoryFloweringSlug(raw: string): typeof FLOWERING_DB_PHOTO_3N | null {
  const t = raw.trim().toLowerCase().replace(/-/g, "_");
  if (t === FLOWERING_DB_PHOTO_3N) return FLOWERING_DB_PHOTO_3N;
  return null;
}

/**
 * "Photo" bucket: canonical `photoperiod` | `photo`, plus legacy rows (null FT or free-form weeks on Photo FK).
 * Always excludes `photo_3n` and `photo_ff` (strict).
 */
export function wherePhotoCategoryStrict(categoryId: bigint): Prisma.productsWhereInput {
  /** PG: `NOT IN` excludes NULL; keep explicit `OR flowering_type IS NULL` for second AND. */
  const exclude3nFf: Prisma.productsWhereInput = {
    OR: [
      { flowering_type: { notIn: [FLOWERING_DB_PHOTO_3N, "photo_ff"] } },
      { flowering_type: null },
    ],
  };

  return {
    AND: [
      {
        OR: [
          { flowering_type: { in: [...PHOTO_SYNONYMS] } },
          {
            AND: [{ category_id: categoryId }, { flowering_type: null }],
          },
          {
            AND: [
              { category_id: categoryId },
              { flowering_type: { notIn: [FLOWERING_DB_PHOTO_3N, "photo_ff", "autoflower"] } },
              { NOT: { flowering_type: { in: [...PHOTO_SYNONYMS] } } },
            ],
          },
        ],
      },
      exclude3nFf,
    ],
  };
}

/**
 * Map `product_categories.name` to a Prisma where clause, or null → FK-only filter.
 * Order: Photo 3N before generic Photo; Photo FF before plain Photo substring rules.
 */
/** Autoflower bucket: match canonical FT (any casing) or rows only linked by category FK when FT not set. */
export function whereAutoflowerCategory(categoryId: bigint): Prisma.productsWhereInput {
  return {
    OR: [
      { flowering_type: { equals: "autoflower", mode: "insensitive" } },
      {
        AND: [{ category_id: categoryId }, { flowering_type: null }],
      },
    ],
  };
}

export function categoryNameToWhereInput(
  name: string,
  categoryId: bigint
): Prisma.productsWhereInput | null {
  const n = name.trim().toLowerCase().replace(/\s+/g, " ");
  if (n === "photo 3n") return { flowering_type: FLOWERING_DB_PHOTO_3N };
  if (n === "photo ff" || n === "photo_ff") return { flowering_type: "photo_ff" };
  if (n.includes("photo") && (n.includes("ff") || n.includes("fast"))) return { flowering_type: "photo_ff" };
  if (n === "photo" || n === "photoperiod") return wherePhotoCategoryStrict(categoryId);
  if (
    n === "auto" ||
    n === "autoflower" ||
    (n.includes("autoflower") && !n.includes("photo"))
  ) {
    return whereAutoflowerCategory(categoryId);
  }
  return null;
}

/** @deprecated use categoryNameToWhereInput — kept for callers that only need a single FT string */
export function categoryNameToStrictFloweringType(name: string): string | null {
  const n = name.trim().toLowerCase().replace(/\s+/g, " ");
  if (n === "photo 3n") return FLOWERING_DB_PHOTO_3N;
  if (n === "photo ff" || n === "photo_ff" || (n.includes("photo") && (n.includes("ff") || n.includes("fast"))))
    return "photo_ff";
  if (n === "photo" || n === "photoperiod") return "photoperiod";
  if (n === "auto" || n === "autoflower") return "autoflower";
  return null;
}

export async function adminGridCategoryWhereInput(
  categoryIdRaw: string
): Promise<Prisma.productsWhereInput | null> {
  const categoryId = categoryIdRaw.trim();
  if (!categoryId) return null;

  const slugFt = parseAdminCategoryFloweringSlug(categoryId);
  if (slugFt) return { flowering_type: slugFt };

  if (!/^\d+$/.test(categoryId)) return null;

  const bid = BigInt(categoryId);
  const row = await prisma.product_categories.findUnique({
    where: { id: bid },
    select: { name: true },
  });
  const where = categoryNameToWhereInput(row?.name ?? "", bid);
  if (where) return where;
  return { category_id: bid };
}
