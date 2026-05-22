"use client";

import Link from "next/link";
import Image from "next/image";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import Leaf from "lucide-react/dist/esm/icons/leaf";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import type { MagazinePostPublic } from "@/lib/blog-service";
import { magazineDisplayExcerpt, magazineDisplayTitle } from "@/lib/magazine-bilingual";
import { resolvePublicAssetUrl } from "@/lib/public-storage-url";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { BlogHeroSlogan } from "@/components/storefront/magazine/BlogHeroSlogan";
import { VerifiedResearchBadge } from "@/components/storefront/magazine/VerifiedResearchBadge";
import { isResearchCategory } from "@/lib/blog-research-category";
import { magazineCategoryLabel } from "@/lib/blog-category-labels";
import {
  resolveSectionHeading,
  type SectionTitle,
} from "@/lib/homepage-section-title";

function InsightGridCard({ post }: { post: MagazinePostPublic }) {
  const { t, locale } = useLanguage();
  const img = resolvePublicAssetUrl(post.featured_image);
  const research = isResearchCategory(post.category);
  const cardTitle = magazineDisplayTitle(post, locale);
  const cardExcerpt = magazineDisplayExcerpt(post, locale);
  return (
    <article className="flex flex-col overflow-hidden rounded-sm border border-[#f3f4f6] bg-white shadow-sm transition hover:shadow-lg">
      <Link
        href={`/blog/${post.slug}`}
        className="relative block aspect-video min-h-[11rem] w-full overflow-hidden bg-zinc-100"
        aria-label={t(`อ่านบทความ: ${cardTitle}`, `Read article: ${cardTitle}`)}
      >
        {img ? (
          <Image
            src={img}
            alt=""
            fill
            className="object-cover transition duration-500 hover:scale-[1.02]"
            sizes="(max-width: 1024px) 100vw, 33vw"
            loading="lazy"
            fetchPriority="low"
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR_DATA_URL}
            unoptimized={shouldOffloadImageOptimization(img)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
            <Leaf className="h-10 w-10 text-zinc-300" />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {post.category && (
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-900">
              {magazineCategoryLabel(post.category, locale)}
            </span>
          )}
          {research && <VerifiedResearchBadge />}
        </div>
        <h3 className="font-sans line-clamp-2 text-lg font-semibold leading-snug text-zinc-900">
          <Link href={`/blog/${post.slug}`} className="hover:text-emerald-900">
            {cardTitle}
          </Link>
        </h3>
        {cardExcerpt && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm text-zinc-600">{cardExcerpt}</p>
        )}
        <Button
          asChild
          className="mt-4 min-h-11 w-full bg-emerald-800 font-semibold text-white hover:bg-emerald-900 sm:w-auto"
        >
          <Link href={`/blog/${post.slug}`}>{t("อ่านเพิ่มเติม", "Read article")}</Link>
        </Button>
      </div>
    </article>
  );
}

export function HomeInsightSection({
  posts,
  loading,
  sectionTitle,
}: {
  posts: MagazinePostPublic[];
  loading: boolean;
  sectionTitle?: SectionTitle;
}) {
  const { t, locale } = useLanguage();
  const featured = posts[0];
  const rest = posts.slice(1);
  const featuredTitle = featured ? magazineDisplayTitle(featured, locale) : "";
  const featuredExcerpt = featured ? magazineDisplayExcerpt(featured, locale) : null;
  const featuredImg = featured ? resolvePublicAssetUrl(featured.featured_image) : null;
  const mainHeading = resolveSectionHeading(
    locale,
    sectionTitle,
    "คลังความรู้สายเขียว",
    "Green knowledge vault"
  );

  return (
    <section className="border-b border-zinc-100 bg-white pt-20 pb-14 sm:pt-24 sm:pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 space-y-4 text-center sm:mb-12">
          <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-emerald-800">
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            {t("ข้อมูลเชิงลึก", "Insights")}
          </span>
          <h2 className="font-sans text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">
            {mainHeading}
          </h2>
          <BlogHeroSlogan />
          <p className="mx-auto mt-1 max-w-2xl text-sm text-zinc-600">
            {t(
              "สรุปล่าสุดจาก Smile Seed Blog — อ่านต่อเพื่อเพิ่มความแม่นยำในการปลูก",
              "Latest from Smile Seed Blog — precision growing, distilled."
            )}
          </p>
        </div>

        {loading ? (
          <div className="space-y-8">
            <div className="grid min-h-[320px] animate-pulse gap-0 overflow-hidden rounded-sm border border-zinc-100 bg-zinc-100 lg:grid-cols-2">
              <div className="hidden bg-zinc-200 lg:block" />
              <div className="min-h-[220px] bg-zinc-100 lg:min-h-0" />
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[280px] animate-pulse rounded-sm border border-[#f3f4f6] bg-zinc-50"
                />
              ))}
            </div>
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            {t("ยังไม่มีบทความ", "No articles yet.")}{" "}
            <Link
              href="/blog"
              className="inline-flex min-h-11 min-w-[44px] items-center justify-center font-medium text-emerald-800 hover:underline"
            >
              {t("ไปที่คลังความรู้สายเขียว", "Visit the knowledge vault")}
            </Link>
          </p>
        ) : (
          <div className="space-y-10">
            {featured && (
              <article className="group overflow-hidden rounded-sm border border-zinc-200/90 bg-zinc-50 shadow-[0_2px_28px_-6px_rgba(6,78,59,0.12)] lg:grid lg:min-h-[min(28rem,70vh)] lg:grid-cols-2 lg:items-stretch lg:gap-0">
                <div className="order-1 flex flex-col justify-center border-zinc-100 px-6 py-10 sm:px-10 lg:order-1 lg:border-r lg:py-14 lg:pl-10 xl:pl-14">
                  <span className="mb-4 inline-flex w-fit rounded-full border border-emerald-200/90 bg-white/80 px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
                    {t("เกร็ดความรู้", "Knowledge")}
                  </span>
                  <h3 className="font-sans text-2xl font-bold leading-[1.25] tracking-tight text-emerald-800 sm:text-3xl md:text-[1.65rem] md:leading-snug">
                    {featuredTitle}
                  </h3>
                  {featuredExcerpt && (
                    <p className="mt-5 line-clamp-5 text-sm font-light leading-relaxed text-zinc-600 sm:text-base">
                      {featuredExcerpt}
                    </p>
                  )}
                  <div className="mt-8">
                    <Button
                      asChild
                      size="lg"
                      className="min-h-11 rounded-sm bg-emerald-800 px-8 font-semibold text-white shadow-none hover:bg-emerald-900"
                    >
                      <Link href={`/blog/${featured.slug}`}>{t("อ่านบทความ", "Read article")}</Link>
                    </Button>
                  </div>
                </div>
                <Link
                  href={`/blog/${featured.slug}`}
                  className="relative order-2 block min-h-[260px] min-w-[44px] w-full overflow-hidden bg-zinc-200 lg:min-h-full"
                  aria-label={t(`อ่านบทความ: ${featuredTitle}`, `Read article: ${featuredTitle}`)}
                >
                  {featuredImg ? (
                    <Image
                      src={featuredImg}
                      alt=""
                      fill
                      className="object-cover transition duration-700 group-hover:scale-[1.03]"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      loading="lazy"
                      fetchPriority="low"
                      placeholder="blur"
                      blurDataURL={SHIMMER_BLUR_DATA_URL}
                      unoptimized={shouldOffloadImageOptimization(featuredImg)}
                    />
                  ) : (
                    <div className="flex h-full min-h-[260px] items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
                      <Leaf className="h-16 w-16 text-zinc-300" />
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-900/10 via-transparent to-transparent" />
                </Link>
              </article>
            )}

            {rest.length > 0 && (
              <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3 lg:gap-10">
                {rest.map((p) => (
                  <InsightGridCard key={p.id} post={p} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
