"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { MagazinePostPublic } from "@/lib/blog-service";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import { isResearchCategory } from "@/lib/blog-research-category";
import { VerifiedResearchBadge } from "@/components/storefront/magazine/VerifiedResearchBadge";

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
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 via-zinc-50 to-white" />
    );
  }
  const unoptimized = !src.includes("supabase.co");
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
      unoptimized={unoptimized}
    />
  );
}

export function MagazineHeroCarousel({ posts }: Props) {
  const slides = posts.length ? posts : [];
  const [i, setI] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="relative aspect-video min-h-[240px] w-full overflow-hidden rounded-sm border border-[#f3f4f6] bg-white shadow-sm">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="font-[family-name:var(--font-magazine-serif)] text-2xl text-zinc-600">
            No highlights yet
          </p>
          <p className="max-w-md text-sm text-zinc-500">
            Publish posts and mark them as highlight in Admin to fill this carousel.
          </p>
        </div>
      </div>
    );
  }

  const current = slides[i]!;
  const research = isResearchCategory(current.category);

  return (
    <div className="relative aspect-video min-h-[260px] w-full overflow-hidden rounded-sm border border-[#f3f4f6] bg-white shadow-sm transition-shadow hover:shadow-md">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55 }}
          className="absolute inset-0"
        >
          <div className="group relative h-full w-full">
            <div className="absolute inset-0 overflow-hidden rounded-sm">
              <HeroImage
                src={current.featured_image}
                alt={current.title}
                priority={i === 0}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/55 to-white/15" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 md:p-12">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                {current.category && (
                  <span className="inline-flex w-fit rounded-full border border-white/40 bg-white/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-950 shadow-sm backdrop-blur-md">
                    {current.category.name}
                  </span>
                )}
                {research && <VerifiedResearchBadge />}
              </div>
              <h2 className="font-[family-name:var(--font-magazine-serif)] text-3xl font-semibold leading-[1.15] tracking-tight text-zinc-900 sm:text-4xl md:text-5xl lg:max-w-3xl">
                {current.title}
              </h2>
              <Link
                href={`/blog/${current.slug}`}
                className="mt-6 inline-flex w-fit items-center justify-center rounded-sm bg-emerald-800 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900"
              >
                Read Article
              </Link>
            </div>
          </div>
        </motion.div>
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
                idx === i ? "w-8 bg-emerald-700" : "w-2 bg-zinc-300 hover:bg-zinc-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
