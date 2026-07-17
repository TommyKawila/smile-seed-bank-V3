"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import type { MagazinePostPublic } from "@/lib/blog-service";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import { isResearchCategory, magazineCategoryDisplayTh } from "@/lib/blog-research-category";
import { useLanguage } from "@/context/LanguageContext";
import { magazineDisplayTitle } from "@/lib/magazine-bilingual";
import { VerifiedResearchBadge } from "@/components/storefront/magazine/VerifiedResearchBadge";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

type Props = { posts: MagazinePostPublic[] };

function HeroImage({
  src,
  alt,
  priority,
}: {
  src: string | null;
  alt: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-card to-background" />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
      sizes="(max-width: 1024px) 100vw, min(1280px, 100vw)"
      priority={priority}
      placeholder="blur"
      blurDataURL={SHIMMER_BLUR_DATA_URL}
      unoptimized={shouldOffloadImageOptimization(src)}
    />
  );
}

export function MagazineHeroCarousel({ posts }: Props) {
  const { t, locale } = useLanguage();
  const slides = posts.length ? posts : [];
  const [i, setI] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const intervalId = setInterval(() => setI((x) => (x + 1) % slides.length), 5000);
    return () => clearInterval(intervalId);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="relative aspect-video min-h-[240px] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="font-sans text-2xl text-muted-foreground">
            No highlights yet
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            Publish posts and mark them as highlight in Admin to fill this carousel.
          </p>
        </div>
      </div>
    );
  }

  const current = slides[i]!;
  const research = isResearchCategory(current.category);
  const heroTitle = magazineDisplayTitle(current, locale);

  return (
    <div className="relative aspect-video min-h-[260px] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <AnimatePresence mode="wait">
        <m.div
          key={current.id}
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55 }}
          className="absolute inset-0"
        >
          <div className="group relative h-full w-full">
            <div className="absolute inset-0 overflow-hidden">
              <HeroImage
                src={current.featured_image}
                alt={heroTitle}
                priority={i === 0}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/55 to-background/10" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 md:p-12">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                {current.category && (
                  <span className="inline-flex w-fit rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-primary backdrop-blur-sm">
                    {magazineCategoryDisplayTh(current.category)}
                  </span>
                )}
                {research && <VerifiedResearchBadge />}
              </div>
              <h2 className="font-sans text-2xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-3xl md:text-4xl lg:max-w-3xl">
                {heroTitle}
              </h2>
              <Link
                href={`/blog/${current.slug}`}
                className="mt-6 inline-flex min-h-11 w-fit items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                {t("อ่านบทความ", "Read article")}
              </Link>
            </div>
          </div>
        </m.div>
      </AnimatePresence>
      {slides.length > 1 && (
        <div className="absolute bottom-4 right-6 z-10 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Slide ${idx + 1}`}
              onClick={() => setI(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === i ? "w-8 bg-primary" : "w-2 bg-muted-foreground/40 hover:bg-primary/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
