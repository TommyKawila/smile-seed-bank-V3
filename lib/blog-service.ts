/**
 * Digital Magazine — data layer (carousel, trending, smart product tie-in).
 * UI stays in app/ and components/; keep queries here.
 */

import { prisma } from "@/lib/prisma";

export const MAGAZINE_TRENDING_MODE_KEY = "magazine_trending_mode";

export type TrendingMode = "auto" | "manual";

export async function getMagazineTrendingMode(): Promise<TrendingMode> {
  const row = await prisma.site_settings.findUnique({
    where: { key: MAGAZINE_TRENDING_MODE_KEY },
  });
  if (row?.value === "manual") return "manual";
  return "auto";
}

export async function setMagazineTrendingMode(mode: TrendingMode): Promise<void> {
  await prisma.site_settings.upsert({
    where: { key: MAGAZINE_TRENDING_MODE_KEY },
    create: { key: MAGAZINE_TRENDING_MODE_KEY, value: mode },
    update: { value: mode },
  });
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export type BlogCategoryPublic = {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
};

export async function getBlogCategories(): Promise<BlogCategoryPublic[]> {
  const rows = await prisma.blog_categories.findMany({
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
  });
  return rows.map((c) => ({
    id: Number(c.id),
    name: c.name,
    slug: c.slug,
    sort_order: c.sort_order,
  }));
}

/** Recent published posts (e.g. “Latest” when no category filter). */
export async function getRecentPublishedPosts(take = 6): Promise<MagazinePostPublic[]> {
  const rows = await prisma.blog_posts.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { published_at: "desc" },
    take,
    include: { blog_categories: true },
  });
  return rows.map(serializePost);
}

export async function getPublishedPostsByCategorySlug(
  slug: string,
  take = 12
): Promise<MagazinePostPublic[]> {
  const rows = await prisma.blog_posts.findMany({
    where: {
      status: "PUBLISHED",
      blog_categories: { slug },
    },
    orderBy: { published_at: "desc" },
    take,
    include: { blog_categories: true },
  });
  return rows.map(serializePost);
}

export type MagazinePostPublic = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  tags: string[];
  view_count: number;
  published_at: string | null;
  category: { id: number; name: string; slug: string } | null;
};

function serializePost(p: {
  id: bigint;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  tags: string[];
  view_count: number;
  published_at: Date | null;
  blog_categories: { id: bigint; name: string; slug: string } | null;
}): MagazinePostPublic {
  return {
    id: Number(p.id),
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    featured_image: p.featured_image,
    tags: p.tags ?? [],
    view_count: p.view_count,
    published_at: p.published_at?.toISOString() ?? null,
    category: p.blog_categories
      ? {
          id: Number(p.blog_categories.id),
          name: p.blog_categories.name,
          slug: p.blog_categories.slug,
        }
      : null,
  };
}

/** Randomized highlight posts for carousel (published + is_highlight). */
export async function getHighlightPosts(poolSize = 24, take = 12): Promise<MagazinePostPublic[]> {
  const rows = await prisma.blog_posts.findMany({
    where: { is_highlight: true, status: "PUBLISHED" },
    orderBy: { updated_at: "desc" },
    take: poolSize,
    include: { blog_categories: true },
  });
  return shuffle(rows).slice(0, take).map(serializePost);
}

/** Trending: auto = view_count, manual = manual_rank (then recency). */
export async function getTrendingPosts(
  take = 12,
  mode?: TrendingMode
): Promise<MagazinePostPublic[]> {
  const m = mode ?? (await getMagazineTrendingMode());
  if (m === "manual") {
    const rows = await prisma.blog_posts.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ manual_rank: "asc" }, { updated_at: "desc" }],
      take,
      include: { blog_categories: true },
    });
    return rows.map(serializePost);
  }
  const rows = await prisma.blog_posts.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ view_count: "desc" }, { published_at: "desc" }],
    take,
    include: { blog_categories: true },
  });
  return rows.map(serializePost);
}

export type MagazinePostDetail = MagazinePostPublic & {
  content: unknown;
  author_id: string | null;
  updated_at: string;
  created_at: string;
  related_products: number[];
};

export type MagazineProductPublic = {
  id: number;
  name: string;
  slug: string | null;
  image_url: string | null;
  breeder_name: string | null;
  price: number | null;
};

export async function getPublishedPostBySlug(slug: string): Promise<MagazinePostDetail | null> {
  const row = await prisma.blog_posts.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { blog_categories: true },
  });
  if (!row) return null;
  return {
    ...serializePost(row),
    content: row.content,
    author_id: row.author_id,
    updated_at: row.updated_at.toISOString(),
    created_at: row.created_at.toISOString(),
    related_products: (row.related_products ?? []).map(Number),
  };
}

export async function getMagazineProductsByIds(
  ids: number[]
): Promise<Map<number, MagazineProductPublic>> {
  const map = new Map<number, MagazineProductPublic>();
  if (ids.length === 0) return map;
  const uniq = [...new Set(ids)];
  const rows = await prisma.products.findMany({
    where: {
      id: { in: uniq.map((n) => BigInt(n)) },
      is_active: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      image_url: true,
      price: true,
      breeders: { select: { name: true } },
    },
  });
  for (const row of rows) {
    const price = row.price != null ? Number(row.price) : null;
    map.set(Number(row.id), {
      id: Number(row.id),
      name: row.name,
      slug: row.slug,
      image_url: row.image_url,
      breeder_name: row.breeders?.name ?? null,
      price: Number.isFinite(price) ? price : null,
    });
  }
  return map;
}

export async function incrementBlogPostViewCount(id: number): Promise<void> {
  await prisma.blog_posts.update({
    where: { id: BigInt(id) },
    data: { view_count: { increment: 1 } },
  });
}

export async function getRelatedMagazinePosts(
  excludeId: number,
  categorySlug: string | null,
  take = 2
): Promise<MagazinePostPublic[]> {
  const notId = BigInt(excludeId);
  const base = { status: "PUBLISHED" as const, id: { not: notId } };

  if (categorySlug) {
    const fromCat = await prisma.blog_posts.findMany({
      where: { ...base, blog_categories: { slug: categorySlug } },
      orderBy: { published_at: "desc" },
      take,
      include: { blog_categories: true },
    });
    if (fromCat.length >= take) return fromCat.map(serializePost);
    const rest = take - fromCat.length;
    const excludeIds = fromCat.map((p) => p.id);
    const more = await prisma.blog_posts.findMany({
      where: {
        status: "PUBLISHED",
        id: { notIn: [notId, ...excludeIds] },
      },
      orderBy: { published_at: "desc" },
      take: rest,
      include: { blog_categories: true },
    });
    return [...fromCat, ...more].map(serializePost);
  }

  const rows = await prisma.blog_posts.findMany({
    where: base,
    orderBy: { published_at: "desc" },
    take,
    include: { blog_categories: true },
  });
  return rows.map(serializePost);
}

export type AffiliatePublic = {
  id: number;
  title: string;
  url: string;
  platform_name: string;
  image_url: string | null;
};

export async function getAffiliateById(id: number): Promise<AffiliatePublic | null> {
  const row = await prisma.affiliate_links.findUnique({ where: { id: BigInt(id) } });
  if (!row) return null;
  return {
    id: Number(row.id),
    title: row.title,
    url: row.url,
    platform_name: row.platform_name,
    image_url: row.image_url,
  };
}

export async function getAffiliatesByIds(ids: number[]): Promise<Map<number, AffiliatePublic>> {
  const map = new Map<number, AffiliatePublic>();
  if (ids.length === 0) return map;
  const uniq = [...new Set(ids)];
  const rows = await prisma.affiliate_links.findMany({
    where: { id: { in: uniq.map((n) => BigInt(n)) } },
  });
  for (const row of rows) {
    map.set(Number(row.id), {
      id: Number(row.id),
      title: row.title,
      url: row.url,
      platform_name: row.platform_name,
      image_url: row.image_url,
    });
  }
  return map;
}

export type SmartProductPreview = {
  id: number;
  name: string;
  slug: string | null;
  image_url: string | null;
  breeder_name: string | null;
};

/** Match post tags against product name / genetics; return 2–3 random picks. */
export async function getSmartProducts(
  postTags: string[],
  take: 2 | 3 = 3
): Promise<SmartProductPreview[]> {
  const tags = [...new Set(postTags.map((t) => t.trim().toLowerCase()).filter(Boolean))];
  if (tags.length === 0) return [];
  const or = tags.flatMap((tag) => [
    { name: { contains: tag, mode: "insensitive" as const } },
    { genetics: { contains: tag, mode: "insensitive" as const } },
  ]);
  const rows = await prisma.products.findMany({
    where: { is_active: true, OR: or },
    take: 48,
    select: {
      id: true,
      name: true,
      slug: true,
      image_url: true,
      breeders: { select: { name: true } },
    },
  });
  const shuffled = shuffle(rows).slice(0, take);
  return shuffled.map((p) => ({
    id: Number(p.id),
    name: p.name,
    slug: p.slug,
    image_url: p.image_url,
    breeder_name: p.breeders?.name ?? null,
  }));
}
