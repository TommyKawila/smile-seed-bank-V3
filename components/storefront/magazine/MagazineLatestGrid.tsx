import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { MagazinePostPublic } from "@/lib/blog-service";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import {
  isKnowledgeCategory,
  isResearchCategory,
  formatResearchRefId,
} from "@/lib/blog-research-category";
import { estimateReadingMinutesFromExcerpt } from "@/lib/blog-reading-time";
import { VerifiedResearchBadge } from "@/components/storefront/magazine/VerifiedResearchBadge";
import { cn } from "@/lib/utils";

function CardImage({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  if (!src) {
    return (
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-100",
          className
        )}
      />
    );
  }
  const unoptimized = !src.includes("supabase.co");
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={cn("object-cover transition-transform duration-500 group-hover:scale-[1.02]", className)}
      sizes="(max-width: 1024px) 100vw, 50vw"
      loading="lazy"
      placeholder="blur"
      blurDataURL={SHIMMER_BLUR_DATA_URL}
      unoptimized={unoptimized}
    />
  );
}

function ReadTime({ minutes }: { minutes: number }) {
  return (
    <span className="font-[family-name:var(--font-journal-mono)] text-[11px] tabular-nums tracking-wide text-zinc-500">
      {minutes} min read
    </span>
  );
}

function GlassTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/40 bg-white/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-950 shadow-sm backdrop-blur-md",
        className
      )}
    >
      {children}
    </span>
  );
}

type CardVariant = "featured" | "compact" | "standard";

function BentoPostCard({
  post,
  variant,
}: {
  post: MagazinePostPublic;
  variant: CardVariant;
}) {
  const research = isResearchCategory(post.category);
  const knowledge = isKnowledgeCategory(post.category);
  const readMin = estimateReadingMinutesFromExcerpt(post.title, post.excerpt);
  const refId = formatResearchRefId(post.id, post.published_at);

  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-sm border border-[#e8eaef] bg-white shadow-sm transition-shadow duration-300 hover:border-emerald-200/60 hover:shadow-xl",
        isFeatured && "lg:min-h-[420px]",
        isCompact && "lg:flex-1"
      )}
    >
      <div
        className={cn(
          "relative w-full shrink-0 overflow-hidden rounded-t-sm bg-zinc-100",
          isFeatured && "min-h-[220px] lg:min-h-[300px]",
          isCompact && "aspect-[16/10] min-h-[140px]",
          variant === "standard" && "aspect-video"
        )}
      >
        <CardImage src={post.featured_image} alt={post.title} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-900/50 via-transparent to-transparent opacity-80 transition group-hover:opacity-90" />
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end gap-2 p-4">
          {post.category && <GlassTag>{post.category.name}</GlassTag>}
          {knowledge && (
            <span className="inline-flex items-center rounded-full border border-white/35 bg-white/35 px-2 py-0.5 font-[family-name:var(--font-journal-mono)] text-[9px] font-medium tabular-nums tracking-wide text-emerald-950 backdrop-blur-md">
              {refId}
            </span>
          )}
          {research && (
            <VerifiedResearchBadge className="border-white/40 bg-white/35 text-emerald-950 backdrop-blur-md" />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <h3
          className={cn(
            "font-[family-name:var(--font-magazine-serif)] font-semibold leading-snug tracking-[-0.02em] text-zinc-900 group-hover:text-emerald-950",
            isFeatured && "text-xl sm:text-2xl lg:text-[1.65rem]",
            (isCompact || variant === "standard") && "text-base sm:text-lg"
          )}
        >
          {post.title}
        </h3>
        {post.excerpt && (
          <p
            className={cn(
              "line-clamp-3 text-sm leading-relaxed text-zinc-600",
              isCompact && "line-clamp-2 text-[13px]"
            )}
          >
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-4">
          <ReadTime minutes={readMin} />
        </div>
      </div>
    </Link>
  );
}

export function MagazineLatestGrid({ posts }: { posts: MagazinePostPublic[] }) {
  if (posts.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-[#f3f4f6] bg-white py-20 text-center text-zinc-500">
        No articles to show yet.
      </div>
    );
  }

  if (posts.length === 1) {
    return (
      <div className="max-w-4xl">
        <BentoPostCard post={posts[0]!} variant="featured" />
      </div>
    );
  }

  const [featured, ...rest] = posts;

  if (posts.length === 2) {
    return (
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8">
          <BentoPostCard post={featured!} variant="featured" />
        </div>
        <div className="lg:col-span-4">
          <BentoPostCard post={rest[0]!} variant="compact" />
        </div>
      </div>
    );
  }

  const secondRow = rest.slice(2);

  return (
    <div className="flex flex-col gap-12 lg:gap-16">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-10 lg:items-stretch">
        <div className="lg:col-span-7">
          <BentoPostCard post={featured!} variant="featured" />
        </div>
        <div className="flex flex-col gap-10 lg:col-span-5">
          {rest[0] && <BentoPostCard post={rest[0]} variant="compact" />}
          {rest[1] && <BentoPostCard post={rest[1]} variant="compact" />}
        </div>
      </div>

      {secondRow.length > 0 && (
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          {secondRow.map((p) => (
            <BentoPostCard key={p.id} post={p} variant="standard" />
          ))}
        </div>
      )}
    </div>
  );
}
