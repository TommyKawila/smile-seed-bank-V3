"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { MagazinePostPublic } from "@/lib/blog-service";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";

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
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
    );
  }
  const unoptimized = !src.includes("supabase.co");
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
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
      <div className="relative aspect-[21/9] min-h-[280px] w-full overflow-hidden rounded-3xl border border-white/5 bg-zinc-950">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="font-[family-name:var(--font-magazine-serif)] text-2xl text-zinc-400">
            No highlights yet
          </p>
          <p className="max-w-md text-sm text-zinc-600">
            Publish posts and mark them as highlight in Admin to fill this carousel.
          </p>
        </div>
      </div>
    );
  }

  const current = slides[i]!;

  return (
    <div className="relative aspect-[21/9] min-h-[280px] w-full overflow-hidden rounded-3xl border border-white/5 bg-black shadow-2xl shadow-emerald-950/20">
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
            <HeroImage
              src={current.featured_image}
              alt={current.title}
              priority={i === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/15" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 md:p-12">
              {current.category && (
                <span className="mb-3 inline-flex w-fit rounded-full border border-emerald-500/35 bg-emerald-950/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/95">
                  [{current.category.name}]
                </span>
              )}
              <h2 className="font-[family-name:var(--font-magazine-serif)] text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl md:text-5xl lg:max-w-3xl">
                {current.title}
              </h2>
              <Link
                href={`/blog/${current.slug}`}
                className="mt-6 inline-flex w-fit items-center justify-center rounded-full border border-white/15 bg-white/10 px-6 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:border-emerald-400/45 hover:bg-emerald-950/50 hover:text-emerald-50 hover:shadow-[0_0_24px_-4px_rgba(16,185,129,0.35)]"
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
                idx === i ? "w-8 bg-emerald-500" : "w-2 bg-white/35 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
