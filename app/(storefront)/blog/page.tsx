import { Suspense } from "react";
import { cookies } from "next/headers";
import { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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
import {
  BLOG_INDEX_DESCRIPTION,
  BLOG_INDEX_TITLE,
} from "@/lib/seo/blog-index-metadata";
import { magazineLocaleFromCookie } from "@/lib/magazine-bilingual";

const inter = Inter({ subsets: ["latin"], variable: "--font-magazine" });
const journalMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-journal-mono" });

const siteBase = getSiteOrigin();

export const metadata: Metadata = {
  title: {
    absolute: BLOG_INDEX_TITLE,
  },
  description: BLOG_INDEX_DESCRIPTION,
  openGraph: {
    title: BLOG_INDEX_TITLE,
    description: BLOG_INDEX_DESCRIPTION,
    type: "website",
    url: `${siteBase}/blog`,
    siteName: "Smile Seed Bank",
  },
  twitter: {
    card: "summary_large_image",
    title: BLOG_INDEX_TITLE,
    description: BLOG_INDEX_DESCRIPTION,
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
  const locale = magazineLocaleFromCookie(cookies().get("locale")?.value);

  const [highlights, trending, categories, gridPosts] = await Promise.all([
    getHighlightPosts(24, 5),
    getTrendingPosts(8),
    getBlogCategories(),
    categorySlug
      ? getPublishedPostsByCategorySlug(categorySlug, 15)
      : getRecentPublishedPosts(15),
  ]);

  return (
    <div
      className={`min-h-screen bg-background text-foreground ${inter.variable} ${journalMono.variable} font-sans antialiased`}
    >
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-24 sm:px-6 lg:px-8">
        <header className="mb-16 space-y-4 text-center lg:mb-24 lg:space-y-5">
          <h1 className="font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {locale === "en" ? "Smile Seed Blog" : "คลังความรู้สายเขียว"}
          </h1>
          <BlogHeroSlogan />
        </header>

        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:items-start lg:gap-20">
          <div className="order-1 lg:order-none lg:col-start-2 lg:row-start-1">
            <MagazineHeroCarousel posts={highlights} />
          </div>

          <div className="order-2 lg:order-none lg:col-start-2 lg:row-start-2">
            <Suspense
              fallback={<div className="h-14 animate-pulse rounded-xl bg-muted/30" />}
            >
              <MagazineCategoryPills categories={categories} />
            </Suspense>
          </div>

          <div className="order-3 lg:order-none lg:col-start-1 lg:row-start-1 lg:row-span-3 lg:sticky lg:top-28 lg:self-start">
            <MagazineTrending posts={trending} locale={locale} />
          </div>

          <div className="order-4 lg:order-none lg:col-start-2 lg:row-start-3">
            <section aria-label="บทความคลังความรู้สายเขียว">
              <MagazineLatestGrid posts={gridPosts} locale={locale} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
