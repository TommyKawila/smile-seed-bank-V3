import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteOrigin } from "@/lib/get-url";
import { breederSlugFromName } from "@/lib/breeder-slug";

/** Product PDPs use `/product/[slug]` (slug or numeric id). Nested `/seeds/[breeder]/[product]` is not a route in this app. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteOrigin();
  const now = new Date();

  const [posts, products, breeders] = await Promise.all([
    prisma.blog_posts.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updated_at: true, published_at: true },
    }),
    prisma.products.findMany({
      where: { is_active: true },
      select: { id: true, slug: true, created_at: true },
    }),
    prisma.breeders.findMany({
      where: { is_active: true },
      select: { name: true, created_at: true },
    }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/seeds`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.88 },
    { url: `${base}/breeders`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const breederCatalogEntries: MetadataRoute.Sitemap = breeders.map((b) => ({
    url: `${base}/seeds/${encodeURIComponent(breederSlugFromName(b.name))}`,
    lastModified: b.created_at ?? now,
    changeFrequency: "weekly" as const,
    priority: 0.72,
  }));

  const blogEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/blog/${encodeURIComponent(p.slug)}`,
    lastModified: p.updated_at ?? p.published_at ?? now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => {
    const path = p.slug?.trim()
      ? encodeURIComponent(p.slug.trim())
      : String(p.id);
    return {
      url: `${base}/product/${path}`,
      lastModified: p.created_at ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    };
  });

  return [...staticEntries, ...breederCatalogEntries, ...blogEntries, ...productEntries];
}
