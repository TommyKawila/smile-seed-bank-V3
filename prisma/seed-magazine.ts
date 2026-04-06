import "./load-env";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  MOCK_AFFILIATES,
  MOCK_MAGAZINE_CATEGORIES,
  MOCK_MAGAZINE_POSTS,
} from "@/lib/mock-magazine-data";

const MAGAZINE_TRENDING_MODE_KEY = "magazine_trending_mode";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateWithinLastDays(days: number): Date {
  const now = Date.now();
  const span = days * 24 * 60 * 60 * 1000;
  return new Date(now - Math.random() * span);
}

async function seedCategories() {
  const map = new Map<string, bigint>();
  for (const c of MOCK_MAGAZINE_CATEGORIES) {
    const row = await prisma.blog_categories.upsert({
      where: { slug: c.slug },
      create: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        sort_order: c.sort_order,
      },
      update: {
        name: c.name,
        description: c.description,
        sort_order: c.sort_order,
      },
    });
    map.set(c.slug, row.id);
  }
  return map;
}

async function seedAffiliates() {
  for (const a of MOCK_AFFILIATES) {
    const existing = await prisma.affiliate_links.findFirst({
      where: { title: a.title },
    });
    if (existing) {
      await prisma.affiliate_links.update({
        where: { id: existing.id },
        data: {
          url: a.url,
          platform_name: a.platform_name,
          image_url: a.image_url,
        },
      });
    } else {
      await prisma.affiliate_links.create({ data: a });
    }
  }
  const first = await prisma.affiliate_links.findFirst({ orderBy: { id: "asc" } });
  return first ? Number(first.id) : 1;
}

async function seedSiteSettings() {
  const mode = Math.random() < 0.5 ? "auto" : "manual";
  await prisma.site_settings.upsert({
    where: { key: MAGAZINE_TRENDING_MODE_KEY },
    create: { key: MAGAZINE_TRENDING_MODE_KEY, value: mode },
    update: { value: mode },
  });
  console.log(`✅ site_settings ${MAGAZINE_TRENDING_MODE_KEY} = ${mode}`);
}

async function seedPosts(categoryBySlug: Map<string, bigint>, affiliateId: number) {
  for (const def of MOCK_MAGAZINE_POSTS) {
    const category_id = categoryBySlug.get(def.categorySlug) ?? null;
    const created_at = randomDateWithinLastDays(30);
    const view_count = randomInt(80, 9950);
    const manual_rank = randomInt(1, 120);
    const published = def.status === "PUBLISHED";
    const published_at = published ? created_at : null;
    const content = def.buildContent(affiliateId) as Prisma.InputJsonValue;

    await prisma.blog_posts.upsert({
      where: { slug: def.slug },
      create: {
        title: def.title,
        slug: def.slug,
        excerpt: def.excerpt,
        content,
        featured_image: def.featured_image,
        tags: def.tags,
        status: def.status,
        is_highlight: def.is_highlight,
        category_id,
        view_count,
        manual_rank,
        created_at,
        published_at,
      },
      update: {
        title: def.title,
        excerpt: def.excerpt,
        content,
        featured_image: def.featured_image,
        tags: def.tags,
        status: def.status,
        is_highlight: def.is_highlight,
        category_id,
        view_count,
        manual_rank,
        published_at,
      },
    });
    console.log(`✅ post ${def.slug} (${def.status})`);
  }
}

/** Idempotent magazine seed — safe to call from `prisma/seed.ts`. */
export async function seedMagazine(): Promise<void> {
  console.log("🌿 Seeding Digital Magazine mock data…");
  const categoryBySlug = await seedCategories();
  console.log(`✅ ${MOCK_MAGAZINE_CATEGORIES.length} categories`);
  const affiliateId = await seedAffiliates();
  console.log(`✅ affiliates (first id for [AFFILIATE:]: ${affiliateId})`);
  await seedSiteSettings();
  await seedPosts(categoryBySlug, affiliateId);
  console.log("✨ Magazine seed complete.");
}

async function runCli() {
  try {
    await seedMagazine();
  } finally {
    await prisma.$disconnect();
  }
}

const isMagazineCli = process.argv[1]?.includes("seed-magazine");
if (isMagazineCli) {
  runCli().catch((e) => {
    console.error("❌ Magazine seed failed:", e);
    process.exit(1);
  });
}
