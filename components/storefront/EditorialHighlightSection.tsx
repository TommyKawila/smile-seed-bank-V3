"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Clock } from "lucide-react";
import type { MagazinePostPublic } from "@/lib/blog-service";
import { resolvePublicAssetUrl } from "@/lib/public-storage-url";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { useLanguage } from "@/context/LanguageContext";
import { magazineDisplayExcerpt, magazineDisplayTitle } from "@/lib/magazine-bilingual";
import { Button } from "@/components/ui/button";

function estimateReadingMinutes(excerpt: string | null, title: string): number {
  const raw = `${title} ${excerpt ?? ""}`.trim();
  const words = raw.split(/\s+/).filter(Boolean).length;
  if (words < 4) return 3;
  return Math.max(1, Math.min(20, Math.ceil(words / 200)));
}

function badgeLabel(post: MagazinePostPublic): string {
  const c = post.category?.name?.trim();
  if (c) return c.replace(/^#/, "");
  const t = post.tags?.find((x) => x.trim());
  return t?.replace(/^#/, "") ?? "Smile Seed Blog";
}

function HeroImage({ src, alt }: { src: string | null; alt: string }) {
  const resolved = resolvePublicAssetUrl(src);
  if (!resolved) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 via-zinc-50 to-white" />
    );
  }
  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      className="object-cover transition-transform duration-[1.1s] ease-out group-hover/main:scale-110"
      sizes="(max-width: 1024px) 100vw, 60vw"
      priority
      placeholder="blur"
      blurDataURL={SHIMMER_BLUR_DATA_URL}
      unoptimized={shouldOffloadImageOptimization(resolved)}
    />
  );
}

function ThumbImage({ src, alt }: { src: string | null; alt: string }) {
  const resolved = resolvePublicAssetUrl(src);
  if (!resolved) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-zinc-200 to-zinc-300" />
    );
  }
  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      className="object-cover transition-transform duration-[1.1s] ease-out group-hover/side:scale-110"
      sizes="120px"
      placeholder="blur"
      blurDataURL={SHIMMER_BLUR_DATA_URL}
      unoptimized={shouldOffloadImageOptimization(resolved)}
    />
  );
}

const sideListVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.11, delayChildren: 0.08 },
  },
};

const sideItemVariants = {
  hidden: { opacity: 0, x: 20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function EditorialHighlightSection() {
  const { t, locale } = useLanguage();
  const [posts, setPosts] = useState<MagazinePostPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/storefront/magazine/recent?take=4");
        const json = (await res.json()) as { posts?: MagazinePostPublic[] };
        if (!cancelled && res.ok && Array.isArray(json.posts)) {
          setPosts(json.posts);
        }
      } catch {
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="border-b border-zinc-100 bg-zinc-50/70 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 h-7 w-40 animate-pulse rounded bg-zinc-200" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
            <div className="lg:col-span-3">
              <div className="aspect-[4/5] animate-pulse rounded-2xl bg-zinc-200 sm:min-h-[420px] sm:aspect-auto" />
            </div>
            <div className="flex flex-col gap-4 lg:col-span-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-200" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) return null;

  const main = posts[0]!;
  const side = posts.slice(1, 4);
  const mainTitle = magazineDisplayTitle(main, locale);
  const mainExcerpt = magazineDisplayExcerpt(main, locale);
  const mainMins = estimateReadingMinutes(mainExcerpt, mainTitle);

  const headerBlock = (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {t("ความรู้ & เรื่องราว", "Knowledge & stories")}
        </p>
        <h2 className="mt-1 font-sans text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          {t("จาก Smile Seed Blog", "From Smile Seed Blog")}
        </h2>
      </div>
      <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1 text-primary hover:text-primary/90">
        <Link href="/blog">
          {t("อ่านทั้งหมด", "View all")}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );

  const mainCard = (
    <Link
      href={`/blog/${main.slug}`}
      className="group/main relative block min-h-[380px] overflow-hidden rounded-2xl sm:min-h-[440px]"
    >
      <HeroImage src={main.featured_image} alt={mainTitle} />
      <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/50 to-white/5" />
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
        <span className="mb-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
          #{badgeLabel(main)}
        </span>
        <motion.h3
          className="font-sans text-2xl font-bold leading-tight text-emerald-950 sm:text-3xl lg:text-[1.85rem] lg:leading-snug"
          whileHover={{ color: "rgb(5 46 22)" }}
          transition={{ duration: 0.35 }}
        >
          {mainTitle}
        </motion.h3>
        {mainExcerpt ? (
          <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{mainExcerpt}</p>
        ) : null}
        <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
          <Clock className="h-3.5 w-3.5 opacity-90" aria-hidden />
          {mainMins} {t("นาทีในการอ่าน", "min read")}
        </p>
      </div>
    </Link>
  );

  if (posts.length === 1) {
    return (
      <motion.section
        className="border-b border-zinc-100 bg-gradient-to-b from-zinc-50/90 to-white py-14 sm:py-16"
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-72px" }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {headerBlock}
          <div className="mx-auto max-w-4xl">{mainCard}</div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      className="border-b border-zinc-100 bg-gradient-to-b from-zinc-50/90 to-white py-14 sm:py-16"
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-72px" }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {headerBlock}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8 lg:items-stretch">
          {/* Main feature — 3/5 */}
          <div className="lg:col-span-3">
            {mainCard}
          </div>

          {/* Side list — 2/5 */}
          <motion.div
            className="flex flex-col gap-4 lg:col-span-2"
            variants={sideListVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
          >
            {side.map((post) => {
              const sideTitle = magazineDisplayTitle(post, locale);
              const sideExcerpt = magazineDisplayExcerpt(post, locale);
              const mins = estimateReadingMinutes(sideExcerpt, sideTitle);
              return (
                <motion.div key={post.id} variants={sideItemVariants}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group/side flex gap-4 overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-3 shadow-sm transition-shadow duration-300 hover:border-primary/25 hover:shadow-md"
                  >
                    <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                      <ThumbImage src={post.featured_image} alt={sideTitle} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-0.5">
                      <span className="inline-flex w-fit rounded-full border border-emerald-700/15 bg-emerald-700/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary backdrop-blur-sm">
                        #{badgeLabel(post)}
                      </span>
                      <motion.h4
                        className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900"
                        whileHover={{ color: "rgb(4 120 87)" }}
                        transition={{ duration: 0.3 }}
                      >
                        {sideTitle}
                      </motion.h4>
                      <p className="flex items-center gap-1 text-[11px] text-zinc-500">
                        <Clock className="h-3 w-3 shrink-0" aria-hidden />
                        {mins} {t("นาทีในการอ่าน", "min read")}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
