import Link from "next/link";
import type { MagazinePostPublic } from "@/lib/blog-service";

export function MagazineTrending({ posts }: { posts: MagazinePostPublic[] }) {
  if (posts.length === 0) {
    return (
      <aside className="rounded-sm border border-[#f3f4f6] bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">
          Trending
        </h3>
        <p className="text-sm text-zinc-600">No trending posts yet.</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-sm border border-[#f3f4f6] bg-white p-6 shadow-sm">
      <h3 className="mb-8 text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">
        Trending
      </h3>
      <ol className="space-y-6">
        {posts.slice(0, 8).map((p, idx) => (
          <li key={p.id} className="group flex gap-4">
            <span
              className="shrink-0 font-[family-name:var(--font-magazine-serif)] text-2xl font-bold tabular-nums text-emerald-800/15"
              aria-hidden
            >
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <Link
                href={`/blog/${p.slug}`}
                className="font-[family-name:var(--font-magazine-serif)] line-clamp-2 text-[15px] font-semibold leading-snug text-zinc-900 transition group-hover:text-emerald-900"
              >
                {p.title}
              </Link>
              {p.category && (
                <span className="mt-1.5 block text-[9px] font-bold uppercase tracking-widest text-emerald-800/90">
                  {p.category.name}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
