import { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { ChevronRight, Clock, Eye } from "lucide-react";
import type { MagazineProductPublic } from "@/lib/blog-service";
import {
  getAffiliatesByIds,
  getMagazineProductsByIds,
  getPublishedPostBySlug,
  getRelatedMagazinePosts,
  getSmartProducts,
} from "@/lib/blog-service";
import {
  splitForSmartTieIn,
  parseArticleSegments,
  collectProductIdsFromSegments,
} from "@/lib/magazine-article-segments";
import { tiptapJsonToHtml } from "@/lib/tiptap-to-html";
import {
  articleMetaDescription,
  defaultOgImageUrl,
  resolveAbsoluteUrl,
  truncateMetaDescription,
} from "@/lib/magazine-seo";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { formatDate } from "@/lib/utils";
import { MagazineArticleBody } from "@/components/storefront/magazine/MagazineArticleBody";
import { MagazineArticleJsonLd } from "@/components/storefront/magazine/MagazineArticleJsonLd";
import { MagazineArticleShare } from "@/components/storefront/magazine/MagazineArticleShare";
import { SmartTieInStrip } from "@/components/storefront/magazine/SmartTieInStrip";
import { BlogViewTracker } from "@/components/storefront/magazine/BlogViewTracker";
import { NewsletterBox } from "@/components/storefront/magazine/NewsletterBox";
import { ShopTheStorySection } from "@/components/storefront/magazine/ShopTheStorySection";
import { VerifiedResearchBadge } from "@/components/storefront/magazine/VerifiedResearchBadge";
import {
  formatResearchRefId,
  isResearchCategory,
  magazineCategoryDisplayTh,
} from "@/lib/blog-research-category";
import { getSiteOrigin } from "@/lib/get-url";
import { cn } from "@/lib/utils";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import { BlogArticleBreederRibbon } from "@/components/storefront/magazine/BlogArticleBreederRibbon";
import { ArticleCampaignBanner } from "@/components/storefront/ArticleCampaignBanner";
import {
  magazineDisplayContentJson,
  magazineDisplayExcerpt,
  magazineDisplayTagline,
  magazineDisplayTitle,
  magazineLocaleFromCookie,
} from "@/lib/magazine-bilingual";

const inter = Inter({ subsets: ["latin"], variable: "--font-magazine" });

export const revalidate = 120;

function readingMinutesFromHtml(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text.split(/\s/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function collectAffiliateIds(segments: ReturnType<typeof parseArticleSegments>): number[] {
  return segments.filter((s) => s.kind === "affiliateId").map((s) => s.id);
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPublishedPostBySlug(params.slug);
  if (!post) return { title: "ไม่พบบทความ" };

  const locale = magazineLocaleFromCookie(cookies().get("locale")?.value);
  const displayTitle = magazineDisplayTitle(post, locale);
  const displayExcerpt = magazineDisplayExcerpt(post, locale);
  const contentJson = magazineDisplayContentJson(post, locale);
  const contentHtml = tiptapJsonToHtml(contentJson);
  const description = displayExcerpt?.trim()
    ? truncateMetaDescription(displayExcerpt.trim())
    : articleMetaDescription(null, contentHtml);

  const siteUrl = getSiteOrigin();
  const base = siteUrl;

  const rawImage = post.featured_image?.trim();
  const ogImageUrl = rawImage ? resolveAbsoluteUrl(siteUrl, rawImage) : defaultOgImageUrl(siteUrl);
  const pageUrl = `${base}/blog/${post.slug}`;
  const titleSuffix =
    locale === "en"
      ? "Green knowledge vault — Smile Seed Bank"
      : "คลังความรู้สายเขียว - Smile Seed Bank";

  return {
    metadataBase: new URL(base),
    title: {
      absolute: `${displayTitle} | ${titleSuffix}`,
    },
    description,
    authors: [{ name: "Smile Seed Bank Editorial" }],
    openGraph: {
      title: displayTitle,
      description,
      locale: locale === "en" ? "en_US" : "th_TH",
      type: "article",
      url: pageUrl,
      siteName: "Smile Seed Bank",
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      authors: ["Smile Seed Bank Editorial"],
      images: [
        {
          url: ogImageUrl,
          alt: displayTitle,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: displayTitle,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogArticlePage({ params }: { params: { slug: string } }) {
  const post = await getPublishedPostBySlug(params.slug);
  if (!post) notFound();

  const locale = magazineLocaleFromCookie(cookies().get("locale")?.value);
  const displayTitle = magazineDisplayTitle(post, locale);
  const displayExcerpt = magazineDisplayExcerpt(post, locale);
  const displayTagline = magazineDisplayTagline(post, locale);
  const contentJson = magazineDisplayContentJson(post, locale);
  const rawHtml = tiptapJsonToHtml(contentJson);
  const [beforeTie, afterTie] = splitForSmartTieIn(rawHtml);
  const segmentsBefore = parseArticleSegments(beforeTie);
  const segmentsAfter = parseArticleSegments(afterTie);
  const affiliateIds = [
    ...collectAffiliateIds(segmentsBefore),
    ...collectAffiliateIds(segmentsAfter),
  ];

  const inContentProductIds = [
    ...collectProductIdsFromSegments(segmentsBefore),
    ...collectProductIdsFromSegments(segmentsAfter),
  ];
  const relatedProductIds = post.related_products ?? [];
  const productIdsAll = [
    ...new Set([...relatedProductIds, ...inContentProductIds]),
  ];

  const [affiliateMap, productMap, smartProducts, related] = await Promise.all([
    getAffiliatesByIds(affiliateIds),
    getMagazineProductsByIds(productIdsAll),
    getSmartProducts(post.tags, 2),
    getRelatedMagazinePosts(post.id, post.category?.slug ?? null, 2),
  ]);

  const shopStoryProducts: MagazineProductPublic[] = relatedProductIds
    .map((id) => productMap.get(id))
    .filter((p): p is MagazineProductPublic => p != null);

  const readMin = readingMinutesFromHtml(rawHtml);

  const siteUrl = getSiteOrigin();
  const base = siteUrl;
  const pageUrl = `${base}/blog/${post.slug}`;
  const metaDesc = articleMetaDescription(displayExcerpt, rawHtml);
  const rawFeatured = post.featured_image?.trim();
  const jsonLdImage = rawFeatured
    ? resolveAbsoluteUrl(siteUrl, rawFeatured)
    : defaultOgImageUrl(siteUrl);

  const refLine = formatResearchRefId(post.id, post.published_at);
  const metaMono =
    "font-[family-name:var(--font-journal-product-mono)] text-xs tabular-nums tracking-wide text-zinc-600";

  return (
    <div
      className={cn(
        "min-h-screen overflow-x-hidden bg-white text-zinc-900 font-sans antialiased",
        inter.variable,
        JOURNAL_PRODUCT_FONT_VARS
      )}
    >
      <MagazineArticleJsonLd
        title={displayTitle}
        description={metaDesc}
        imageUrls={[jsonLdImage]}
        datePublished={post.published_at ?? post.created_at}
        dateModified={post.updated_at}
        url={pageUrl}
      />
      <BlogViewTracker postId={post.id} />
      <article className="mx-auto max-w-3xl px-4 pb-28 pt-24 sm:px-6 lg:px-8">
        <nav
          className="mb-10 flex flex-wrap items-center gap-1 text-xs text-zinc-500"
          aria-label="Breadcrumb"
        >
          <Link href="/blog" className="transition hover:text-emerald-700">
            คลังความรู้สายเขียว
          </Link>
          {post.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
              <Link
                href={`/blog?category=${encodeURIComponent(post.category.slug)}`}
                className="transition hover:text-emerald-700"
              >
                {magazineCategoryDisplayTh(post.category)}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
          <span className="line-clamp-1 text-zinc-600">{displayTitle}</span>
        </nav>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="flex flex-wrap items-center gap-2">
            {post.category && (
              <span
                className={cn(
                  metaMono,
                  "text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-900"
                )}
              >
                {magazineCategoryDisplayTh(post.category)}
              </span>
            )}
            {isResearchCategory(post.category) && <VerifiedResearchBadge />}
          </div>
          <span
            className="shrink-0 font-[family-name:var(--font-journal-product-mono)] text-[11px] tabular-nums tracking-wide text-zinc-500 sm:pt-1"
            title="Research reference"
          >
            {refLine}
          </span>
        </div>

        <h1 className="font-sans text-3xl font-medium leading-[1.25] tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">
          {displayTitle}
        </h1>

        {displayTagline && (
          <p className="mt-4 max-w-3xl text-lg font-light leading-relaxed text-zinc-600">
            {displayTagline}
          </p>
        )}

        <div
          className={cn(
            "mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-zinc-200 pb-8",
            metaMono
          )}
        >
          <span className="text-zinc-500">Smile Seed Bank Editorial</span>
          {post.published_at && (
            <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
            อ่าน {readMin} นาที
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
            {post.view_count.toLocaleString("th-TH")} ครั้ง
          </span>
        </div>

        {post.featured_image && (
          <div className="relative -mx-4 mb-12 mt-10 aspect-video min-h-[220px] overflow-hidden rounded-sm border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:mx-0 md:min-h-[360px] lg:min-h-[420px]">
            <Image
              src={post.featured_image}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 720px"
              priority
              placeholder="blur"
              blurDataURL={SHIMMER_BLUR_DATA_URL}
              unoptimized={shouldOffloadImageOptimization(post.featured_image)}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent" />
          </div>
        )}

        {displayExcerpt && (
          <aside
            className={cn(
              "mb-10 rounded-sm border-l-4 border-emerald-600 bg-zinc-50 py-5 pl-5 pr-5 text-base font-light leading-relaxed tracking-[0.02em] text-zinc-700 sm:pl-6 sm:pr-6 sm:text-[1.05rem]",
              !post.featured_image && "mt-10"
            )}
            aria-label="Abstract"
          >
            {displayExcerpt}
          </aside>
        )}

        <div
          className={cn(
            "mx-auto max-w-[720px]",
            displayExcerpt ? "mt-0" : post.featured_image ? "mt-12" : "mt-10"
          )}
        >
          <MagazineArticleBody
            segments={segmentsBefore}
            affiliateMap={affiliateMap}
            productMap={productMap}
          />
          <SmartTieInStrip products={smartProducts} />
          <MagazineArticleBody
            segments={segmentsAfter}
            affiliateMap={affiliateMap}
            productMap={productMap}
          />
        </div>

        <ArticleCampaignBanner lang={locale} />

        <ShopTheStorySection products={shopStoryProducts} />

        {related.length > 0 && (
          <section className="mx-auto mt-20 max-w-[720px] border-t border-zinc-200 pt-16">
            <h2 className="font-sans text-2xl font-semibold text-emerald-950">
              บทความแนะนำ
            </h2>
            <ul className="mt-8 grid gap-8 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/blog/${r.slug}`}
                    className="group block overflow-hidden rounded-sm border border-[#f3f4f6] bg-white shadow-sm transition hover:shadow-lg"
                  >
                    {r.featured_image && (
                      <div className="relative aspect-video w-full overflow-hidden">
                        <Image
                          src={r.featured_image}
                          alt=""
                          fill
                          className="object-cover transition duration-500 group-hover:scale-[1.02]"
                          sizes="(max-width: 640px) 100vw, 50vw"
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL={SHIMMER_BLUR_DATA_URL}
                          unoptimized={shouldOffloadImageOptimization(r.featured_image)}
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {r.category && (
                          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-900">
                            {magazineCategoryDisplayTh(r.category)}
                          </span>
                        )}
                        {isResearchCategory(r.category) && <VerifiedResearchBadge />}
                      </div>
                      <p className="mt-2 line-clamp-2 font-sans text-base font-semibold text-zinc-900 group-hover:text-emerald-800">
                        {magazineDisplayTitle(r, locale)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section
          className="relative left-1/2 right-1/2 mt-20 w-screen max-w-[100vw] -translate-x-1/2 border-t border-zinc-100 bg-white py-20"
          aria-labelledby="blog-post-breeders-heading"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <BlogArticleBreederRibbon headingId="blog-post-breeders-heading" />
          </div>
        </section>

        <div className="mx-auto mt-16 max-w-[720px] space-y-10">
          <NewsletterBox />
          <MagazineArticleShare url={pageUrl} title={displayTitle} />
          <Link
            href="/blog"
            className="inline-flex text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
          >
            ← กลับสู่คลังความรู้
          </Link>
        </div>
      </article>
    </div>
  );
}
