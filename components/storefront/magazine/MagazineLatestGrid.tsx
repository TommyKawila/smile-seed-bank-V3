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

const mono = "font-[family-name:var(--font-journal-mono)] tabular-nums";

function formatPostDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

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

function GlassTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        mono,
        "inline-flex items-center rounded-sm border border-white/50 bg-white/45 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-emerald-950 shadow-sm backdrop-blur-md",
        className
      )}
    >
      {children}
    </span>
  );
}

type CardVariant = "featured" | "compact" | "medium" | "standard";

function CardMetaFooter({
  publishedAt,
  readMin,
}: {
  publishedAt: string | null;
  readMin: number;
}) {
  return (
    <div
      className={cn(
        mono,
        "mt-auto flex flex-wrap items-center border-t border-zinc-100 pt-3 text-[11px] tracking-wide text-zinc-500"
      )}
    >
      <time dateTime={publishedAt ?? undefined}>{formatPostDate(publishedAt)}</time>
      <span className="mx-2 text-zinc-300" aria-hidden>
        ·
      </span>
      <span>{readMin} min read</span>
    </div>
  );
}

function RefTag({ children }: { children: ReactNode }) {
  return (
    <span
      className={cn(
        mono,
        "inline-flex w-fit rounded-sm border border-zinc-200/90 bg-zinc-100/90 px-2 py-0.5 text-[10px] font-medium tracking-wide text-zinc-600"
      )}
    >
      {children}
    </span>
  );
}

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
  const showRef = knowledge || research;

  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";
  const isMedium = variant === "medium";

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group flex h-full min-h-0 flex-col overflow-hidden rounded-sm border border-[#e8eaef] bg-white shadow-sm transition-shadow duration-300 hover:border-emerald-200/60 hover:shadow-lg"
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-t-sm bg-zinc-100",
          isFeatured && "min-h-[220px] flex-1 lg:min-h-[260px]",
          isCompact && "min-h-[130px] flex-1 basis-0 lg:min-h-[140px]",
          isMedium && "aspect-[16/10] min-h-[180px] shrink-0",
          variant === "standard" && "aspect-video shrink-0"
        )}
      >
        <CardImage src={post.featured_image} alt={post.title} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-900/50 via-transparent to-transparent opacity-80 transition group-hover:opacity-90" />
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end gap-2 p-3 sm:p-4">
          {post.category && <GlassTag>{post.category.name}</GlassTag>}
          {showRef && <RefTag>{refId}</RefTag>}
          {research && (
            <VerifiedResearchBadge className="border-white/40 bg-white/35 text-emerald-950 backdrop-blur-md" />
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-4 sm:p-5">
        <h3
          className={cn(
            "font-[family-name:var(--font-magazine-serif)] font-semibold leading-snug tracking-[-0.02em] text-zinc-900 group-hover:text-emerald-950",
            isFeatured && "text-xl sm:text-2xl lg:text-[1.65rem]",
            isCompact && "text-base sm:text-[1.05rem]",
            isMedium && "text-lg sm:text-xl",
            variant === "standard" && "text-base sm:text-lg"
          )}
        >
          {post.title}
        </h3>
        {post.excerpt && (
          <p
            className={cn(
              "line-clamp-3 text-sm font-light leading-relaxed text-zinc-600",
              isCompact && "line-clamp-2 text-[13px]",
              isMedium && "line-clamp-3"
            )}
          >
            {post.excerpt}
          </p>
        )}
        <CardMetaFooter publishedAt={post.published_at} readMin={readMin} />
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
      <div className="grid gap-8 lg:grid-cols-12 lg:items-stretch lg:gap-8">
        <div className="flex min-h-0 lg:col-span-7">
          <BentoPostCard post={featured!} variant="featured" />
        </div>
        <div className="flex min-h-0 lg:col-span-5">
          <BentoPostCard post={rest[0]!} variant="compact" />
        </div>
      </div>
    );
  }

  const compactA = rest[0];
  const compactB = rest[1];
  const afterBento = rest.slice(2);
  const mediumA = afterBento[0];
  const mediumB = afterBento[1];
  const standardRest = afterBento.slice(2);

  return (
    <div className="flex flex-col gap-12 lg:gap-16">
      {/* Row 1: 7/12 + 5/12 stacked — equal height on lg */}
      <div className="grid gap-8 lg:grid-cols-12 lg:items-stretch lg:gap-8">
        <div className="flex min-h-0 lg:col-span-7">
          <BentoPostCard post={featured!} variant="featured" />
        </div>
        <div className="flex min-h-0 flex-col gap-4 lg:col-span-5 lg:h-full lg:min-h-[320px]">
          {compactA && (
            <div className="flex min-h-0 flex-1 basis-0 flex-col">
              <BentoPostCard post={compactA} variant="compact" />
            </div>
          )}
          {compactB && (
            <div className="flex min-h-0 flex-1 basis-0 flex-col">
              <BentoPostCard post={compactB} variant="compact" />
            </div>
          )}
        </div>
      </div>

      {/* Row 2: two medium research-style cards */}
      {(mediumA || mediumB) && (
        <div className="grid gap-8 sm:grid-cols-2 lg:gap-10">
          {mediumA && (
            <div className="min-h-0">
              <BentoPostCard post={mediumA} variant="medium" />
            </div>
          )}
          {mediumB && (
            <div className="min-h-0">
              <BentoPostCard post={mediumB} variant="medium" />
            </div>
          )}
        </div>
      )}

      {/* Row 3+: standard 3-col */}
      {standardRest.length > 0 && (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {standardRest.map((p) => (
            <BentoPostCard key={p.id} post={p} variant="standard" />
          ))}
        </div>
      )}
    </div>
  );
}
