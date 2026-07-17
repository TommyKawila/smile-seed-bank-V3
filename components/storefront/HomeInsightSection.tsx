"use client";

import Link from "next/link";
import Image from "next/image";
import Leaf from "lucide-react/dist/esm/icons/leaf";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import type { MagazinePostPublic } from "@/lib/blog-service";
import { magazineDisplayExcerpt, magazineDisplayTitle } from "@/lib/magazine-bilingual";
import { resolvePublicAssetUrl } from "@/lib/public-storage-url";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
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
  const href = `/blog/${post.slug}`;
  const readLabel = t(`อ่านบทความ: ${cardTitle}`, `Read article: ${cardTitle}`);

  return (
    <article className="overflow-hidden rounded-2xl surface-glass transition hover:border-primary/30">
      <Link
        href={href}
        className="group flex flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label={readLabel}
      >
        <div className="relative aspect-video min-h-[11rem] w-full overflow-hidden bg-muted/30">
          {img ? (
            <Image
              src={img}
              alt=""
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 1024px) 100vw, 33vw"
              loading="lazy"
              fetchPriority="low"
              placeholder="blur"
              blurDataURL={SHIMMER_BLUR_DATA_URL}
              unoptimized={shouldOffloadImageOptimization(img)}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted/40 to-muted/60">
              <Leaf className="h-10 w-10 text-muted-foreground" aria-hidden />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {post.category && (
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                {magazineCategoryLabel(post.category, locale)}
              </span>
            )}
            {research && <VerifiedResearchBadge />}
          </div>
          <h3 className="font-sans line-clamp-2 text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
            {cardTitle}
          </h3>
          {cardExcerpt && (
            <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{cardExcerpt}</p>
          )}
          <span className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white group-hover:bg-primary/90 sm:w-auto sm:self-start">
            {t("อ่านเพิ่มเติม", "Read article")}
          </span>
        </div>
      </Link>
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
    <section className="border-b border-border bg-background py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 space-y-2 text-center sm:mb-8 sm:space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            {t("ข้อมูลเชิงลึก", "Insights")}
          </p>
          <h2 className="font-sans text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {mainHeading}
          </h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {t("เทคนิคปลูกและพันธุกรรมที่คัดมาแล้ว", "Curated grow tips & genetics")}
          </p>
        </div>

        {loading ? (
          <div className="space-y-8">
            <div className="grid min-h-[320px] animate-pulse gap-0 overflow-hidden rounded-sm border border-border bg-muted/30 lg:grid-cols-2">
              <div className="hidden bg-muted/40 lg:block" />
              <div className="min-h-[220px] bg-muted/30 lg:min-h-0" />
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[280px] animate-pulse rounded-sm border border-border bg-muted/30"
                />
              ))}
            </div>
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            {t("ยังไม่มีบทความ", "No articles yet.")}{" "}
            <Link
              href="/blog"
              className="inline-flex min-h-11 min-w-[44px] items-center justify-center font-medium text-primary hover:underline"
            >
              {t("ไปที่คลังความรู้สายเขียว", "Visit the knowledge vault")}
            </Link>
          </p>
        ) : (
          <div className="space-y-10">
            {featured && (
              <article className="group overflow-hidden rounded-2xl surface-glass lg:grid lg:min-h-[min(28rem,70vh)] lg:grid-cols-2 lg:items-stretch lg:gap-0">
                <div className="order-1 flex flex-col justify-center px-6 py-8 sm:px-10 lg:order-1 lg:py-12 lg:pl-10 xl:pl-14">
                  <span className="mb-3 inline-flex w-fit rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                    {t("เกร็ดความรู้", "Knowledge")}
                  </span>
                  <h3 className="font-sans text-2xl font-bold leading-[1.25] tracking-tight text-foreground sm:text-3xl md:text-[1.65rem] md:leading-snug">
                    {featuredTitle}
                  </h3>
                  {featuredExcerpt && (
                    <p className="mt-5 line-clamp-5 text-sm font-light leading-relaxed text-muted-foreground sm:text-base">
                      {featuredExcerpt}
                    </p>
                  )}
                  <div className="mt-8">
                    <Button
                      asChild
                      size="lg"
                      className="min-h-11 rounded-sm bg-primary px-8 font-semibold text-white shadow-none hover:bg-primary/90"
                    >
                      <Link href={`/blog/${featured.slug}`}>{t("อ่านบทความ", "Read article")}</Link>
                    </Button>
                  </div>
                </div>
                <div
                  className="relative order-2 block min-h-[260px] w-full overflow-hidden bg-muted/40 lg:min-h-full"
                  aria-hidden
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
                    <div className="flex h-full min-h-[260px] items-center justify-center bg-gradient-to-br from-muted/40 to-muted/60">
                      <Leaf className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-900/10 via-transparent to-transparent" />
                </div>
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
