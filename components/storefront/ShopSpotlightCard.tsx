"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MicroGeneticsBar } from "@/components/storefront/MicroGeneticsBar";
import { CatalogImagePlaceholder } from "@/components/storefront/CatalogImagePlaceholder";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import { productDetailHref } from "@/lib/product-utils";
import { plainTextFromHtml, truncateMetaDescription } from "@/lib/magazine-seo";
import type { ProductWithBreeder } from "@/lib/supabase/types";

function excerpt(product: ProductWithBreeder): string {
  const raw = product.description_th ?? product.description_en ?? product.description ?? "";
  const plain = plainTextFromHtml(String(raw));
  return truncateMetaDescription(plain, 140);
}

export function ShopSpotlightCard({
  product,
  variants,
}: {
  product: ProductWithBreeder;
  variants?: import("framer-motion").Variants;
}) {
  const img = getListingThumbnailUrl(product);
  const ex = excerpt(product);

  return (
    <motion.div
      variants={variants}
      className="col-span-2 flex h-full min-h-0 flex-col font-sans"
    >
      <Link
        href={productDetailHref(product)}
        className="group flex h-full min-h-[200px] flex-col overflow-hidden rounded-sm border border-zinc-100 bg-white font-sans shadow-sm transition-shadow hover:shadow-md sm:min-h-[220px] sm:flex-row"
      >
        <div className="relative aspect-[4/3] w-full shrink-0 sm:aspect-auto sm:h-auto sm:w-[42%] sm:max-w-md">
          {img ? (
            <Image
              src={img}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, 40vw"
            />
          ) : (
            <CatalogImagePlaceholder seed={product.id} className="absolute inset-0" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center p-5 sm:p-6">
          <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-zinc-400">
            SPOTLIGHT
          </p>
          <h3 className="mt-2 text-xl font-bold leading-snug tracking-tight text-zinc-900 sm:text-2xl">
            {product.name}
          </h3>
          <div className="mt-3 w-full min-w-0">
            <MicroGeneticsBar product={product} />
          </div>
          {ex && (
            <p className="mt-4 line-clamp-3 text-sm font-normal leading-relaxed text-zinc-600">{ex}</p>
          )}
          <span className="mt-4 inline-flex text-[11px] font-medium tabular-nums text-primary">
            View dossier →
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
