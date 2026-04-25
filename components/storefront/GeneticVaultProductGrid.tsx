"use client";

import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ShopSpotlightCard } from "@/components/storefront/ShopSpotlightCard";
import { ShopResearchInsightCard } from "@/components/storefront/ShopResearchInsightCard";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import type { MagazinePostPublic } from "@/lib/blog-service";
import type { ProductWithBreeder } from "@/lib/supabase/types";
import { interleaveContent } from "@/lib/interleave-vault-grid";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055 } },
};

const cellVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
};

export function GeneticVaultProductGrid({
  products,
  researchPosts,
}: {
  products: ProductWithBreeder[];
  researchPosts: MagazinePostPublic[];
}) {
  const items = useMemo(
    () => interleaveContent(products, researchPosts),
    [products, researchPosts]
  );

  return (
    <div className={JOURNAL_PRODUCT_FONT_VARS}>
      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {items.map((item, idx) => {
          if (item.type === "product") {
            return (
              <div
                key={`vault-p-${item.product.id}-${idx}`}
                className="flex h-full min-h-0 min-w-0 flex-col"
              >
                <ProductCard product={item.product} />
              </div>
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
