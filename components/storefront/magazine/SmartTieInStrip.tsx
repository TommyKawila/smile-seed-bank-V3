import Image from "next/image";
import Link from "next/link";
import type { SmartProductPreview } from "@/lib/blog-service";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

export function SmartTieInStrip({ products }: { products: SmartProductPreview[] }) {
  if (products.length === 0) return null;

  return (
    <aside className="my-12 rounded-2xl border border-border bg-card/60 p-6 shadow-sm surface-glass">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h3 className="font-sans text-lg font-semibold text-foreground">
          Editor&apos;s pick
        </h3>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
          Related gear
        </span>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {products.map((p) => (
          <li key={p.id}>
            <Link
              href={p.slug ? `/product/${p.slug}` : "/shop"}
              className="group flex gap-4 rounded-xl border border-border bg-card p-3 shadow-sm transition hover:border-primary/30 hover:shadow-md"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted/30">
                {p.image_url ? (
                  <Image
                    src={p.image_url}
                    alt=""
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="80px"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL={SHIMMER_BLUR_DATA_URL}
                    unoptimized={shouldOffloadImageOptimization(p.image_url)}
                  />
                ) : (
                  <div className="h-full w-full bg-muted/40" />
                )}
              </div>
              <div className="min-w-0 flex-1 py-0.5">
                <p className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
                  {p.name}
                </p>
                {p.breeder_name && (
                  <p className="mt-1 truncate text-xs text-muted-foreground">{p.breeder_name}</p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
