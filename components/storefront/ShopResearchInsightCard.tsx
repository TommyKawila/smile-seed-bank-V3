"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import type { MagazinePostPublic } from "@/lib/blog-service";
import { useLanguage } from "@/context/LanguageContext";
import { magazineDisplayExcerpt, magazineDisplayTitle } from "@/lib/magazine-bilingual";
import { cn } from "@/lib/utils";

const serif = "font-[family-name:var(--font-journal-product-serif)]";
const mono = "font-[family-name:var(--font-journal-product-mono)]";

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
      className={cn("col-span-2", JOURNAL_PRODUCT_FONT_VARS)}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="flex min-h-[160px] flex-col overflow-hidden rounded-sm border border-zinc-200/90 bg-white p-5 shadow-sm transition-colors hover:border-primary/30 hover:shadow-md sm:flex-row sm:gap-6 sm:p-6"
      >
        {post.featured_image && (
          <div className="relative mb-4 aspect-[16/10] w-full shrink-0 overflow-hidden rounded-sm bg-zinc-50 sm:mb-0 sm:aspect-auto sm:h-[120px] sm:w-[160px]">
            <Image
              src={post.featured_image}
              alt=""
              fill
              className="object-cover"
              sizes="160px"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className={cn(mono, "text-[9px] font-medium uppercase tracking-[0.26em] text-zinc-400")}>
            RESEARCH_INSIGHT
          </p>
          <h3 className={cn(serif, "mt-2 text-lg font-medium leading-snug text-zinc-900 sm:text-xl")}>
            {cardTitle}
          </h3>
          {cardExcerpt && (
            <p className="mt-2 line-clamp-2 text-sm font-light leading-relaxed text-zinc-600">
              {cardExcerpt}
            </p>
          )}
          <span className={cn(mono, "mt-3 inline-block text-[11px] text-primary")}>
            Smile Seed Blog →
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
