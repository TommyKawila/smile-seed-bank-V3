import Image from "next/image";
import Link from "next/link";
import type { SmartProductPreview } from "@/lib/blog-service";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";

export function SmartTieInStrip({ products }: { products: SmartProductPreview[] }) {
  if (products.length === 0) return null;

  return (
    <aside className="my-12 rounded-2xl border border-zinc-200 bg-gradient-to-b from-emerald-50/50 to-zinc-50 p-6 shadow-sm">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h3 className="font-sans text-lg font-semibold text-emerald-950">
          Editor&apos;s pick
        </h3>
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-700">
          Related gear
        </span>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {products.map((p) => (
          <li key={p.id}>
            <Link
              href={p.slug ? `/product/${p.slug}` : "/shop"}
              className="group flex gap-4 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
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
                  <div className="h-full w-full bg-zinc-200" />
                )}
              </div>
              <div className="min-w-0 flex-1 py-0.5">
                <p className="line-clamp-2 text-sm font-semibold text-zinc-900 group-hover:text-emerald-900">
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
