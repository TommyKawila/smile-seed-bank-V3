import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Inter, Playfair_Display } from "next/font/google";
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
import { formatDate } from "@/lib/utils";
import { MagazineArticleBody } from "@/components/storefront/magazine/MagazineArticleBody";
import { MagazineArticleJsonLd } from "@/components/storefront/magazine/MagazineArticleJsonLd";
import { MagazineArticleShare } from "@/components/storefront/magazine/MagazineArticleShare";
import { SmartTieInStrip } from "@/components/storefront/magazine/SmartTieInStrip";
import { BlogViewTracker } from "@/components/storefront/magazine/BlogViewTracker";
import { NewsletterBox } from "@/components/storefront/magazine/NewsletterBox";
import { ShopTheStorySection } from "@/components/storefront/magazine/ShopTheStorySection";
import { getSiteOrigin } from "@/lib/get-url";

const inter = Inter({ subsets: ["latin"], variable: "--font-magazine" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-magazine-serif" });

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

  const siteUrl = getSiteOrigin();
  const base = siteUrl;
  const contentHtml = tiptapJsonToHtml(post.content);
  const description = post.excerpt?.trim()
    ? truncateMetaDescription(post.excerpt.trim())
    : articleMetaDescription(null, contentHtml);

  const rawImage = post.featured_image?.trim();
  const ogImageUrl = rawImage ? resolveAbsoluteUrl(siteUrl, rawImage) : defaultOgImageUrl(siteUrl);
  const pageUrl = `${base}/blog/${post.slug}`;

  return {
    metadataBase: new URL(base),
    title: {
      absolute: `${post.title} | Tommy Smile Seed Magazine`,
    },
    description,
    authors: [{ name: "Smile Seed Bank Editorial" }],
    openGraph: {
      title: post.title,
      description,
      locale: "th_TH",
      type: "article",
      url: pageUrl,
      siteName: "Tommy Smile Seed Magazine",
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      authors: ["Smile Seed Bank Editorial"],
      images: [
        {
          url: ogImageUrl,
          alt: post.title,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
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

  const rawHtml = tiptapJsonToHtml(post.content);
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
  const metaDesc = articleMetaDescription(post.excerpt, rawHtml);
  const rawFeatured = post.featured_image?.trim();
  const jsonLdImage = rawFeatured
    ? resolveAbsoluteUrl(siteUrl, rawFeatured)
    : defaultOgImageUrl(siteUrl);

  return (
    <div
      className={`min-h-screen bg-white text-zinc-900 ${inter.variable} ${playfair.variable} font-sans antialiased`}
    >
      <MagazineArticleJsonLd
        title={post.title}
        description={metaDesc}
        imageUrls={[jsonLdImage]}
        datePublished={post.published_at ?? post.created_at}
        dateModified={post.updated_at}
        url={pageUrl}
      />
      <BlogViewTracker postId={post.id} />
      <article className="mx-auto max-w-3xl px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <nav
          className="mb-10 flex flex-wrap items-center gap-1 text-xs text-zinc-500"
          aria-label="Breadcrumb"
        >
          <Link href="/blog" className="transition hover:text-emerald-700">
            Magazine
          </Link>
          {post.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
              <Link
                href={`/blog?category=${encodeURIComponent(post.category.slug)}`}
                className="transition hover:text-emerald-700"
              >
                {post.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
          <span className="line-clamp-1 text-zinc-600">{post.title}</span>
        </nav>

        {post.category && (
          <span className="mb-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
            [{post.category.name}]
          </span>
        )}

        <h1 className="font-[family-name:var(--font-magazine-serif)] text-3xl font-bold leading-[1.7] tracking-tight text-emerald-950 sm:text-4xl md:text-5xl">
          {post.title}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-zinc-200 pb-8 text-sm text-zinc-600">
          <span>Smile Seed Bank Editorial</span>
          {post.published_at && (
            <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-zinc-400" aria-hidden />
            {readMin} min read
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-zinc-400" aria-hidden />
            {post.view_count.toLocaleString("th-TH")} views
          </span>
        </div>

        {post.featured_image && (
          <div className="relative -mx-4 mt-10 aspect-[16/10] min-h-[260px] overflow-hidden rounded-2xl border border-zinc-200 shadow-sm sm:mx-0 md:min-h-[400px] lg:min-h-[520px]">
            <Image
              src={post.featured_image}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 720px"
              priority
              placeholder="blur"
              blurDataURL={SHIMMER_BLUR_DATA_URL}
              unoptimized={!post.featured_image.includes("supabase.co")}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent" />
          </div>
        )}

        {post.excerpt && (
          <p className="mt-10 border-l-2 border-emerald-600/35 pl-5 text-lg leading-relaxed text-zinc-600">
            {post.excerpt}
          </p>
        )}

        <div className="mx-auto mt-12 max-w-[720px]">
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

        <ShopTheStorySection products={shopStoryProducts} />

        {related.length > 0 && (
          <section className="mx-auto mt-20 max-w-[720px] border-t border-zinc-200 pt-16">
            <h2 className="font-[family-name:var(--font-magazine-serif)] text-2xl font-semibold text-emerald-950">
              Read more
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/blog/${r.slug}`}
                    className="group block overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm transition hover:border-emerald-300/60 hover:shadow-md"
                  >
                    {r.featured_image && (
                      <div className="relative aspect-[16/10] w-full overflow-hidden">
                        <Image
                          src={r.featured_image}
                          alt=""
                          fill
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                          sizes="(max-width: 640px) 100vw, 50vw"
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL={SHIMMER_BLUR_DATA_URL}
                          unoptimized={!r.featured_image.includes("supabase.co")}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/15 to-transparent" />
                      </div>
                    )}
                    <div className="p-4">
                      {r.category && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                          {r.category.name}
                        </span>
                      )}
                      <p className="mt-2 line-clamp-2 font-[family-name:var(--font-magazine-serif)] text-base font-semibold text-zinc-900 group-hover:text-emerald-800">
                        {r.title}
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
          <MagazineArticleShare url={pageUrl} title={post.title} />
          <Link
            href="/blog"
            className="inline-flex text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
          >
            ← Back to Magazine
          </Link>
        </div>
      </article>
    </div>
  );
}
