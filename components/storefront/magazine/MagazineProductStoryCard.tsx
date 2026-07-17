import Image from "next/image";
import Link from "next/link";
import type { MagazineProductPublic } from "@/lib/blog-service";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

function formatThb(n: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(n);
}

export function MagazineProductStoryCard({
  product,
  variant = "inline",
}: {
  product: MagazineProductPublic;
  variant?: "inline" | "grid";
}) {
  const href = product.slug ? `/product/${product.slug}` : "/shop";
  const img = product.image_url;
  const isGrid = variant === "grid";

  return (
    <Link
      href={href}
      className={`group flex overflow-hidden rounded-2xl border border-border bg-muted/30 shadow-sm transition hover:border-primary/30 hover:shadow-md ${
        isGrid ? "flex-col" : "gap-5 p-5 sm:flex-row sm:items-stretch"
      }`}
    >
      <div
        className={`relative shrink-0 overflow-hidden bg-muted/30 ${
          isGrid ? "aspect-[4/3] w-full" : "h-40 w-full sm:h-auto sm:w-44"
        }`}
      >
        {img ? (
          <Image
            src={img}
            alt=""
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes={isGrid ? "(max-width: 640px) 100vw, 50vw" : "(max-width: 640px) 100vw, 176px"}
            loading="lazy"
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR_DATA_URL}
            unoptimized={shouldOffloadImageOptimization(img)}
          />
        ) : (
          <div className="flex h-full min-h-[10rem] items-center justify-center bg-gradient-to-br from-muted/50 to-card text-xs text-muted-foreground">
            No image
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-900/10 to-transparent opacity-80" />
      </div>
      <div
        className={`flex min-w-0 flex-1 flex-col justify-center ${
          isGrid ? "gap-2 p-4" : "gap-3 py-0.5"
        }`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
          Smile Seed Bank
        </p>
        <h3
          className={`font-sans font-semibold leading-snug text-foreground group-hover:text-primary ${
            isGrid ? "line-clamp-2 text-base" : "text-lg"
          }`}
        >
          {product.name}
        </h3>
        {product.breeder_name && (
          <p className="text-xs text-muted-foreground">{product.breeder_name}</p>
        )}
        {product.price != null && (
          <p className="text-sm font-medium tabular-nums text-primary">
            {formatThb(product.price)}
          </p>
        )}
        <span className="mt-1 inline-flex w-fit items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition group-hover:border-primary/40 group-hover:bg-primary/15">
          View product
        </span>
      </div>
    </Link>
  );
}
