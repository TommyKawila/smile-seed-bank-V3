import { Prisma, type editorial_jobs } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/product-utils";
import { ensureUniqueBlogSlug } from "@/lib/blog-slug";
import { isTiptapDocEmpty } from "@/lib/magazine-bilingual";
import {
  EditorialError,
  EDITORIAL_STATUS,
} from "@/lib/editorial-types";
import type {
  EditorialAssetsCompleteInput,
  EditorialCreateJobInput,
  EditorialPatchJobInput,
} from "@/lib/editorial-schema";
import {
  canApproveJob,
  canCompleteAssets,
  canPublishJob,
  canStartAssets,
  nextRevisionAfterPatch,
  nextStatusAfterPatch,
  patchBlockedWhilePublishing,
} from "@/lib/editorial-rules";
import { buildBlogPostMappedFields } from "@/lib/editorial-publish-map";

export type EditorialJobJson = {
  id: string;
  topic: string;
  status: string;
  revision: number;
  approved_revision: number | null;
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  content: unknown;
  title_en: string | null;
  excerpt_en: string | null;
  content_en: unknown;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[];
  category_id: number | null;
  tags: string[];
  research_summary: string | null;
  sources: unknown;
  image_plan: unknown;
  featured_image: string | null;
  image_assets: unknown;
  source_prompt: string | null;
  review_notes: string | null;
  published_post_id: number | null;
  approved_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function jsonOrDbNull(
  v: unknown
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (v == null) return Prisma.DbNull;
  return v as Prisma.InputJsonValue;
}

function emptyToNull(v: string | null | undefined): string | null | undefined {
  if (v === undefined) return undefined;
  if (v == null) return null;
  const t = v.trim();
  return t.length ? t : null;
}

export function serializeEditorialJob(row: editorial_jobs): EditorialJobJson {
  return {
    id: row.id,
    topic: row.topic,
    status: row.status,
    revision: row.revision,
    approved_revision: row.approved_revision,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    title_en: row.title_en,
    excerpt_en: row.excerpt_en,
    content_en: row.content_en,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    seo_keywords: row.seo_keywords,
    category_id: row.category_id != null ? Number(row.category_id) : null,
    tags: row.tags,
    research_summary: row.research_summary,
    sources: row.sources,
    image_plan: row.image_plan,
    featured_image: row.featured_image,
    image_assets: row.image_assets,
    source_prompt: row.source_prompt,
    review_notes: row.review_notes,
    published_post_id:
      row.published_post_id != null ? Number(row.published_post_id) : null,
    approved_at: row.approved_at?.toISOString() ?? null,
    published_at: row.published_at?.toISOString() ?? null,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

async function loadJob(id: string): Promise<editorial_jobs> {
  const row = await prisma.editorial_jobs.findUnique({ where: { id } });
  if (!row) throw new EditorialError(404, "Editorial job not found");
  return row;
}

export async function createEditorialJob(input: EditorialCreateJobInput) {
  const row = await prisma.editorial_jobs.create({
    data: {
      topic: input.topic,
      source_prompt: emptyToNull(input.source_prompt) ?? null,
      status: EDITORIAL_STATUS.IDEA,
      revision: 1,
    },
  });
  return {
    id: row.id,
    status: row.status,
    revision: row.revision,
    created_at: row.created_at.toISOString(),
  };
}

export async function getEditorialJob(id: string): Promise<EditorialJobJson> {
  return serializeEditorialJob(await loadJob(id));
}

export type EditorialJobListItem = {
  id: string;
  topic: string;
  status: string;
  revision: number;
  approved_revision: number | null;
  slug: string | null;
  updated_at: string;
};

export async function listEditorialJobs(): Promise<EditorialJobListItem[]> {
  const rows = await prisma.editorial_jobs.findMany({
    orderBy: { updated_at: "desc" },
    take: 100,
    select: {
      id: true,
      topic: true,
      status: true,
      revision: true,
      approved_revision: true,
      slug: true,
      updated_at: true,
    },
  });
  return rows.map((row) => ({
    id: row.id,
    topic: row.topic,
    status: row.status,
    revision: row.revision,
    approved_revision: row.approved_revision,
    slug: row.slug,
    updated_at: row.updated_at.toISOString(),
  }));
}

async function assertCategoryExists(
  categoryId: bigint | number | null | undefined,
  db: {
    blog_categories: {
      findUnique: (args: {
        where: { id: bigint };
        select: { id: true };
      }) => Promise<{ id: bigint } | null>;
    };
  } = prisma
): Promise<void> {
  if (categoryId == null) return;
  const row = await db.blog_categories.findUnique({
    where: { id: BigInt(categoryId) },
    select: { id: true },
  });
  if (!row) {
    throw new EditorialError(400, "category_id does not exist");
  }
}

export async function updateEditorialJob(
  id: string,
  patch: EditorialPatchJobInput
): Promise<EditorialJobJson> {
  const current = await loadJob(id);
  if (patchBlockedWhilePublishing(current.status)) {
    throw new EditorialError(409, "Cannot update a job while PUBLISHING");
  }

  const normalized: EditorialPatchJobInput = { ...patch };
  if (patch.slug !== undefined) {
    const slug = emptyToNull(patch.slug);
    normalized.slug = slug ? generateSlug(slug) : null;
  }
  if (patch.title !== undefined) normalized.title = emptyToNull(patch.title) ?? null;
  if (patch.excerpt !== undefined) {
    normalized.excerpt = emptyToNull(patch.excerpt) ?? null;
  }
  if (patch.title_en !== undefined) {
    normalized.title_en = emptyToNull(patch.title_en) ?? null;
  }
  if (patch.excerpt_en !== undefined) {
    normalized.excerpt_en = emptyToNull(patch.excerpt_en) ?? null;
  }
  if (patch.seo_title !== undefined) {
    normalized.seo_title = emptyToNull(patch.seo_title) ?? null;
  }
  if (patch.seo_description !== undefined) {
    normalized.seo_description = emptyToNull(patch.seo_description) ?? null;
  }
  if (patch.research_summary !== undefined) {
    normalized.research_summary = emptyToNull(patch.research_summary) ?? null;
  }
  if (patch.review_notes !== undefined) {
    normalized.review_notes = emptyToNull(patch.review_notes) ?? null;
  }
  if (patch.source_prompt !== undefined) {
    normalized.source_prompt = emptyToNull(patch.source_prompt) ?? null;
  }
  if (patch.featured_image !== undefined) {
    normalized.featured_image = emptyToNull(patch.featured_image) ?? null;
  }

  if (normalized.category_id !== undefined) {
    await assertCategoryExists(normalized.category_id);
  }

  const revisionState = nextRevisionAfterPatch(current, normalized);
  const status = nextStatusAfterPatch(
    current.status,
    normalized,
    revisionState.clearApproval
  );

  const data: Prisma.editorial_jobsUpdateInput = {
    status,
    revision: revisionState.revision,
  };

  if (revisionState.clearApproval) {
    data.approved_revision = null;
    data.approved_at = null;
  }

  if (normalized.title !== undefined) data.title = normalized.title;
  if (normalized.slug !== undefined) data.slug = normalized.slug;
  if (normalized.excerpt !== undefined) data.excerpt = normalized.excerpt;
  if (normalized.content !== undefined) {
    data.content = jsonOrDbNull(normalized.content);
  }
  if (normalized.title_en !== undefined) data.title_en = normalized.title_en;
  if (normalized.excerpt_en !== undefined) data.excerpt_en = normalized.excerpt_en;
  if (normalized.content_en !== undefined) {
    data.content_en =
      normalized.content_en == null || isTiptapDocEmpty(normalized.content_en)
        ? Prisma.DbNull
        : (normalized.content_en as Prisma.InputJsonValue);
  }
  if (normalized.seo_title !== undefined) data.seo_title = normalized.seo_title;
  if (normalized.seo_description !== undefined) {
    data.seo_description = normalized.seo_description;
  }
  if (normalized.seo_keywords !== undefined) {
    data.seo_keywords = normalized.seo_keywords;
  }
  if (normalized.category_id !== undefined) {
    data.category_id =
      normalized.category_id != null ? BigInt(normalized.category_id) : null;
  }
  if (normalized.tags !== undefined) data.tags = normalized.tags;
  if (normalized.research_summary !== undefined) {
    data.research_summary = normalized.research_summary;
  }
  if (normalized.sources !== undefined) {
    data.sources = jsonOrDbNull(normalized.sources);
  }
  if (normalized.image_plan !== undefined) {
    data.image_plan = jsonOrDbNull(normalized.image_plan);
  }
  if (normalized.featured_image !== undefined) {
    data.featured_image = normalized.featured_image;
  }
  if (normalized.image_assets !== undefined) {
    data.image_assets = jsonOrDbNull(normalized.image_assets);
  }
  if (normalized.review_notes !== undefined) {
    data.review_notes = normalized.review_notes;
  }
  if (normalized.source_prompt !== undefined) {
    data.source_prompt = normalized.source_prompt;
  }

  const row = await prisma.editorial_jobs.update({
    where: { id },
    data,
  });
  return serializeEditorialJob(row);
}

export async function approveEditorialJob(id: string) {
  const job = await loadJob(id);
  const gate = canApproveJob(job);
  if (!gate.ok) throw new EditorialError(409, gate.error);

  const row = await prisma.editorial_jobs.update({
    where: { id },
    data: {
      approved_revision: job.revision,
      approved_at: new Date(),
      status: EDITORIAL_STATUS.APPROVED,
    },
  });

  return {
    id: row.id,
    revision: row.revision,
    approved_revision: row.approved_revision,
    status: row.status,
  };
}

export async function markGeneratingAssets(id: string) {
  const job = await loadJob(id);
  const gate = canStartAssets(job);
  if (!gate.ok) throw new EditorialError(409, gate.error);

  const row = await prisma.editorial_jobs.update({
    where: { id },
    data: { status: EDITORIAL_STATUS.GENERATING_ASSETS },
  });
  return serializeEditorialJob(row);
}

export async function markReadyToPublish(
  id: string,
  input: EditorialAssetsCompleteInput
) {
  const job = await loadJob(id);
  const gate = canCompleteAssets(job);
  if (!gate.ok) throw new EditorialError(409, gate.error);

  const featured =
    input.featured_image !== undefined
      ? emptyToNull(input.featured_image) ?? null
      : job.featured_image;

  const row = await prisma.editorial_jobs.update({
    where: { id },
    data: {
      featured_image: featured,
      image_assets:
        input.image_assets !== undefined
          ? jsonOrDbNull(input.image_assets)
          : undefined,
      status: EDITORIAL_STATUS.READY_TO_PUBLISH,
    },
  });
  return serializeEditorialJob(row);
}

function revalidatePublishedPaths(slug: string) {
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/magazine");
}

export async function publishEditorialJob(id: string): Promise<{
  ok: true;
  post_id: number;
  slug: string;
  url: string;
}> {
  const job = await loadJob(id);
  const gate = canPublishJob(job);
  if (!gate.ok) throw new EditorialError(409, gate.error);
  await assertCategoryExists(job.category_id);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const locked = await tx.editorial_jobs.findUnique({ where: { id } });
      if (!locked) throw new EditorialError(404, "Editorial job not found");
      const innerGate = canPublishJob(locked);
      if (!innerGate.ok) throw new EditorialError(409, innerGate.error);
      await assertCategoryExists(locked.category_id, tx);

      await tx.editorial_jobs.update({
        where: { id },
        data: { status: EDITORIAL_STATUS.PUBLISHING },
      });

      const baseSlug = generateSlug(locked.slug?.trim() || locked.title || "post");
      const slug = await ensureUniqueBlogSlug(
        baseSlug,
        locked.published_post_id ?? undefined,
        tx
      );
      const mapped = buildBlogPostMappedFields(locked, slug);
      const content = mapped.content as Prisma.InputJsonValue;
      const contentEn =
        mapped.content_en == null || isTiptapDocEmpty(mapped.content_en)
          ? Prisma.DbNull
          : (mapped.content_en as Prisma.InputJsonValue);
      const mappedFields = {
        title: mapped.title,
        slug: mapped.slug,
        excerpt: mapped.excerpt,
        content,
        title_en: mapped.title_en,
        excerpt_en: mapped.excerpt_en,
        content_en: contentEn,
        featured_image: mapped.featured_image,
        tags: mapped.tags,
        category_id: mapped.category_id,
        status: mapped.status,
        raw_input: mapped.raw_input,
      };

      const existing =
        locked.published_post_id != null
          ? await tx.blog_posts.findUnique({
              where: { id: locked.published_post_id },
            })
          : null;

      const createdOrUpdated = existing
        ? await tx.blog_posts.update({
            where: { id: existing.id },
            data: {
              ...mappedFields,
              published_at: existing.published_at ?? new Date(),
            },
            select: { id: true, slug: true },
          })
        : await tx.blog_posts.create({
            data: {
              ...mappedFields,
              published_at: new Date(),
            },
            select: { id: true, slug: true },
          });

      await tx.editorial_jobs.update({
        where: { id },
        data: {
          status: EDITORIAL_STATUS.PUBLISHED,
          published_post_id: createdOrUpdated.id,
          published_at: new Date(),
          slug: createdOrUpdated.slug,
        },
      });

      return { post_id: createdOrUpdated.id, slug: createdOrUpdated.slug };
    });

    revalidatePublishedPaths(result.slug);
    return {
      ok: true,
      post_id: Number(result.post_id),
      slug: result.slug,
      url: `/blog/${result.slug}`,
    };
  } catch (err) {
    const isClientError =
      err instanceof EditorialError && err.status !== 500;
    if (!isClientError) {
      await prisma.editorial_jobs
        .update({
          where: { id },
          data: { status: EDITORIAL_STATUS.FAILED },
        })
        .catch(() => undefined);
    }
    if (err instanceof EditorialError) throw err;
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: unknown }).code === "P2003"
    ) {
      throw new EditorialError(400, "category_id does not exist");
    }
    throw new EditorialError(500, "Publish failed");
  }
}
