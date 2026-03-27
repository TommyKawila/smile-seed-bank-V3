// Zod schemas for AI Importer pipeline — server-only validation after Claude + before DB

import { z } from "zod";

/** Coerce AI / sheet strings into a finite number or null (matches Prisma Decimal fields as numbers in Supabase layer). */
function nullableRatio(min: number, max: number) {
  return z.preprocess((v: unknown) => {
    if (v === null || v === undefined || v === "") return null;
    const x =
      typeof v === "number" && Number.isFinite(v)
        ? v
        : parseFloat(String(v).replace(/%/g, "").trim());
    if (!Number.isFinite(x)) return null;
    return Math.min(max, Math.max(min, x));
  }, z.union([z.null(), z.number().min(min).max(max)]));
}

const terpenesPreprocess = z.preprocess((v) => {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return [];
    try {
      const j = JSON.parse(t);
      if (Array.isArray(j)) return j.map((x) => String(x).trim()).filter(Boolean);
    } catch {
      /* fall through */
    }
    return t.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}, z.array(z.string()));

/** Up to 5 unique https image URLs; first = hero. */
const imagesPreprocess = z.preprocess((v: unknown) => {
  if (v == null) return [];
  const raw = Array.isArray(v) ? v : [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const s = String(item).trim();
    if (!s.startsWith("http")) continue;
    try {
      const href = new URL(s).href;
      if (seen.has(href)) continue;
      seen.add(href);
      out.push(href);
    } catch {
      /* skip */
    }
    if (out.length >= 5) break;
  }
  return out;
}, z.array(z.string()).max(5));

const seoLocaleSchema = z.object({
  title: z.string().max(60).nullable().optional(),
  description: z.string().max(160).nullable().optional(),
});

const seoSchema = z
  .object({
    th: seoLocaleSchema.optional(),
    en: seoLocaleSchema.optional(),
  })
  .nullable()
  .optional();

/**
 * Raw JSON from Claude — must match keys below. Transformed to add image_url / additional_images for downstream code.
 */
export const AiImporterExtractedSchema = z
  .object({
    name: z.string().min(1).optional(),
    thc_percent: nullableRatio(0, 100),
    indica_ratio: nullableRatio(0, 100),
    sativa_ratio: nullableRatio(0, 100),
    genetic_ratio: z.string().nullable().optional(),
    terpenes: terpenesPreprocess.optional().default([]),
    description_th: z.string().nullable().optional(),
    /** Up to 5 unique absolute https URLs; index 0 = best hero shot. */
    images: imagesPreprocess.optional().default([]),
    seo: seoSchema,
  })
  .transform((data) => {
    const urls = Array.from(new Set(data.images)).slice(0, 5);
    return {
      ...data,
      images: urls,
      image_url: urls[0],
      additional_images: urls.slice(1),
    };
  });

export type AiImporterExtracted = z.infer<typeof AiImporterExtractedSchema>;

/** Single Google Sheet row sent to POST /api/admin/import/ai */
export const AiImportRowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  breeder: z.string().min(1, "Breeder is required"),
  url: z.string().url("Valid URL is required"),
  price: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().min(0),
  dryRun: z.boolean().optional().default(false),
});

export type AiImportRowInput = z.infer<typeof AiImportRowSchema>;
