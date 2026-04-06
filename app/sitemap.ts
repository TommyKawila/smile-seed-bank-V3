import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const now = new Date();

  const [posts, products] = await Promise.all([
    prisma.blog_posts.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updated_at: true },
    }),
    prisma.products.findMany({
      where: { is_active: true, slug: { not: null } },
      select: { slug: true, created_at: true },
    }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${base}/breeders`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const blogEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  const productEntries: MetadataRoute.Sitemap = products
    .filter((p): p is typeof p & { slug: string } => Boolean(p.slug))
    .map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: p.created_at ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  return [...staticEntries, ...blogEntries, ...productEntries];
}
