import type { AffiliatePublic, MagazineProductPublic } from "@/lib/blog-service";
import type { ArticleSegment } from "@/lib/magazine-article-segments";
import { AffiliateProductCard } from "./AffiliateProductCard";
import { MagazineProductStoryCard } from "./MagazineProductStoryCard";

const proseMagazine =
  "prose prose-invert prose-lg max-w-none prose-headings:font-[family-name:var(--font-magazine-serif)] prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-[1.75] prose-p:text-zinc-300 prose-li:text-zinc-300 prose-strong:text-white prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-emerald-500/40 prose-blockquote:text-zinc-400 prose-hr:border-white/10";

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
              className={proseMagazine}
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
