import { Suspense } from "react";
import { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import {
  getBlogCategories,
  getHighlightPosts,
  getPublishedPostsByCategorySlug,
  getRecentPublishedPosts,
  getTrendingPosts,
} from "@/lib/blog-service";
import { MagazineCategoryPills } from "@/components/storefront/magazine/MagazineCategoryPills";
import { MagazineHeroCarousel } from "@/components/storefront/magazine/MagazineHeroCarousel";
import { MagazineLatestGrid } from "@/components/storefront/magazine/MagazineLatestGrid";
import { MagazineTrending } from "@/components/storefront/magazine/MagazineTrending";
import { BlogHeroSlogan } from "@/components/storefront/magazine/BlogHeroSlogan";
import { getSiteOrigin } from "@/lib/get-url";

const inter = Inter({ subsets: ["latin"], variable: "--font-magazine" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-magazine-serif" });

const siteBase = getSiteOrigin();

export const metadata: Metadata = {
  title: {
    absolute: "Smile Seed Blog — Bio-Ag Wisdom | Tommy Smile Seed",
  },
  description:
    "ผสานศาสตร์ชีวภาพ สู่สายเขียวออแกนิค เพื่อรอยยิ้มที่ปลอดภัย — Smile Seed Blog โดย Smile Seed Bank",
  openGraph: {
    title: "Smile Seed Blog — Bio-Ag Wisdom | Tommy Smile Seed",
    description:
      "Bio-Ag Wisdom for Safe & Organic Smiles — cultivation knowledge from Smile Seed Bank.",
    type: "website",
    url: `${siteBase}/blog`,
    siteName: "Smile Seed Blog",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smile Seed Blog — Bio-Ag Wisdom | Tommy Smile Seed",
    description:
      "Bio-Ag Wisdom for Safe & Organic Smiles — cultivation knowledge from Smile Seed Bank.",
  },
  alternates: {
    canonical: "/blog",
  },
};

export const revalidate = 300;

type PageProps = { searchParams: Record<string, string | string[] | undefined> };

export default async function BlogMagazinePage({ searchParams }: PageProps) {
  const raw = searchParams.category;
  const categorySlug = typeof raw === "string" ? raw : undefined;

  const [highlights, trending, categories, gridPosts] = await Promise.all([
    getHighlightPosts(24, 5),
    getTrendingPosts(8),
    getBlogCategories(),
    categorySlug
      ? getPublishedPostsByCategorySlug(categorySlug, 12)
      : getRecentPublishedPosts(9),
  ]);

  return (
    <div
      className={`min-h-screen bg-white text-zinc-900 ${inter.variable} ${playfair.variable} font-sans antialiased`}
    >
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <header className="mb-16 space-y-4 text-center lg:mb-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-700">
            Smile Seed Bank
          </p>
          <h1 className="font-[family-name:var(--font-magazine-serif)] text-4xl font-semibold tracking-tight text-zinc-900 md:text-5xl lg:text-6xl">
            Smile Seed Blog
          </h1>
          <BlogHeroSlogan />
        </header>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:items-start lg:gap-16">
          <div className="order-1 lg:order-none lg:col-start-2 lg:row-start-1">
            <MagazineHeroCarousel posts={highlights} />
          </div>

          <div className="order-2 lg:order-none lg:col-start-2 lg:row-start-2">
            <Suspense
              fallback={<div className="h-14 animate-pulse rounded-xl bg-zinc-100" />}
            >
              <MagazineCategoryPills categories={categories} />
            </Suspense>
          </div>

          <div className="order-3 lg:order-none lg:col-start-1 lg:row-start-1 lg:row-span-3 lg:sticky lg:top-28 lg:self-start">
            <MagazineTrending posts={trending} />
          </div>

          <div className="order-4 lg:order-none lg:col-start-2 lg:row-start-3">
            <section aria-label="Smile Seed Blog articles">
              <MagazineLatestGrid posts={gridPosts} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
