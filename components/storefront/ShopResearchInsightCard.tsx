"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { MagazinePostPublic } from "@/lib/blog-service";
import { useLanguage } from "@/context/LanguageContext";
import { magazineDisplayExcerpt, magazineDisplayTitle } from "@/lib/magazine-bilingual";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

export function ShopResearchInsightCard({
  post,
  variants,
}: {
  post: MagazinePostPublic;
  variants?: import("framer-motion").Variants;
}) {
  const { locale } = useLanguage();
  const cardTitle = magazineDisplayTitle(post, locale);
  const cardExcerpt = magazineDisplayExcerpt(post, locale);
  return (
    <motion.article
      variants={variants}
      className="col-span-2 flex h-full min-h-0 flex-col font-sans"
    >
      <Link
        href={`/blog/${post.slug}`}
        className="flex h-full min-h-[160px] flex-col overflow-hidden rounded-sm border border-zinc-200/90 bg-white p-5 font-sans shadow-sm transition-colors hover:border-primary/30 hover:shadow-md sm:flex-row sm:gap-6 sm:p-6"
      >
        {post.featured_image && (
          <div className="relative mb-4 aspect-[16/10] w-full shrink-0 overflow-hidden rounded-sm bg-zinc-50 sm:mb-0 sm:aspect-auto sm:h-[120px] sm:w-[160px]">
            <Image
              src={post.featured_image}
              alt=""
              fill
              className="object-cover"
              sizes="160px"
              unoptimized={shouldOffloadImageOptimization(post.featured_image)}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-medium uppercase tracking-[0.26em] text-zinc-400">
            RESEARCH_INSIGHT
          </p>
          <h3 className="mt-2 text-lg font-bold leading-snug tracking-tight text-zinc-900 sm:text-xl">
            {cardTitle}
          </h3>
          {cardExcerpt && (
            <p className="mt-2 line-clamp-2 text-sm font-normal leading-relaxed text-zinc-600">
              {cardExcerpt}
            </p>
          )}
          <span className="mt-3 inline-block text-[11px] font-medium tabular-nums text-primary">
            Smile Seed Blog →
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
