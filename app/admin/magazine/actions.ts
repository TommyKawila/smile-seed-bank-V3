"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/product-utils";
import { upsertNewsletterEmail } from "@/lib/newsletter-subscribe";
import {
  setMagazineTrendingMode,
  type TrendingMode,
} from "@/lib/blog-service";
import { assertAdmin } from "@/lib/auth-utils";
import { sendMagazineNewsletterBroadcast } from "@/lib/magazine-email-broadcast";
import { sendNewsletterWelcomeEmail } from "@/services/email-service";
import type { MagazineEmailTemplateId } from "@/lib/email-magazine-broadcast-html";
import { isTiptapDocEmpty } from "@/lib/magazine-bilingual";

export type { MagazineEmailTemplateId };

function normalizeContentEn(
  v: object | null | undefined
): object | null {
  if (v == null || isTiptapDocEmpty(v)) return null;
  return v;
}

export type MagazineSaveInput = {
  title: string;
  title_en?: string;
  slug: string;
  excerpt: string;
  excerpt_en?: string;
  content: object;
  content_en?: object | null;
  tagline?: string;
  tagline_en?: string;
  featured_image: string | null;
  tags: string[];
  status: "DRAFT" | "PUBLISHED";
  category_id: number | null;
  /** Stored as `blog_posts.related_products` (BigInt[]) */
  related_product_ids: number[];
  /** When publishing: optional newsletter broadcast */
  send_email?: boolean;
  email_template?: MagazineEmailTemplateId;
  field_notes_creator_url?: string;
  field_notes_bullets?: string[];
  raw_input?: string;
  ai_tone_mood?: string;
  ai_opening_closing?: string;
  ai_target_audience?: string;
};

function validateMagazineEmailOptions(
  input: MagazineSaveInput
): { ok: true } | { ok: false; error: string } {
  if (!input.send_email || input.status !== "PUBLISHED") return { ok: true };
  const tpl = input.email_template ?? "research";
  if (tpl === "research") return { ok: true };
  const urlRaw = input.field_notes_creator_url?.trim() ?? "";
  const parsed = z.string().url().safeParse(urlRaw);
  if (!parsed.success || !/^https?:\/\//i.test(urlRaw)) {
    return {
      ok: false,
      error: "Field Notes: enter a valid https link for the original creator",
    };
  }
  const raw = input.field_notes_bullets ?? [];
  const bullets = raw.map((b) => String(b).trim()).filter(Boolean);
  if (bullets.length !== 3) {
    return {
      ok: false,
      error: "Field Notes: add exactly three highlight bullets",
    };
  }
  return { ok: true };
}

async function broadcastIfRequested(
  input: MagazineSaveInput,
  row: {
    title: string;
    slug: string;
    excerpt: string | null;
    featured_image: string | null;
  }
): Promise<{ emailSent?: number; emailError?: string }> {
  if (!input.send_email || input.status !== "PUBLISHED") return {};
  try {
    await assertAdmin();
  } catch {
    return { emailError: "Unauthorized" };
  }
  const template = input.email_template ?? "research";
  const bulletsIn = input.field_notes_bullets ?? [];
  const trimmed: [string, string, string] = [
    String(bulletsIn[0] ?? "").trim(),
    String(bulletsIn[1] ?? "").trim(),
    String(bulletsIn[2] ?? "").trim(),
  ];
  const r = await sendMagazineNewsletterBroadcast({
    template,
    title: row.title,
    excerpt: row.excerpt,
    slug: row.slug,
    featured_image: row.featured_image,
    creatorUrl:
      template === "field_notes"
        ? (input.field_notes_creator_url ?? "").trim()
        : undefined,
    highlights: template === "field_notes" ? trimmed : undefined,
  });
  return {
    emailSent: r.sent,
    ...(r.error ? { emailError: r.error } : {}),
  };
}

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
  const ev = validateMagazineEmailOptions(input);
  if (!ev.ok) return { ok: false as const, error: ev.error };
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

  const contentEn = normalizeContentEn(
    input.content_en as object | null | undefined
  );

  const created = await prisma.blog_posts.create({
    data: {
      title,
      title_en: input.title_en?.trim() || null,
      slug,
      excerpt: input.excerpt?.trim() || null,
      excerpt_en: input.excerpt_en?.trim() || null,
      content: input.content as Prisma.InputJsonValue,
      content_en:
        contentEn === null
          ? Prisma.DbNull
          : (contentEn as Prisma.InputJsonValue),
      tagline: input.tagline?.trim() || null,
      tagline_en: input.tagline_en?.trim() || null,
      raw_input: input.raw_input?.trim() || null,
      ai_tone_mood: input.ai_tone_mood?.trim() || null,
      ai_opening_closing: input.ai_opening_closing?.trim() || null,
      ai_target_audience: input.ai_target_audience?.trim() || null,
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
  const emailMeta = await broadcastIfRequested(input, {
    title,
    slug: created.slug,
    excerpt: created.excerpt,
    featured_image: created.featured_image,
  });
  return {
    ok: true as const,
    id: Number(created.id),
    slug: created.slug,
    ...emailMeta,
  };
}

export async function updateMagazinePost(id: number, input: MagazineSaveInput) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Title is required" };
  const ev = validateMagazineEmailOptions(input);
  if (!ev.ok) return { ok: false as const, error: ev.error };
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

  const contentEn = normalizeContentEn(
    input.content_en as object | null | undefined
  );

  const row = await prisma.blog_posts.update({
    where: { id: bid },
    data: {
      title,
      title_en: input.title_en?.trim() || null,
      slug,
      excerpt: input.excerpt?.trim() || null,
      excerpt_en: input.excerpt_en?.trim() || null,
      content: input.content as Prisma.InputJsonValue,
      content_en:
        contentEn === null
          ? Prisma.DbNull
          : (contentEn as Prisma.InputJsonValue),
      tagline: input.tagline?.trim() || null,
      tagline_en: input.tagline_en?.trim() || null,
      raw_input: input.raw_input?.trim() || null,
      ai_tone_mood: input.ai_tone_mood?.trim() || null,
      ai_opening_closing: input.ai_opening_closing?.trim() || null,
      ai_target_audience: input.ai_target_audience?.trim() || null,
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
  const emailMeta = await broadcastIfRequested(input, {
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    featured_image: row.featured_image,
  });
  return { ok: true as const, slug, ...emailMeta };
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
    const { shouldSendWelcome } = await upsertNewsletterEmail(parsed.data);
    if (shouldSendWelcome) {
      const r = await sendNewsletterWelcomeEmail({ toEmail: parsed.data, locale: "th" });
      if (!r.success) {
        console.error("[magazine newsletter welcome]", r.error);
      }
    }
    return { ok: true as const, message: "Thanks — you're on the list." };
  } catch {
    return { ok: false as const, error: "Could not save" };
  }
}
