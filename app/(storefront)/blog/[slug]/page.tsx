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
} from "@/lib/blog-research-category";
import { getSiteOrigin } from "@/lib/get-url";
import { cn, formatDate } from "@/lib/utils";
import { magazineCategoryLabel } from "@/lib/blog-category-labels";
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
  const metaClass = "font-sans text-xs tabular-nums text-foreground/50";

  return (
    <div
      className={cn(
        "min-h-screen overflow-x-hidden bg-background text-foreground font-sans antialiased",
        inter.variable
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
          className="mb-10 flex flex-wrap items-center gap-1 font-sans text-xs text-foreground/55"
          aria-label="Breadcrumb"
        >
          <Link href="/blog" className="transition hover:text-primary">
            {locale === "en" ? "Knowledge vault" : "คลังความรู้สายเขียว"}
          </Link>
          {post.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
              <Link
                href={`/blog?category=${encodeURIComponent(post.category.slug)}`}
                className="transition hover:text-primary"
              >
                {magazineCategoryLabel(post.category, locale)}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
          <span className="line-clamp-1 text-foreground/45">{displayTitle}</span>
        </nav>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="flex flex-wrap items-center gap-2">
            {post.category && (
              <span className="inline-flex w-fit rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                {magazineCategoryLabel(post.category, locale)}
              </span>
            )}
            {isResearchCategory(post.category) && <VerifiedResearchBadge />}
          </div>
          <span className={cn(metaClass, "shrink-0 sm:pt-1")} title="Research reference">
            {refLine}
          </span>
        </div>

        <h1 className="font-sans text-3xl font-semibold leading-[1.25] tracking-tight text-foreground sm:text-4xl md:text-[2.65rem]">
          {displayTitle}
        </h1>

        {displayTagline && (
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-foreground/65">
            {displayTagline}
          </p>
        )}

        <div
          className={cn(
            "mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border pb-8",
            metaClass
          )}
        >
          <span className="text-foreground/70">Smile Seed Bank Editorial</span>
          {post.published_at && (
            <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-foreground/40" aria-hidden />
            อ่าน {readMin} นาที
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-foreground/40" aria-hidden />
            {post.view_count.toLocaleString("th-TH")} ครั้ง
          </span>
        </div>

        {post.featured_image && (
          <div className="relative -mx-4 mb-12 mt-10 aspect-video min-h-[220px] overflow-hidden rounded-2xl border border-border shadow-sm sm:mx-0 md:min-h-[360px] lg:min-h-[420px]">
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
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
          </div>
        )}

        {displayExcerpt && (
          <aside
            className={cn(
              "mb-10 rounded-xl border border-primary/25 bg-primary/5 py-5 pl-5 pr-5 text-base leading-relaxed text-foreground/70 sm:pl-6 sm:pr-6 sm:text-[1.05rem]",
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
          <section className="mx-auto mt-20 max-w-[720px] border-t border-border pt-16">
            <h2 className="font-sans text-2xl font-semibold text-foreground">
              {locale === "en" ? "Recommended reads" : "บทความแนะนำ"}
            </h2>
            <ul className="mt-8 grid gap-8 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/blog/${r.slug}`}
                    className="group block overflow-hidden rounded-2xl border border-border bg-card/60 shadow-sm surface-glass transition hover:border-primary/30 hover:shadow-md"
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
                          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                            {magazineCategoryLabel(r.category, locale)}
                          </span>
                        )}
                        {isResearchCategory(r.category) && <VerifiedResearchBadge />}
                      </div>
                      <p className="mt-2 line-clamp-2 font-sans text-base font-semibold text-foreground group-hover:text-primary">
                        {magazineDisplayTitle(r, locale)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mx-auto mt-16 max-w-[720px] space-y-10">
          <NewsletterBox />
          <MagazineArticleShare url={pageUrl} title={displayTitle} />
          <Link
            href="/blog"
            className="inline-flex text-sm font-medium text-primary transition hover:text-primary/80"
          >
            ← {locale === "en" ? "Back to knowledge vault" : "กลับสู่คลังความรู้"}
          </Link>
        </div>
      </article>
    </div>
  );
}
