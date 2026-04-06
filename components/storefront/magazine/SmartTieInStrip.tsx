import Image from "next/image";
import Link from "next/link";
import type { SmartProductPreview } from "@/lib/blog-service";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";

export function SmartTieInStrip({ products }: { products: SmartProductPreview[] }) {
  if (products.length === 0) return null;

  return (
    <aside className="my-12 rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-zinc-950/90 to-black/40 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h3 className="font-[family-name:var(--font-magazine-serif)] text-lg font-semibold text-white">
          Editor&apos;s pick
        </h3>
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-500/80">
          Related gear
        </span>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {products.map((p) => (
          <li key={p.id}>
            <Link
              href={p.slug ? `/product/${p.slug}` : "/shop"}
              className="group flex gap-4 rounded-xl border border-white/5 bg-zinc-950/50 p-3 transition hover:border-emerald-500/30 hover:shadow-[0_0_24px_-8px_rgba(16,185,129,0.2)]"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
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
                    unoptimized={!p.image_url.includes("supabase.co")}
                  />
                ) : (
                  <div className="h-full w-full bg-zinc-800" />
                )}
              </div>
              <div className="min-w-0 flex-1 py-0.5">
                <p className="line-clamp-2 text-sm font-semibold text-zinc-100 group-hover:text-emerald-200/95">
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
