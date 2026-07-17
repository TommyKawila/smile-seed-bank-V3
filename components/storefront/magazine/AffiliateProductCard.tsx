import Image from "next/image";
import Link from "next/link";
import type { AffiliatePublic } from "@/lib/blog-service";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

type Inline = { title: string; platform: string; url: string };

function buttonLabel(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes("shopee")) return "Buy on Shopee";
  if (p.includes("lazada")) return "View on Lazada";
  if (p.includes("amazon")) return "View on Amazon";
  return `Shop on ${platform}`;
}

export function AffiliateProductCard({
  affiliate,
  inline,
}: {
  affiliate?: AffiliatePublic;
  inline?: Inline;
}) {
  const title = affiliate?.title ?? inline?.title ?? "Link";
  const platform = affiliate?.platform_name ?? inline?.platform ?? "";
  const url = affiliate?.url ?? inline?.url ?? "#";
  const image = affiliate?.image_url ?? null;

  return (
    <aside className="my-10 overflow-hidden rounded-2xl border border-border bg-card/60 shadow-sm surface-glass">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-stretch sm:gap-6">
        <div className="relative mx-auto h-36 w-full shrink-0 overflow-hidden rounded-xl bg-muted/30 sm:h-auto sm:w-40">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              className="object-cover"
              sizes="160px"
              unoptimized={shouldOffloadImageOptimization(image)}
            />
          ) : (
            <div className="flex h-full min-h-[9rem] items-center justify-center bg-gradient-to-br from-muted/50 to-card text-xs text-muted-foreground">
              Curated pick
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            Recommended
          </p>
          <h3 className="font-sans text-lg font-semibold leading-snug text-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">{platform}</p>
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex w-fit items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            {buttonLabel(platform)}
          </Link>
        </div>
      </div>
    </aside>
  );
}
