import Link from "next/link";
import type { MagazinePostPublic } from "@/lib/blog-service";
import { magazineCategoryDisplayTh } from "@/lib/blog-research-category";
import { cn } from "@/lib/utils";

const mono = "font-[family-name:var(--font-journal-mono)] tabular-nums";

export function MagazineTrending({ posts }: { posts: MagazinePostPublic[] }) {
  if (posts.length === 0) {
    return (
      <aside className="rounded-sm border border-[#f3f4f6] bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">
          Trending
        </h3>
        <p className="text-sm text-zinc-600">No trending posts yet.</p>
      </aside>
    );
  }

  const maxViews = Math.max(1, ...posts.map((p) => p.view_count));

  return (
    <aside className="rounded-sm border border-[#f3f4f6] bg-white p-5 shadow-sm">
      <h3 className="mb-6 text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">
        Trending
      </h3>
      <ol className="space-y-4">
        {posts.slice(0, 8).map((p) => {
          const pct = Math.max(6, Math.round((p.view_count / maxViews) * 100));
          return (
            <li key={p.id} className="group">
              <div className="mb-2 h-px w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-emerald-800/85 transition-all group-hover:bg-emerald-800"
                  style={{ width: `${pct}%` }}
                  title={`${p.view_count.toLocaleString()} views`}
                />
              </div>
              <div className="min-w-0">
                <Link
                  href={`/blog/${p.slug}`}
                  className="line-clamp-2 text-[13px] font-medium leading-snug tracking-tight text-zinc-800 transition group-hover:text-emerald-900"
                >
                  {p.title}
                </Link>
                <div className="mt-1 flex items-center justify-between gap-2">
                  {p.category && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-800/85">
                      {magazineCategoryDisplayTh(p.category)}
                    </span>
                  )}
                  <span className={cn(mono, "ml-auto text-[10px] text-zinc-400")} title="Views">
                    {p.view_count.toLocaleString()}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
