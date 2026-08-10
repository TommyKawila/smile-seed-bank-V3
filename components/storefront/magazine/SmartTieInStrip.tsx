import Image from "next/image";
import Link from "next/link";
import type { SmartProductPreview } from "@/lib/blog-service";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

export function SmartTieInStrip({ products }: { products: SmartProductPreview[] }) {
  if (products.length === 0) return null;

  return (
    <aside className="my-12 rounded-xl border border-border/60 bg-zinc-950/40 p-6">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h3 className="font-sans text-lg font-semibold text-zinc-100">
          Editor&apos;s pick
        </h3>
        <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Related gear
        </span>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {products.map((p) => (
          <li key={p.id}>
            <Link
              href={p.slug ? `/product/${p.slug}` : "/shop"}
              className="group flex gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 transition hover:border-zinc-700 hover:bg-zinc-900/70"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-900/50">
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
                <p className="line-clamp-2 text-sm font-semibold text-zinc-200 group-hover:text-zinc-100">
                  {p.name}
                </p>
                {p.breeder_name && (
                  <p className="mt-1 truncate text-xs text-zinc-500">{p.breeder_name}</p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
