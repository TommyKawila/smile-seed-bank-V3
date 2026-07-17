import { ProductCardSkeleton } from "@/components/skeletons/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";

type LcpProduct = {
  name?: string | null;
  image_urls?: unknown;
  image_url?: string | null;
  product_images?: unknown;
};

/**
 * Suspense fallback for catalog while `useSearchParams` resolves.
 * First card emits the real LCP `<img>` (same URL as CatalogLcpPreload / ProductCard).
 */
export function ShopCatalogLcpFallback({ product }: { product?: LcpProduct | null }) {
  const href = product ? getListingThumbnailUrl(product) : null;
  const alt = product?.name?.trim() || "Product";

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex gap-3">
          <Skeleton className="h-10 flex-1 rounded-xl bg-muted/40" />
          <Skeleton className="h-10 w-24 rounded-xl bg-muted/40" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="flex h-full min-h-0 min-w-0 flex-col">
            <div className="group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card/60 surface-glass shadow-sm">
              <div className="relative aspect-square shrink-0 overflow-hidden bg-muted/30">
                {href ? (
                  <img
                    src={href}
                    alt={alt}
                    width={320}
                    height={320}
                    fetchPriority="high"
                    loading="eager"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <Skeleton className="absolute inset-0 rounded-none bg-muted/40" />
                )}
              </div>
              <div className="space-y-2.5 p-4">
                <Skeleton className="h-3 w-16 rounded-md bg-muted/40" />
                <Skeleton className="h-4 w-[88%] max-w-[14rem] rounded-md bg-muted/40" />
                <Skeleton className="h-5 w-20 rounded-md bg-muted/40" />
              </div>
            </div>
          </div>
          {Array.from({ length: 7 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
