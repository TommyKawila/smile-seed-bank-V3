import type { AffiliatePublic, MagazineProductPublic } from "@/lib/blog-service";
import type { ArticleSegment } from "@/lib/magazine-article-segments";
import { AffiliateProductCard } from "./AffiliateProductCard";
import { MagazineProductStoryCard } from "./MagazineProductStoryCard";

/** TipTap HTML — quiet zinc prose for magazine articles. */
const magazineArticleHtml =
  "max-w-none text-base leading-relaxed text-zinc-400 sm:text-[1.0625rem] " +
  "[&_p]:mb-6 [&_p:last-child]:mb-0 [&_p]:leading-relaxed " +
  "[&_h1]:mb-5 [&_h1]:mt-16 [&_h1]:font-sans [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-zinc-100 " +
  "[&_h2]:mb-4 [&_h2]:mt-14 [&_h2]:font-sans [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-zinc-100 " +
  "[&_h3]:mb-3 [&_h3]:mt-12 [&_h3]:font-sans [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:text-zinc-100 " +
  "[&_h4]:mb-2 [&_h4]:mt-8 [&_h4]:font-sans [&_h4]:font-semibold [&_h4]:text-zinc-200 " +
  "[&_ul]:my-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:pl-6 " +
  "[&_li]:mb-2 [&_li]:leading-relaxed [&_li]:text-zinc-400 [&_li]:marker:text-zinc-600 " +
  "[&_blockquote]:my-8 [&_blockquote]:rounded-xl [&_blockquote]:border [&_blockquote]:border-border/60 [&_blockquote]:bg-zinc-950/40 [&_blockquote]:py-4 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-zinc-400 " +
  "[&_strong]:font-semibold [&_strong]:text-zinc-200 [&_b]:font-semibold [&_b]:text-zinc-200 " +
  "[&_a]:text-emerald-400/90 [&_a]:no-underline hover:[&_a]:underline " +
  "[&_hr]:my-10 [&_hr]:border-border/60 " +
  "[&_code]:rounded [&_code]:bg-zinc-900/50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_code]:text-zinc-300 " +
  "magazine-article-emoji";

export function MagazineArticleBody({
  segments,
  affiliateMap,
  productMap,
}: {
  segments: ArticleSegment[];
  affiliateMap: Map<number, AffiliatePublic>;
  productMap?: Map<number, MagazineProductPublic>;
}) {
  return (
    <div className="space-y-0">
      {segments.map((s, i) => {
        if (s.kind === "html") {
          if (!s.html.trim()) return null;
          return (
            <div
              key={i}
              className={magazineArticleHtml}
              dangerouslySetInnerHTML={{ __html: s.html }}
            />
          );
        }
        if (s.kind === "affiliateId") {
          const a = affiliateMap.get(s.id);
          return a ? <AffiliateProductCard key={i} affiliate={a} /> : null;
        }
        if (s.kind === "productId") {
          const p = productMap?.get(s.id);
          return p ? <MagazineProductStoryCard key={i} product={p} variant="inline" /> : null;
        }
        return (
          <AffiliateProductCard
            key={i}
            inline={{ title: s.title, platform: s.platform, url: s.url }}
          />
        );
      })}
    </div>
  );
}
