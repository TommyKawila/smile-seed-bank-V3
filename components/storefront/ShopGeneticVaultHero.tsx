"use client";

import dynamic from "next/dynamic";
import type { ProductWithBreeder } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { useNearViewport } from "@/hooks/use-near-viewport";
import { VaultHeroSlide, type VaultHeroTFn } from "@/components/storefront/VaultHeroSlide";

const FeaturedStrainHeroCarouselEmbla = dynamic(
  () =>
    import("@/components/storefront/FeaturedStrainHeroCarouselEmbla").then((m) => ({
      default: m.FeaturedStrainHeroCarouselEmbla,
    })),
  { ssr: false }
);

export function FeaturedStrainHeroCarousel({
  products,
  isEn,
  t,
  className,
}: {
  products: ProductWithBreeder[];
  isEn: boolean;
  t: VaultHeroTFn;
  className?: string;
}) {
  if (products.length <= 1) {
    const product = products[0];
    if (!product) return null;
    return (
      <div className={cn("relative font-sans", className)}>
        <VaultHeroSlide product={product} isEn={isEn} t={t} priorityImage />
      </div>
    );
  }

  return (
    <FeaturedStrainHeroCarouselDeferred
      products={products}
      isEn={isEn}
      t={t}
      className={className}
    />
  );
}

function FeaturedStrainHeroCarouselDeferred({
  products,
  isEn,
  t,
  className,
}: {
  products: ProductWithBreeder[];
  isEn: boolean;
  t: VaultHeroTFn;
  className?: string;
}) {
  const { ref, visible } = useNearViewport();
  const first = products[0];

  return (
    <div ref={ref} className={cn("relative font-sans", className)}>
      {visible ? (
        <FeaturedStrainHeroCarouselEmbla products={products} isEn={isEn} t={t} />
      ) : first ? (
        <VaultHeroSlide product={first} isEn={isEn} t={t} priorityImage />
      ) : null}
    </div>
  );
}

export function ShopGeneticVaultHero({
  products,
  isEn,
  t,
}: {
  products: ProductWithBreeder[];
  isEn: boolean;
  t: VaultHeroTFn;
}) {
  return (
    <div className="border-b border-zinc-100 bg-white px-4 py-10 font-sans sm:px-6 sm:py-12">
      <div className="relative mx-auto max-w-7xl">
        <FeaturedStrainHeroCarousel products={products} isEn={isEn} t={t} />
      </div>
    </div>
  );
}
