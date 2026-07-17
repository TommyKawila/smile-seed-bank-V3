import Link from "next/link";
import type { MagazinePostPublic } from "@/lib/blog-service";
import type { MagLocale } from "@/lib/magazine-bilingual";
import { magazineDisplayTitle } from "@/lib/magazine-bilingual";
import { magazineCategoryDisplayTh } from "@/lib/blog-research-category";
import { cn } from "@/lib/utils";

const asideClass =
  "rounded-2xl border border-border bg-card/60 p-5 shadow-sm surface-glass";
const headingClass =
  "font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-primary";

export function MagazineTrending({
  posts,
  locale = "th",
}: {
  posts: MagazinePostPublic[];
  locale?: MagLocale;
}) {
  const heading = locale === "en" ? "Trending" : "กำลังมาแรง";

  if (posts.length === 0) {
    return (
      <aside className={asideClass}>
        <h3 className={cn(headingClass, "mb-4")}>{heading}</h3>
        <p className="text-sm text-muted-foreground">No trending posts yet.</p>
      </aside>
    );
  }

  const maxViews = Math.max(1, ...posts.map((p) => p.view_count));

  return (
    <aside className={asideClass}>
      <h3 className={cn(headingClass, "mb-6")}>{heading}</h3>
      <ol className="space-y-4">
        {posts.slice(0, 8).map((p) => {
          const pct = Math.max(6, Math.round((p.view_count / maxViews) * 100));
          return (
            <li key={p.id} className="group">
              <div className="mb-2 h-px w-full overflow-hidden rounded-full bg-muted/20">
                <div
                  className="h-full rounded-full bg-primary/70 transition-all group-hover:bg-primary"
                  style={{ width: `${pct}%` }}
                  title={`${p.view_count.toLocaleString()} views`}
                />
              </div>
              <div className="min-w-0">
                <Link
                  href={`/blog/${p.slug}`}
                  className="line-clamp-2 text-sm font-medium leading-snug text-foreground/85 transition group-hover:text-primary"
                >
                  {magazineDisplayTitle(p, locale)}
                </Link>
                <div className="mt-1 flex items-center justify-between gap-2">
                  {p.category && (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80">
                      {magazineCategoryDisplayTh(p.category)}
                    </span>
                  )}
                  <span
                    className="ml-auto text-[10px] font-medium tabular-nums text-foreground/45"
                    title="Views"
                  >
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
