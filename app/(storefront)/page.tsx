"use client";

/**
 * Storefront home — light premium shell; blog insights from `blog_posts` via
 * GET /api/storefront/magazine/recent. PromotionBanner + OfferManager live in `layout.tsx`.
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Playfair_Display } from "next/font/google";
import { ChevronRight, Leaf, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { BreederRibbon } from "@/components/storefront/BreederRibbon";
import { useLanguage } from "@/context/LanguageContext";
import { Hero } from "@/components/storefront/Hero";
import type { ProductWithBreeder } from "@/lib/supabase/types";
import { FeaturedProductsCarousel } from "@/components/storefront/FeaturedProductsCarousel";
import { ProductCard } from "@/components/storefront/ProductCard";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import type { MagazinePostPublic } from "@/lib/blog-service";
import { resolvePublicAssetUrl } from "@/lib/public-storage-url";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import { BlogHeroSlogan } from "@/components/storefront/magazine/BlogHeroSlogan";
import { VerifiedResearchBadge } from "@/components/storefront/magazine/VerifiedResearchBadge";
import { isResearchCategory } from "@/lib/blog-research-category";
import { magazineCategoryLabel } from "@/lib/blog-category-labels";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-home-serif" });

/** Homepage featured insight hero — editorial campaign headline (links to latest / pinned story via API order). */
const INSIGHT_FEATURED_HEADLINE_TH =
  "Auto vs. Photo vs. Fast Version: เลือกเมล็ดพันธุ์แบบไหนที่ใช่สำหรับพื้นที่ของคุณ? 🇹🇭";
const INSIGHT_FEATURED_HEADLINE_EN =
  "Auto vs. Photo vs. Fast Version: Which seed type fits your grow space?";

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function InsightGridCard({ post }: { post: MagazinePostPublic }) {
  const { t, locale } = useLanguage();
  const img = resolvePublicAssetUrl(post.featured_image);
  const research = isResearchCategory(post.category);
  return (
    <article className="flex flex-col overflow-hidden rounded-sm border border-[#f3f4f6] bg-white shadow-sm transition hover:shadow-lg">
      <Link href={`/blog/${post.slug}`} className="relative block aspect-video overflow-hidden bg-zinc-100">
        {img ? (
          <Image
            src={img}
            alt=""
            fill
            className="object-cover transition duration-500 hover:scale-[1.02]"
            sizes="(max-width: 1024px) 100vw, 33vw"
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR_DATA_URL}
            unoptimized={!img.includes("supabase.co")}
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
        <h3 className="font-[family-name:var(--font-home-serif)] line-clamp-2 text-lg font-semibold leading-snug text-zinc-900">
          <Link href={`/blog/${post.slug}`} className="hover:text-emerald-900">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm text-zinc-600">{post.excerpt}</p>
        )}
        <Button
          asChild
          className="mt-4 w-full bg-emerald-800 font-semibold text-white hover:bg-emerald-900 sm:w-auto"
        >
          <Link href={`/blog/${post.slug}`}>{t("อ่านเพิ่มเติม", "Read article")}</Link>
        </Button>
      </div>
    </article>
  );
}

function InsightSection({ posts, loading }: { posts: MagazinePostPublic[]; loading: boolean }) {
  const { t, locale } = useLanguage();
  const featured = posts[0];
  const rest = posts.slice(1);
  const featuredHeadline = locale === "en" ? INSIGHT_FEATURED_HEADLINE_EN : INSIGHT_FEATURED_HEADLINE_TH;
  const featuredImg = featured ? resolvePublicAssetUrl(featured.featured_image) : null;

  return (
    <section className="border-b border-zinc-100 bg-white pt-20 pb-14 sm:pt-24 sm:pb-16">
      <div className={`mx-auto max-w-7xl px-4 sm:px-6 ${playfair.variable}`}>
        <div className="mb-10 space-y-4 text-center sm:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-800">
            <BookOpen className="h-3.5 w-3.5" />
            {t("ข้อมูลเชิงลึก", "Insights")}
          </span>
          <h2 className="font-[family-name:var(--font-home-serif)] text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">
            {t("คลังความรู้สายเขียว", "Green knowledge vault")}
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
            <Link href="/blog" className="font-medium text-emerald-800 hover:underline">
              {t("ไปที่คลังความรู้สายเขียว", "Visit the knowledge vault")}
            </Link>
          </p>
        ) : (
          <div className="space-y-10">
            {featured && (
              <article className="group overflow-hidden rounded-sm border border-zinc-200/90 bg-zinc-50 shadow-[0_2px_28px_-6px_rgba(6,78,59,0.12)] lg:grid lg:min-h-[min(28rem,70vh)] lg:grid-cols-2 lg:items-stretch lg:gap-0">
                <div className="order-1 flex flex-col justify-center border-zinc-100 px-6 py-10 sm:px-10 lg:order-1 lg:border-r lg:py-14 lg:pl-10 xl:pl-14">
                  <span className="mb-4 inline-flex w-fit rounded-full border border-emerald-200/90 bg-white/80 px-3 py-1 font-[family-name:var(--font-home-serif)] text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
                    {t("เกร็ดความรู้", "Knowledge")}
                  </span>
                  <h3 className="font-[family-name:var(--font-home-serif)] text-2xl font-bold leading-[1.25] tracking-tight text-emerald-800 sm:text-3xl md:text-[1.65rem] md:leading-snug">
                    {featuredHeadline}
                  </h3>
                  {featured.excerpt && (
                    <p className="mt-5 line-clamp-5 text-sm font-light leading-relaxed text-zinc-600 sm:text-base">
                      {featured.excerpt}
                    </p>
                  )}
                  <div className="mt-8">
                    <Button
                      asChild
                      size="lg"
                      className="rounded-sm bg-emerald-800 px-8 font-semibold text-white shadow-none hover:bg-emerald-900"
                    >
                      <Link href={`/blog/${featured.slug}`}>{t("อ่านบทความ", "Read article")}</Link>
                    </Button>
                  </div>
                </div>
                <Link
                  href={`/blog/${featured.slug}`}
                  className="relative order-2 block min-h-[260px] w-full overflow-hidden bg-zinc-200 lg:min-h-full"
                  aria-label={t("อ่านบทความ", "Read article")}
                >
                  {featuredImg ? (
                    <Image
                      src={featuredImg}
                      alt=""
                      fill
                      className="object-cover transition duration-700 group-hover:scale-[1.03]"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                      placeholder="blur"
                      blurDataURL={SHIMMER_BLUR_DATA_URL}
                      unoptimized={!featuredImg.includes("supabase.co")}
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
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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

function HomePageMain() {
  const { products, isLoading } = useProducts({ limit: 8, autoFetch: true });
  const { t } = useLanguage();
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithBreeder[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [insights, setInsights] = useState<MagazinePostPublic[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/storefront/featured-products");
        const json = (await res.json()) as { products?: ProductWithBreeder[] };
        if (!cancelled && res.ok && Array.isArray(json.products)) {
          setFeaturedProducts(json.products);
        }
      } catch {
        if (!cancelled) setFeaturedProducts([]);
      } finally {
        if (!cancelled) setFeaturedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setInsightsLoading(true);
      try {
        const res = await fetch("/api/storefront/magazine/recent?take=4");
        const json = (await res.json()) as { posts?: MagazinePostPublic[] };
        if (!cancelled && res.ok && Array.isArray(json.posts)) {
          setInsights(json.posts);
        } else if (!cancelled) setInsights([]);
      } catch {
        if (!cancelled) setInsights([]);
      } finally {
        if (!cancelled) setInsightsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const features = [
    {
      label: t("คัดสรรคุณภาพ", "Quality Seeds"),
      sub: t("ผ่านการตรวจสอบทุกล็อต", "Every batch tested & verified"),
    },
    {
      label: t("จัดส่งรวดเร็ว", "Fast Shipping"),
      sub: t("แพ็กเกจมิดชิด ปลอดภัย", "Discreet & secure packaging"),
    },
    {
      label: t("สายพันธุ์หายาก", "Rare Strains"),
      sub: t("นำเข้าจาก Breeder ชั้นนำ", "Imported from top breeders"),
    },
  ];

  return (
    <div className="min-h-screen bg-white pt-20 text-zinc-900 sm:pt-28">
      <div className="bg-white pb-10 sm:pb-14">
        <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-6">
          <div className="overflow-hidden rounded-3xl border border-zinc-200 shadow-[0_24px_64px_-18px_rgba(21,128,61,0.12)] ring-1 ring-zinc-200/80">
            <Hero />
          </div>
        </div>
      </div>

      <InsightSection posts={insights} loading={insightsLoading} />

      <div className="bg-zinc-50/50">
        <FeaturedProductsCarousel products={featuredProducts} isLoading={featuredLoading} />
      </div>

      <section className="border-b border-zinc-100 bg-white py-12 sm:py-16">
        <div className={`mx-auto max-w-7xl px-4 sm:px-6 ${JOURNAL_PRODUCT_FONT_VARS}`}>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="mb-2 inline-flex items-center rounded-full border border-zinc-100 bg-zinc-50/50 px-3 py-1 font-[family-name:var(--font-journal-product-mono)] text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                {t("แบรนด์ชั้นนำ", "World-Class Breeders")}
              </span>
              <h2 className="font-[family-name:var(--font-journal-product-serif)] text-2xl font-medium leading-tight tracking-tight text-zinc-900 sm:text-3xl">
                {t(
                  "เลือกเมล็ดพันธุ์จากบรีดเดอร์ชั้นนำ",
                  "Choose seeds from leading breeders"
                )}
              </h2>
            </div>
            <Link
              href="/breeders"
              className="hidden items-center gap-1 text-sm font-semibold text-emerald-800 hover:underline sm:flex"
            >
              {t("ดูทั้งหมด", "View All")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <BreederRibbon />
          <div className="mt-6 flex justify-center sm:hidden">
            <Link href="/breeders">
              <Button variant="outline" size="sm" className="gap-1.5 border-emerald-200 text-emerald-900 hover:bg-emerald-50">
                {t("ดู Breeder ทั้งหมด", "View All Breeders")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-b border-zinc-100 bg-zinc-50/30">
        <div className={`mx-auto max-w-5xl ${JOURNAL_PRODUCT_FONT_VARS}`}>
          <div className="grid grid-cols-1 divide-y divide-zinc-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {features.map((f) => (
              <div key={f.label} className="px-6 py-6 sm:py-8">
                <p className="font-[family-name:var(--font-journal-product-serif)] text-base font-medium text-zinc-800">
                  {f.label}
                </p>
                <p className="mt-1.5 font-[family-name:var(--font-journal-product-mono)] text-xs font-normal leading-relaxed text-zinc-500">
                  {f.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`mx-auto max-w-7xl px-4 py-14 sm:px-6 ${JOURNAL_PRODUCT_FONT_VARS}`}>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
        >
          <motion.div variants={cardVariant} className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="font-[family-name:var(--font-journal-product-mono)] text-[11px] font-medium uppercase tracking-widest text-emerald-800">
                NEW ARRIVALS
              </p>
              <h2 className="font-[family-name:var(--font-journal-product-serif)] text-2xl font-medium leading-tight tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">
                {t("สายพันธุ์มาใหม่", "New Arrivals")}
              </h2>
              <p className="text-sm font-light leading-relaxed text-zinc-600">
                {t(
                  "สายพันธุ์ใหม่ล่าสุดในคลัง — อัปเดตตามการคัดเลือกอย่างต่อเนื่อง",
                  "Latest genetic entries in the Smile Seed Bank archive—refreshed as new strains land."
                )}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0 self-start text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 sm:self-end">
              <Link href="/shop?category=Seeds">
                {t("ไปที่คลังเมล็ดพันธุ์", "Seed vault")}{" "}
                <ChevronRight className="ml-0.5 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="overflow-hidden rounded-sm border border-zinc-50 shadow-sm">
                  <div className="aspect-square animate-pulse bg-zinc-100" />
                  <div className="space-y-2 p-4">
                    <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100" />
                    <div className="h-4 animate-pulse rounded bg-zinc-100" />
                    <div className="h-8 animate-pulse rounded bg-zinc-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Leaf className="h-10 w-10 text-zinc-300" />
              <p className="text-sm text-zinc-600">
                {t("กำลังเพิ่มสินค้าเร็วๆ นี้", "Products coming soon")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} variant="showcase" />
              ))}
            </div>
          )}
        </motion.div>
      </section>

      <section
        className={`mx-4 mb-14 overflow-hidden rounded-3xl border border-emerald-800/20 bg-emerald-800 sm:mx-6 ${JOURNAL_PRODUCT_FONT_VARS}`}
      >
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 px-6 py-10 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="font-[family-name:var(--font-journal-product-serif)] text-xl font-medium text-white sm:text-2xl">
              {t("สมัครสมาชิกฟรี", "Join Free")}
            </h3>
            <p className="mt-2 text-sm font-light leading-relaxed text-white/90">
              {t(
                "รับสิทธิพิเศษสำหรับสมาชิก และข่าวสารเทคนิคการปลูกจากงานวิจัยล่าสุด",
                "Member-exclusive benefits and the latest research-backed growing techniques"
              )}
            </p>
          </div>
          <Button
            asChild
            className="shrink-0 rounded-sm border-2 border-white bg-white px-6 py-2.5 text-sm font-semibold tracking-wide text-emerald-900 hover:bg-emerald-50"
          >
            <Link href="/profile">{t("สมัครสมาชิก", "Sign Up")}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 bg-white px-4 py-20">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-800" aria-hidden />
          <p className="text-sm text-zinc-600">Loading…</p>
        </div>
      }
    >
      <HomePageMain />
    </Suspense>
  );
}
