import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { MagazinePostPublic } from "@/lib/blog-service";
import type { MagLocale } from "@/lib/magazine-bilingual";
import { magazineDisplayExcerpt, magazineDisplayTitle } from "@/lib/magazine-bilingual";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import {
  isKnowledgeCategory,
  isResearchCategory,
  formatResearchRefId,
} from "@/lib/blog-research-category";
import { estimateReadingMinutesFromExcerpt } from "@/lib/blog-reading-time";
import { VerifiedResearchBadge } from "@/components/storefront/magazine/VerifiedResearchBadge";
import { cn } from "@/lib/utils";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { magazineCategoryLabel } from "@/lib/blog-category-labels";

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
          "absolute inset-0 bg-gradient-to-br from-muted/50 via-card to-background",
          className
        )}
      />
    );
  }
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
      unoptimized={shouldOffloadImageOptimization(src)}
    />
  );
}

function CategoryTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-primary backdrop-blur-sm">
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
    <div className="mt-auto flex flex-wrap items-center border-t border-border pt-3 font-sans text-xs text-foreground/50">
      <time dateTime={publishedAt ?? undefined}>{formatPostDate(publishedAt)}</time>
      <span className="mx-2 text-foreground/25" aria-hidden>
        ·
      </span>
      <span>{readMin} min read</span>
    </div>
  );
}

function RefTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex w-fit rounded-md border border-border bg-background/70 px-2 py-0.5 font-sans text-[10px] font-medium tracking-wide text-foreground/70 backdrop-blur-sm">
      {children}
    </span>
  );
}

function BentoPostCard({
  post,
  variant,
  locale,
}: {
  post: MagazinePostPublic;
  variant: CardVariant;
  locale: MagLocale;
}) {
  const research = isResearchCategory(post.category);
  const knowledge = isKnowledgeCategory(post.category);
  const cardTitle = magazineDisplayTitle(post, locale);
  const cardExcerpt = magazineDisplayExcerpt(post, locale);
  const readMin = estimateReadingMinutesFromExcerpt(cardTitle, cardExcerpt);
  const refId = formatResearchRefId(post.id, post.published_at);
  const showRef = knowledge || research;

  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";
  const isMedium = variant === "medium";

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card/60 shadow-sm surface-glass transition-shadow duration-300 hover:border-primary/30 hover:shadow-md"
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-t-2xl bg-muted/30",
          isFeatured && "min-h-[220px] flex-1 lg:min-h-[260px]",
          isCompact && "min-h-[130px] flex-1 basis-0 lg:min-h-[140px]",
          isMedium && "aspect-[16/10] min-h-[180px] shrink-0",
          variant === "standard" && "aspect-video shrink-0"
        )}
      >
        <CardImage src={post.featured_image} alt={cardTitle} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-90 transition group-hover:opacity-100" />
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end gap-2 p-3 sm:p-4">
          {post.category && (
            <CategoryTag>{magazineCategoryLabel(post.category, locale)}</CategoryTag>
          )}
          {showRef && <RefTag>{refId}</RefTag>}
          {research && <VerifiedResearchBadge />}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-4 sm:p-5">
        <h3
          className={cn(
            "font-sans font-semibold leading-snug tracking-tight text-foreground group-hover:text-primary",
            isFeatured && "text-xl sm:text-2xl lg:text-[1.65rem]",
            isCompact && "text-base sm:text-[1.05rem]",
            isMedium && "text-lg sm:text-xl",
            variant === "standard" && "text-base sm:text-lg"
          )}
        >
          {cardTitle}
        </h3>
        {cardExcerpt && (
          <p
            className={cn(
              "line-clamp-3 text-sm leading-relaxed text-foreground/65",
              isCompact && "line-clamp-2 text-[13px]",
              isMedium && "line-clamp-3"
            )}
          >
            {cardExcerpt}
          </p>
        )}
        <CardMetaFooter publishedAt={post.published_at} readMin={readMin} />
      </div>
    </Link>
  );
}

export function MagazineLatestGrid({
  posts,
  locale = "th",
}: {
  posts: MagazinePostPublic[];
  locale?: MagLocale;
}) {
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/60 py-20 text-center text-muted-foreground">
        ยังไม่มีบทความในขณะนี้
      </div>
    );
  }

  if (posts.length === 1) {
    return (
      <div className="max-w-4xl">
        <BentoPostCard post={posts[0]!} variant="featured" locale={locale} />
      </div>
    );
  }

  const [featured, ...rest] = posts;

  if (posts.length === 2) {
    return (
      <div className="grid gap-8 lg:grid-cols-12 lg:items-stretch lg:gap-8">
        <div className="flex min-h-0 lg:col-span-7">
          <BentoPostCard post={featured!} variant="featured" locale={locale} />
        </div>
        <div className="flex min-h-0 lg:col-span-5">
          <BentoPostCard post={rest[0]!} variant="compact" locale={locale} />
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
          <BentoPostCard post={featured!} variant="featured" locale={locale} />
        </div>
        <div className="flex min-h-0 flex-col gap-4 lg:col-span-5 lg:h-full lg:min-h-[320px]">
          {compactA && (
            <div className="flex min-h-0 flex-1 basis-0 flex-col">
              <BentoPostCard post={compactA} variant="compact" locale={locale} />
            </div>
          )}
          {compactB && (
            <div className="flex min-h-0 flex-1 basis-0 flex-col">
              <BentoPostCard post={compactB} variant="compact" locale={locale} />
            </div>
          )}
        </div>
      </div>

      {/* Row 2: two medium research-style cards */}
      {(mediumA || mediumB) && (
        <div className="grid gap-8 sm:grid-cols-2 lg:gap-10">
          {mediumA && (
            <div className="min-h-0">
              <BentoPostCard post={mediumA} variant="medium" locale={locale} />
            </div>
          )}
          {mediumB && (
            <div className="min-h-0">
              <BentoPostCard post={mediumB} variant="medium" locale={locale} />
            </div>
          )}
        </div>
      )}

      {/* Row 3+: standard 3-col */}
      {standardRest.length > 0 && (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {standardRest.map((p) => (
            <BentoPostCard key={p.id} post={p} variant="standard" locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
