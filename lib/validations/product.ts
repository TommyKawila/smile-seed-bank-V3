// Shared Zod schemas — NO "use client" directive
// Safe to import from both Server (API routes) and Client (hooks/components)

import { z } from "zod";

export const VariantSchema = z.object({
  unit_label: z.string().min(1, "กรุณาระบุขนาดแพ็กเกจ (เช่น 1 Seed)"),
  price: z.number().positive("ราคาต้องมากกว่า 0"),
  cost_price: z.number().min(0, "ต้นทุนต้องไม่ติดลบ"),
  stock: z.number().int().min(0, "สต็อกต้องไม่ติดลบ"),
  low_stock_threshold: z.number().int().min(0).default(5).optional(),
  is_active: z.boolean().default(true),
  sku: z.string().nullable().optional(),
});

export const ProductSchema = z.object({
  name: z.string().min(2, "ชื่อสินค้าต้องมีอย่างน้อย 2 ตัวอักษร"),
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
  video_url: z.string().url().nullable().optional(),
  is_active: z.boolean().default(true),
  // AI Specs — optional
  thc_percent: z.number().min(0).max(100).nullable().optional(),
  cbd_percent: z.number().min(0).max(100).nullable().optional(),
  genetics: z.string().nullable().optional(),
  indica_ratio: z.number().min(0).max(100).nullable().optional(),
  sativa_ratio: z.number().min(0).max(100).nullable().optional(),
  strain_dominance: z.enum(["Mostly Indica", "Mostly Sativa", "Hybrid 50/50"]).nullable().optional(),
  flowering_type: z.enum(["autoflower", "photoperiod"]).nullable().optional(),
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
  variants: z.array(VariantSchema).min(1, "ต้องมีอย่างน้อย 1 แพ็กเกจ"),
});

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
