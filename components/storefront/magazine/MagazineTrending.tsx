import Link from "next/link";
import type { MagazinePostPublic } from "@/lib/blog-service";

export function MagazineTrending({ posts }: { posts: MagazinePostPublic[] }) {
  if (posts.length === 0) {
    return (
      <aside className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 backdrop-blur-sm">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Trending
        </h3>
        <p className="text-sm text-zinc-600">No trending posts yet.</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 backdrop-blur-sm">
      <h3 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
        Trending
      </h3>
      <ol className="space-y-5">
        {posts.slice(0, 8).map((p, idx) => (
          <li key={p.id} className="group flex gap-4">
            <span
              className="shrink-0 font-[family-name:var(--font-magazine-serif)] text-2xl font-bold tabular-nums text-amber-200/30 text-zinc-700"
              aria-hidden
            >
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <Link
                href={`/blog/${p.slug}`}
                className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-100 transition group-hover:text-emerald-400/95"
              >
                {p.title}
              </Link>
              {p.category && (
                <span className="mt-1 block text-[10px] font-medium uppercase tracking-wider text-emerald-600/85">
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
