"use client";

import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ShopSpotlightCard } from "@/components/storefront/ShopSpotlightCard";
import { ShopResearchInsightCard } from "@/components/storefront/ShopResearchInsightCard";
import { FinalArchiveSpotlightCard } from "@/components/storefront/FinalArchiveSpotlightCard";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import type { MagazinePostPublic } from "@/lib/blog-service";
import type { ProductWithBreeder, ProductWithBreederAndVariants } from "@/lib/supabase/types";
const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055 } },
};

const cellVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
};

type VaultItem =
  | { type: "product"; product: ProductWithBreeder }
  | { type: "spotlight"; product: ProductWithBreeder }
  | { type: "research"; post: MagazinePostPublic }
  | { type: "finalArchive"; product: ProductWithBreederAndVariants };

function buildVaultItems(
  products: ProductWithBreeder[],
  researchPosts: MagazinePostPublic[],
  finalArchiveProducts: ProductWithBreederAndVariants[]
): VaultItem[] {
  const archiveIds = new Set(finalArchiveProducts.map((p) => p.id));
  const queue = products.filter((p) => !archiveIds.has(p.id));
  const items: VaultItem[] = [];

  for (let k = 0; k < 4 && k < queue.length; k++) {
    items.push({ type: "product", product: queue[k]! });
  }
  let rest = queue.slice(4);

  for (const p of finalArchiveProducts) {
    items.push({ type: "finalArchive", product: p });
  }

  let i = 0;
  let spotlightRound = 0;
  while (i < rest.length) {
    for (let k = 0; k < 7 && i < rest.length; k++) {
      items.push({ type: "product", product: rest[i]! });
      i += 1;
    }
    if (i >= rest.length) break;
    items.push({ type: "spotlight", product: rest[i]! });
    i += 1;
    spotlightRound += 1;
    if (spotlightRound === 1 && researchPosts[0]) {
      items.push({ type: "research", post: researchPosts[0] });
    }
    if (spotlightRound === 2 && researchPosts[1]) {
      items.push({ type: "research", post: researchPosts[1] });
    }
  }
  return items;
}

export function GeneticVaultProductGrid({
  products,
  researchPosts,
  finalArchiveProducts,
}: {
  products: ProductWithBreeder[];
  researchPosts: MagazinePostPublic[];
  finalArchiveProducts: ProductWithBreederAndVariants[];
}) {
  const items = useMemo(
    () => buildVaultItems(products, researchPosts, finalArchiveProducts),
    [products, researchPosts, finalArchiveProducts]
  );

  return (
    <div className={JOURNAL_PRODUCT_FONT_VARS}>
      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4"
      >
        {items.map((item, idx) => {
          if (item.type === "product") {
            return (
              <ProductCard key={`vault-p-${item.product.id}-${idx}`} product={item.product} />
            );
          }
          if (item.type === "finalArchive") {
            return (
              <FinalArchiveSpotlightCard
                key={`vault-fa-${item.product.id}-${idx}`}
                product={item.product}
                variants={cellVariants}
              />
            );
          }
          if (item.type === "spotlight") {
            return (
              <ShopSpotlightCard
                key={`vault-s-${item.product.id}-${idx}`}
                product={item.product}
                variants={cellVariants}
              />
            );
          }
          return (
            <ShopResearchInsightCard
              key={`vault-r-${item.post.id}-${idx}`}
              post={item.post}
              variants={cellVariants}
            />
          );
        })}
      </motion.div>
    </div>
  );
}
