"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/product-utils";
import { upsertNewsletterEmail } from "@/lib/newsletter-subscribe";
import {
  setMagazineTrendingMode,
  type TrendingMode,
} from "@/lib/blog-service";

export type MagazineSaveInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: object;
  featured_image: string | null;
  tags: string[];
  status: "DRAFT" | "PUBLISHED";
  category_id: number | null;
  /** Stored as `blog_posts.related_products` (BigInt[]) */
  related_product_ids: number[];
};

async function ensureUniqueBlogSlug(base: string, excludeId?: bigint): Promise<string> {
  let slug = base.slice(0, 180) || "post";
  let n = 0;
  for (;;) {
    const existing = await prisma.blog_posts.findFirst({
      where: {
        slug,
        ...(excludeId != null ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (!existing) return slug;
    n += 1;
    slug = `${base.slice(0, 170)}-${n}`;
  }
}

export async function createMagazinePost(input: MagazineSaveInput) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Title is required" };
  const baseSlug = generateSlug(input.slug.trim() || title);
  const slug = await ensureUniqueBlogSlug(baseSlug);
  const published_at =
    input.status === "PUBLISHED" ? new Date() : null;

  const related_products = [
    ...new Set(
      (input.related_product_ids ?? []).filter(
        (n) => Number.isFinite(n) && n > 0
      )
    ),
  ].map((n) => BigInt(n));

  const created = await prisma.blog_posts.create({
    data: {
      title,
      slug,
      excerpt: input.excerpt?.trim() || null,
      content: input.content as object,
      featured_image: input.featured_image?.trim() || null,
      tags: input.tags,
      status: input.status,
      published_at,
      category_id: input.category_id != null ? BigInt(input.category_id) : null,
      related_products,
    },
  });

  revalidatePath("/admin/magazine");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  return { ok: true as const, id: Number(created.id), slug: created.slug };
}

export async function updateMagazinePost(id: number, input: MagazineSaveInput) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Title is required" };
  const bid = BigInt(id);
  const baseSlug = generateSlug(input.slug.trim() || title);
  const slug = await ensureUniqueBlogSlug(baseSlug, bid);

  const existing = await prisma.blog_posts.findUnique({ where: { id: bid } });
  if (!existing) return { ok: false as const, error: "Post not found" };

  const published_at =
    input.status === "PUBLISHED"
      ? existing.published_at ?? new Date()
      : null;

  const related_products = [
    ...new Set(
      (input.related_product_ids ?? []).filter(
        (n) => Number.isFinite(n) && n > 0
      )
    ),
  ].map((n) => BigInt(n));

  await prisma.blog_posts.update({
    where: { id: bid },
    data: {
      title,
      slug,
      excerpt: input.excerpt?.trim() || null,
      content: input.content as object,
      featured_image: input.featured_image?.trim() || null,
      tags: input.tags,
      status: input.status,
      published_at,
      category_id: input.category_id != null ? BigInt(input.category_id) : null,
      related_products,
    },
  });

  revalidatePath("/admin/magazine");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  return { ok: true as const, slug };
}

export async function deleteMagazinePost(id: number) {
  const bid = BigInt(id);
  const row = await prisma.blog_posts.findUnique({
    where: { id: bid },
    select: { slug: true },
  });
  if (!row) return { ok: false as const, error: "Not found" };
  await prisma.blog_posts.delete({ where: { id: bid } });
  revalidatePath("/admin/magazine");
  revalidatePath("/blog");
  revalidatePath(`/blog/${row.slug}`);
  return { ok: true as const };
}

export async function deleteMagazinePostFormAction(formData: FormData) {
  const raw = formData.get("id");
  const id = typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(id)) return;
  await deleteMagazinePost(id);
}

export async function setMagazineTrendingModeAction(mode: TrendingMode) {
  await setMagazineTrendingMode(mode);
  revalidatePath("/admin/magazine");
  revalidatePath("/blog");
}

export async function setMagazinePostHighlightAction(
  id: number,
  is_highlight: boolean
) {
  await prisma.blog_posts.update({
    where: { id: BigInt(id) },
    data: { is_highlight },
  });
  revalidatePath("/admin/magazine");
  revalidatePath("/blog");
}

const newsletterEmailSchema = z.string().trim().email().max(320);

export async function subscribeToNewsletter(email: string) {
  const parsed = newsletterEmailSchema.safeParse(email);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid email" };
  }
  try {
    await upsertNewsletterEmail(parsed.data);
    return { ok: true as const, message: "Thanks — you're on the list." };
  } catch {
    return { ok: false as const, error: "Could not save" };
  }
}
