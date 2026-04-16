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
import { ChevronRight, Leaf, Zap, Shield, Package, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { BreederRibbon } from "@/components/storefront/BreederRibbon";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import { formatPrice } from "@/lib/utils";
import { productDetailHref } from "@/lib/product-utils";
import { shopBreederHref } from "@/lib/breeder-slug";
import { useLanguage } from "@/context/LanguageContext";
import { Hero } from "@/components/storefront/Hero";
import {
  labelForSeedTypeBadge,
  productCardFloweringChipLabel,
} from "@/lib/seed-type-filter";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import type { ProductWithBreeder } from "@/lib/supabase/types";
import { FeaturedProductsCarousel } from "@/components/storefront/FeaturedProductsCarousel";
import type { MagazinePostPublic } from "@/lib/blog-service";
import { resolvePublicAssetUrl } from "@/lib/public-storage-url";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import { BlogHeroSlogan } from "@/components/storefront/magazine/BlogHeroSlogan";
import { VerifiedResearchBadge } from "@/components/storefront/magazine/VerifiedResearchBadge";
import { isResearchCategory } from "@/lib/blog-research-category";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-home-serif" });

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function ProductCardV2({
  product,
}: {
  product: ReturnType<typeof useProducts>["products"][number];
}) {
  const { t } = useLanguage();
  const cardImage = getListingThumbnailUrl(product);
  const chip =
    "rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-800";
  const chipThc = `${chip} border-emerald-200 bg-emerald-50 text-emerald-900`;
  const floweringLabel = productCardFloweringChipLabel(product);
  const seedLabel = labelForSeedTypeBadge(product.seed_type);

  return (
    <motion.div
      variants={cardVariant}
      className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-100">
        {cardImage ? (
          <Image
            src={cardImage}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Leaf className="h-10 w-10 text-zinc-300" />
          </div>
        )}
        {product.breeders && (
          <Link
            href={shopBreederHref(product.breeders)}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-transform duration-200 hover:scale-110"
          >
            <BreederLogoImage
              src={product.breeders.logo_url}
              breederName={product.breeders.name}
              width={40}
              height={40}
              className="rounded-xl"
              imgClassName="object-contain p-1"
              sizes="40px"
            />
          </Link>
        )}
        {(product.stock ?? 0) <= 5 && (product.stock ?? 0) > 0 && (
          <span className="absolute left-2 top-2 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-800">
            {t("เหลือน้อย", "Low Stock")}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4 sm:p-4">
        {product.breeders && (
          <Link
            href={shopBreederHref(product.breeders)}
            onClick={(e) => e.stopPropagation()}
            className="mb-0.5 inline-block max-w-fit text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline"
          >
            {product.breeders.name}
          </Link>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900">
          {product.name}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {floweringLabel && <span className={chip}>{floweringLabel}</span>}
          {seedLabel && <span className={chip}>{seedLabel}</span>}
          {product.thc_percent != null && (
            <span className={chipThc}>THC {product.thc_percent}%</span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-base font-bold text-emerald-800">
            {(product.price ?? 0) > 0 ? `${formatPrice(product.price ?? 0)}+` : t("สอบถาม", "Inquire")}
          </span>
          <Button
            size="sm"
            className="h-8 bg-emerald-800 text-xs font-semibold text-white shadow-sm hover:bg-emerald-900"
            asChild
          >
            <Link href={productDetailHref(product)}>{t("ดูสินค้า", "View")}</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function InsightSection({ posts, loading }: { posts: MagazinePostPublic[]; loading: boolean }) {
  const { t } = useLanguage();

  return (
    <section className="border-b border-zinc-100 bg-white py-14 sm:py-16">
      <div className={`mx-auto max-w-7xl px-4 sm:px-6 ${playfair.variable}`}>
        <div className="mb-10 space-y-4 text-center sm:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-800">
            <BookOpen className="h-3.5 w-3.5" />
            {t("ข้อมูลเชิงลึก", "Insights")}
          </span>
          <h2 className="font-[family-name:var(--font-home-serif)] text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">
            Smile Seed Blog
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
          <div className="grid gap-8 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[280px] animate-pulse rounded-sm border border-[#f3f4f6] bg-zinc-50"
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            {t("ยังไม่มีบทความ", "No articles yet.")}{" "}
            <Link href="/blog" className="font-medium text-emerald-800 hover:underline">
              {t("ไปที่ Smile Seed Blog", "Visit Smile Seed Blog")}
            </Link>
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => {
              const img = resolvePublicAssetUrl(p.featured_image);
              const research = isResearchCategory(p.category);
              return (
                <article
                  key={p.id}
                  className="flex flex-col overflow-hidden rounded-sm border border-[#f3f4f6] bg-white shadow-sm transition hover:shadow-lg"
                >
                  <Link href={`/blog/${p.slug}`} className="relative block aspect-video overflow-hidden bg-zinc-100">
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
                      {p.category && (
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-900">
                          {p.category.name}
                        </span>
                      )}
                      {research && <VerifiedResearchBadge />}
                    </div>
                    <h3 className="font-[family-name:var(--font-home-serif)] line-clamp-2 text-lg font-semibold leading-snug text-zinc-900">
                      <Link href={`/blog/${p.slug}`} className="hover:text-emerald-900">
                        {p.title}
                      </Link>
                    </h3>
                    {p.excerpt && (
                      <p className="mt-2 line-clamp-3 flex-1 text-sm text-zinc-600">{p.excerpt}</p>
                    )}
                    <Button
                      asChild
                      className="mt-4 w-full bg-emerald-800 font-semibold text-white hover:bg-emerald-900 sm:w-auto"
                    >
                      <Link href={`/blog/${p.slug}`}>
                        {t("อ่านเพิ่มเติม", "Read article")}
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })}
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
        const res = await fetch("/api/storefront/magazine/recent?take=3");
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
      icon: Shield,
      label: t("คัดสรรคุณภาพ", "Quality Seeds"),
      sub: t("ผ่านการตรวจสอบทุกล็อต", "Every batch tested & verified"),
    },
    {
      icon: Package,
      label: t("จัดส่งรวดเร็ว", "Fast Shipping"),
      sub: t("แพ็กเกจมิดชิด ปลอดภัย", "Discreet & secure packaging"),
    },
    {
      icon: Zap,
      label: t("สายพันธุ์หายาก", "Rare Strains"),
      sub: t("นำเข้าจาก Breeder ชั้นนำ", "Imported from top breeders"),
    },
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8">
          <div className="overflow-hidden rounded-3xl border border-zinc-200 shadow-[0_24px_64px_-18px_rgba(21,128,61,0.14)] ring-1 ring-zinc-200/80">
            <Hero />
          </div>
        </div>
      </div>

      <InsightSection posts={insights} loading={insightsLoading} />

      <div className="bg-zinc-50/50">
        <FeaturedProductsCarousel products={featuredProducts} isLoading={featuredLoading} />
      </div>

      <section className="border-b border-zinc-100 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
                <Leaf className="h-3.5 w-3.5" />
                {t("แบรนด์ชั้นนำ", "World-Class Breeders")}
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-emerald-950 sm:text-3xl">
                {t("Breeders ที่เราคัดสรร", "Our Trusted Partners")}
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

      <section className="border-b border-zinc-100 bg-zinc-50">
        <div className="mx-auto grid max-w-5xl grid-cols-1 divide-y divide-zinc-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="flex items-center gap-3 px-6 py-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50">
                  <Icon className="h-5 w-5 text-emerald-800" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{f.label}</p>
                  <p className="text-xs text-zinc-600">{f.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
        >
          <motion.div variants={cardVariant} className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">
                {t("สินค้ายอดนิยม", "Popular")}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-emerald-950 sm:text-3xl">
                {t("สินค้าแนะนำ", "Bestsellers")}
              </h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900">
              <Link href="/shop">
                {t("ดูทั้งหมด", "View All")} <ChevronRight className="ml-0.5 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-zinc-200">
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
                <ProductCardV2 key={product.id} product={product} />
              ))}
            </div>
          )}
        </motion.div>
      </section>

      <section className="mx-4 mb-14 overflow-hidden rounded-3xl border border-emerald-800/20 bg-emerald-800 sm:mx-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 px-6 py-10 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="text-xl font-bold text-white sm:text-2xl">
              {t("สมัครสมาชิกฟรี", "Join Free")}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-white/90">
              {t(
                "รับสิทธิพิเศษสำหรับสมาชิก และข่าวสารเทคนิคการปลูกจากงานวิจัยล่าสุด",
                "Member-exclusive benefits and the latest research-backed growing techniques"
              )}
            </p>
          </div>
          <Button
            asChild
            className="shrink-0 border-2 border-white bg-white px-6 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
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
