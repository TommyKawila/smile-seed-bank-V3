// Shared Zod schemas — NO "use client" directive
// Safe to import from both Server (API routes) and Client (hooks/components)

import { z } from "zod";

export const GalleryEntrySchema = z.object({
  url: z.string().url(),
  is_main: z.boolean(),
  variant_unit_label: z.string().nullable().optional(),
});

export const VariantSchema = z.object({
  unit_label: z.string().min(1, "กรุณาระบุขนาดแพ็กเกจ (เช่น 1 Seed)"),
  /** Draft / pre-pricing: 0 allowed */
  price: z.number().min(0, "ราคาต้องไม่ติดลบ"),
  cost_price: z.number().min(0, "ต้นทุนต้องไม่ติดลบ"),
  stock: z.number().int().min(0, "สต็อกต้องไม่ติดลบ"),
  low_stock_threshold: z.number().int().min(0).default(5).optional(),
  is_active: z.boolean().default(true),
  sku: z.string().nullable().optional(),
});

/** Drop UI placeholder rows (empty pack label) before validation. */
function normalizeVariantsInput(val: unknown): unknown {
  if (!Array.isArray(val)) return [];
  return val.filter(
    (v) =>
      typeof v === "object" &&
      v !== null &&
      String((v as { unit_label?: string }).unit_label ?? "").trim().length > 0
  );
}

const VariantsFieldSchema = z.preprocess(
  normalizeVariantsInput,
  z.array(VariantSchema).default([])
);

export const ProductSchema = z.object({
  name: z.string().min(2, "ชื่อสินค้าต้องมีอย่างน้อย 2 ตัวอักษร"),
  /** SEO path segment — server normalizes / fills from name if omitted */
  slug: z.string().max(180).optional().nullable(),
  category: z.string().nullable().optional(),
  category_id: z.number().nullable().optional(),
  breeder_id: z.number().nullable().optional(),
  master_sku: z.string().nullable().optional(),
  description_th: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
  image_url: z.string().url("URL รูปภาพไม่ถูกต้อง").nullable().optional(),
  image_url_2: z.string().url().nullable().optional(),
  image_url_3: z.string().url().nullable().optional(),
  image_url_4: z.string().url().nullable().optional(),
  image_url_5: z.string().url().nullable().optional(),
  image_urls: z.array(z.string().url()).max(5).nullable().optional(),
  /** Admin: per-image main + variant binding; persisted to `product_images` */
  gallery_entries: z.array(GalleryEntrySchema).max(5).optional(),
  video_url: z.string().url().nullable().optional(),
  is_active: z.boolean().default(true),
  // AI Specs — optional
  thc_percent: z.number().min(0).max(100).nullable().optional(),
  cbd_percent: z.preprocess(
    (v) => {
      if (v === undefined) return undefined;
      if (v === null || v === "") return null;
      const s = String(v).trim().slice(0, 64);
      return s === "" ? null : s;
    },
    z.union([z.string().max(64), z.null()]).optional()
  ),
  genetics: z.string().nullable().optional(),
  indica_ratio: z.number().min(0).max(100).nullable().optional(),
  sativa_ratio: z.number().min(0).max(100).nullable().optional(),
  sativa_percent: z.number().int().min(0).max(100).nullable().optional(),
  indica_percent: z.number().int().min(0).max(100).nullable().optional(),
  strain_dominance: z.enum(["Mostly Indica", "Mostly Sativa", "Hybrid 50/50"]).nullable().optional(),
  flowering_type: z.enum(["autoflower", "photoperiod", "photo_ff", "photo_3n"]).nullable().optional(),
  seed_type: z.enum(["FEMINIZED", "REGULAR"]).nullable().optional(),
  yield_info: z.string().nullable().optional(),
  growing_difficulty: z.string().nullable().optional(),
  effects: z.unknown().nullable().optional(),
  flavors: z.unknown().nullable().optional(),
  medical_benefits: z.unknown().nullable().optional(),
  // Extended Specs
  genetic_ratio: z.string().nullable().optional(),
  sex_type: z.enum(["feminized", "regular"]).nullable().optional(),
  lineage: z.string().nullable().optional(),
  terpenes: z.unknown().nullable().optional(),
  /** May be empty for metadata-only draft; placeholder rows stripped by preprocess */
  variants: VariantsFieldSchema,
});

/** Storefront visibility: no packages or zero total stock → not listed as available */
export function deriveProductIsActiveForCatalog(
  variants: { stock?: number | null }[],
  formIsActive: boolean | null | undefined
): boolean {
  if (!variants.length) return false;
  const sum = variants.reduce(
    (s, v) => s + Math.max(0, Number(v.stock ?? 0)),
    0
  );
  if (sum === 0) return false;
  return formIsActive !== false;
}

export type ProductFormData = z.infer<typeof ProductSchema>;

// Returns the field names that still contain "Unknown" so the UI can warn the user before saving
export function unknownFields(data: Partial<ProductFormData>): string[] {
  const STRING_FIELDS: (keyof ProductFormData)[] = [
    "name", "genetics", "lineage", "genetic_ratio", "sex_type",
    "yield_info", "growing_difficulty", "description_en", "description_th",
  ];
  const ARRAY_FIELDS: (keyof ProductFormData)[] = [
    "terpenes", "effects", "flavors", "medical_benefits",
  ];

  const bad: string[] = [];
  for (const f of STRING_FIELDS) {
    if (data[f] === "Unknown") bad.push(f);
  }
  for (const f of ARRAY_FIELDS) {
    const v = data[f];
    if (Array.isArray(v) && v.some((x) => x === "Unknown")) bad.push(f);
  }
  return bad;
}
