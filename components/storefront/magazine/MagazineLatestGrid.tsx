import Image from "next/image";
import Link from "next/link";
import type { MagazinePostPublic } from "@/lib/blog-service";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";

function CardImage({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-zinc-200 transition-transform duration-500 group-hover:scale-[1.02]" />
    );
  }
  const unoptimized = !src.includes("supabase.co");
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
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
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-20 text-center text-zinc-500">
        No articles to show yet.
      </div>
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p) => (
        <Link
          key={p.id}
          href={`/blog/${p.slug}`}
          className="group block overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
        >
          <div className="relative aspect-[16/10] overflow-hidden">
            <CardImage src={p.featured_image} alt={p.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/25 via-transparent to-transparent opacity-90" />
          </div>
          <div className="space-y-2 p-5">
            {p.category && (
              <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                {p.category.name}
              </span>
            )}
            <h3 className="font-[family-name:var(--font-magazine-serif)] text-lg font-bold leading-snug text-zinc-900 group-hover:text-emerald-900">
              {p.title}
            </h3>
            {p.excerpt && (
              <p className="line-clamp-2 text-sm text-zinc-600">{p.excerpt}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
