import type { AffiliatePublic, MagazineProductPublic } from "@/lib/blog-service";
import type { ArticleSegment } from "@/lib/magazine-article-segments";
import { AffiliateProductCard } from "./AffiliateProductCard";
import { MagazineProductStoryCard } from "./MagazineProductStoryCard";

/** TipTap HTML — explicit rhythm (no @tailwindcss/typography in project). */
const magazineArticleHtml =
  "max-w-none text-lg leading-[1.75] text-zinc-300 " +
  "[&_p]:mb-6 [&_p:last-child]:mb-0 [&_p]:leading-[1.75] " +
  "[&_h1]:mb-4 [&_h1]:mt-12 [&_h1]:font-[family-name:var(--font-magazine-serif)] [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-white " +
  "[&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:font-[family-name:var(--font-magazine-serif)] [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-white " +
  "[&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:font-[family-name:var(--font-magazine-serif)] [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:text-white " +
  "[&_h4]:mb-2 [&_h4]:mt-6 [&_h4]:font-semibold [&_h4]:text-zinc-100 " +
  "[&_ul]:my-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:pl-6 " +
  "[&_li]:mb-2 [&_li]:text-zinc-300 [&_li]:marker:text-emerald-500/70 " +
  "[&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-emerald-500/40 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-400 " +
  "[&_strong]:font-semibold [&_strong]:text-white " +
  "[&_a]:text-emerald-400 [&_a]:no-underline hover:[&_a]:underline " +
  "[&_hr]:my-8 [&_hr]:border-white/10 " +
  "[&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_code]:text-emerald-100 " +
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
