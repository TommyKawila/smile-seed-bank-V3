import { z } from "zod";
import {
  EditorialError,
  EDITORIAL_PATCHABLE_STATUSES,
  EDITORIAL_SOURCE_TYPES,
  EDITORIAL_CONFIDENCE,
} from "@/lib/editorial-types";

export const editorialJobIdSchema = z.string().uuid();

const nonemptyTrimmed = (max: number) =>
  z.string().trim().min(1).max(max);

const optionalTrimmed = (max: number) =>
  z.union([z.string().trim().max(max), z.null()]);

export const editorialCreateJobSchema = z
  .object({
    topic: nonemptyTrimmed(500),
    source_prompt: z.string().trim().max(20000).optional(),
  })
  .strict();

export const tiptapDocSchema = z
  .object({
    type: z.literal("doc"),
    content: z.array(z.unknown()),
  })
  .passthrough();

const stringArraySchema = z.array(z.string().trim().min(1).max(80)).max(50);

const httpUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((u) => /^https?:\/\//i.test(u), "URL must be http or https");

export const editorialSourceSchema = z
  .object({
    id: z.string().trim().min(1).max(64).optional(),
    title: z.string().trim().max(300).optional(),
    url: z.union([httpUrlSchema, z.literal(""), z.null()]).optional(),
    publisher: z.string().trim().max(200).optional(),
    source_type: z.enum(EDITORIAL_SOURCE_TYPES).optional(),
    published_at: z.string().trim().max(64).optional(),
    notes: z.string().trim().max(2000).optional(),
    confidence: z.enum(EDITORIAL_CONFIDENCE).optional(),
  })
  .passthrough();

export const editorialImagePlanItemSchema = z
  .object({
    type: z.string().trim().min(1).max(64),
    prompt: z.string().trim().max(4000).optional(),
    aspect_ratio: z.string().trim().max(32).optional(),
    alt: z.string().trim().max(300).optional(),
    caption: z.string().trim().max(500).optional(),
  })
  .passthrough();

export const editorialImageAssetSchema = z
  .object({
    type: z.string().trim().min(1).max(64),
    url: httpUrlSchema,
    alt: z.string().trim().max(300).optional(),
    caption: z.string().trim().max(500).optional(),
  })
  .passthrough();

const categoryIdSchema = z.union([
  z.null(),
  z.coerce.number().int().positive(),
]);

export const editorialPatchJobSchema = z
  .object({
    title: optionalTrimmed(300).optional(),
    slug: optionalTrimmed(180).optional(),
    excerpt: optionalTrimmed(4000).optional(),
    content: z.union([tiptapDocSchema, z.null()]).optional(),
    title_en: optionalTrimmed(300).optional(),
    excerpt_en: optionalTrimmed(4000).optional(),
    content_en: z.union([tiptapDocSchema, z.null()]).optional(),
    seo_title: optionalTrimmed(120).optional(),
    seo_description: optionalTrimmed(320).optional(),
    seo_keywords: stringArraySchema.optional(),
    category_id: categoryIdSchema.optional(),
    tags: stringArraySchema.optional(),
    research_summary: optionalTrimmed(20000).optional(),
    sources: z.union([z.array(editorialSourceSchema).max(50), z.null()]).optional(),
    image_plan: z
      .union([z.array(editorialImagePlanItemSchema).max(20), z.null()])
      .optional(),
    featured_image: z.union([httpUrlSchema, z.literal(""), z.null()]).optional(),
    image_assets: z
      .union([z.array(editorialImageAssetSchema).max(20), z.null()])
      .optional(),
    review_notes: optionalTrimmed(10000).optional(),
    status: z.enum(EDITORIAL_PATCHABLE_STATUSES).optional(),
    source_prompt: optionalTrimmed(20000).optional(),
  })
  .strict();

export const editorialAssetsCompleteSchema = z
  .object({
    featured_image: z.union([httpUrlSchema, z.literal(""), z.null()]).optional(),
    image_assets: z.array(editorialImageAssetSchema).max(20).optional(),
  })
  .strict();

export type EditorialCreateJobInput = z.infer<typeof editorialCreateJobSchema>;
export type EditorialPatchJobInput = z.infer<typeof editorialPatchJobSchema>;
export type EditorialAssetsCompleteInput = z.infer<
  typeof editorialAssetsCompleteSchema
>;

export function parseEditorialJobId(id: string): string {
  const parsed = editorialJobIdSchema.safeParse(id);
  if (!parsed.success) {
    throw new EditorialError(400, "Invalid job id");
  }
  return parsed.data;
}

export function parseEditorialBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input";
    throw new EditorialError(400, message);
  }
  return parsed.data;
}
