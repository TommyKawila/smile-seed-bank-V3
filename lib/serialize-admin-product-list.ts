import type { Prisma } from "@prisma/client";
import type { Json } from "@/types/database.types";

const listInclude = {
  breeders: { select: { id: true, name: true, logo_url: true } },
  product_categories: { select: { id: true, name: true } },
  product_variants: { orderBy: { id: "asc" as const } },
  product_images: { orderBy: { sort_order: "asc" as const } },
} satisfies Prisma.productsInclude;

export type AdminProductListPayload = Prisma.productsGetPayload<{
  include: typeof listInclude;
}>;

export { listInclude as adminProductListInclude };

function dec(v: { toNumber: () => number } | null | undefined): number | null {
  return v == null ? null : v.toNumber();
}

export function serializeAdminProductForList(p: AdminProductListPayload) {
  return {
    id: Number(p.id),
    breeder_id: p.breeder_id != null ? Number(p.breeder_id) : null,
    name: p.name,
    slug: p.slug,
    category: p.category,
    description_th: p.description_th,
    description_en: p.description_en,
    price: dec(p.price),
    stock: p.stock,
    is_active: p.is_active ?? true,
    image_url: p.image_url,
    image_url_2: p.image_url_2,
    image_url_3: p.image_url_3,
    image_url_4: p.image_url_4,
    image_url_5: p.image_url_5,
    image_urls: p.image_urls as Json,
    video_url: p.video_url,
    thc_percent: dec(p.thc_percent),
    cbd_percent: p.cbd_percent,
    genetics: p.genetics,
    indica_ratio: dec(p.indica_ratio),
    sativa_ratio: dec(p.sativa_ratio),
    flowering_type: p.flowering_type,
    seed_type: p.seed_type,
    yield_info: p.yield_info,
    growing_difficulty: p.growing_difficulty,
    effects: p.effects as Json,
    flavors: p.flavors as Json,
    medical_benefits: p.medical_benefits as Json,
    created_at: p.created_at?.toISOString() ?? null,
    genetic_ratio: p.genetic_ratio,
    sativa_percent: p.sativa_percent,
    indica_percent: p.indica_percent,
    sex_type: p.sex_type,
    lineage: p.lineage,
    terpenes: p.terpenes as Json,
    master_sku: p.master_sku,
    category_id: p.category_id != null ? Number(p.category_id) : null,
    strain_dominance: p.strain_dominance,
    seo_meta: p.seo_meta as Json,
    is_featured: p.is_featured,
    featured_priority: p.featured_priority,
    featured_tagline: p.featured_tagline,
    breeders: p.breeders
      ? {
          id: Number(p.breeders.id),
          name: p.breeders.name,
          logo_url: p.breeders.logo_url,
        }
      : null,
    product_categories: p.product_categories
      ? {
          id: Number(p.product_categories.id),
          name: p.product_categories.name,
        }
      : null,
    product_variants: p.product_variants.map((v) => ({
      id: Number(v.id),
      product_id: v.product_id != null ? Number(v.product_id) : null,
      unit_label: v.unit_label,
      cost_price: dec(v.cost_price),
      price: dec(v.price) ?? 0,
      stock: v.stock,
      low_stock_threshold: v.low_stock_threshold,
      is_active: v.is_active ?? true,
      sku: v.sku,
      created_at: v.created_at?.toISOString() ?? null,
    })),
    product_images: p.product_images.map((img) => ({
      id: Number(img.id),
      url: img.url,
      variant_id: img.variant_id != null ? Number(img.variant_id) : null,
      is_main: img.is_main,
      sort_order: img.sort_order,
    })),
  };
}
