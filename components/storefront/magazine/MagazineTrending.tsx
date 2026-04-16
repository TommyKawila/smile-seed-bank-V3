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

  const maxViews = Math.max(1, ...posts.map((p) => p.view_count));

  return (
    <aside className="rounded-sm border border-[#f3f4f6] bg-white p-6 shadow-sm">
      <h3 className="mb-8 text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">
        Trending
      </h3>
      <ol className="space-y-5">
        {posts.slice(0, 8).map((p) => {
          const pct = Math.max(8, Math.round((p.view_count / maxViews) * 100));
          return (
            <li key={p.id} className="group flex gap-3">
              <div
                className="mt-1.5 flex w-7 shrink-0 flex-col justify-start pt-0.5"
                title={`${p.view_count.toLocaleString()} views`}
              >
                <div className="h-[3px] w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-700/90 to-emerald-600/80 transition-all group-hover:from-emerald-800 group-hover:to-emerald-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/blog/${p.slug}`}
                  className="line-clamp-2 text-[13px] font-medium leading-snug tracking-tight text-zinc-800 transition group-hover:text-emerald-900"
                >
                  {p.title}
                </Link>
                {p.category && (
                  <span className="mt-1 block text-[9px] font-semibold uppercase tracking-wider text-emerald-800/85">
                    {p.category.name}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
