import Image from "next/image";
import Link from "next/link";
import type { MagazinePostPublic } from "@/lib/blog-service";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import { isResearchCategory } from "@/lib/blog-research-category";
import { VerifiedResearchBadge } from "@/components/storefront/magazine/VerifiedResearchBadge";

function CardImage({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-zinc-100 transition-transform duration-500 group-hover:scale-[1.01]" />
    );
  }
  const unoptimized = !src.includes("supabase.co");
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      sizes="(max-width: 640px) 100vw, 33vw"
      loading="lazy"
      placeholder="blur"
      blurDataURL={SHIMMER_BLUR_DATA_URL}
      unoptimized={unoptimized}
    />
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

  return (
    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
      {posts.map((p) => {
        const research = isResearchCategory(p.category);
        return (
          <Link
            key={p.id}
            href={`/blog/${p.slug}`}
            className="group flex flex-col overflow-hidden rounded-sm border border-[#f3f4f6] bg-white shadow-none transition-shadow duration-300 hover:shadow-lg"
          >
            <div className="relative aspect-video overflow-hidden rounded-sm">
              <CardImage src={p.featured_image} alt={p.title} />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-6">
              <div className="flex flex-col gap-2">
                {p.category && (
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-900">
                    {p.category.name}
                  </span>
                )}
                {research && <VerifiedResearchBadge />}
              </div>
              <h3 className="font-[family-name:var(--font-magazine-serif)] text-xl font-semibold leading-snug tracking-tight text-zinc-900 group-hover:text-emerald-950">
                {p.title}
              </h3>
              {p.excerpt && (
                <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600">{p.excerpt}</p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
