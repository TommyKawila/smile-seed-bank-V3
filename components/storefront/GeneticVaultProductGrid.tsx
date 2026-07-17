"use client";

import { ProductCard } from "@/components/storefront/ProductCard";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import type { ProductWithBreeder } from "@/lib/supabase/types";

export function GeneticVaultProductGrid({
  products,
  catalogSeedsFilter = null,
}: {
  products: ProductWithBreeder[];
  catalogSeedsFilter?: string | null;
}) {
  return (
    <div className={JOURNAL_PRODUCT_FONT_VARS}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {products.map((product, index) => (
          <div
            key={`vault-p-${product.id}`}
            className="flex h-full min-h-0 min-w-0 flex-col"
          >
            <ProductCard
              product={product}
              disableOuterMotion
              catalogSeedsFilter={catalogSeedsFilter}
              imagePriority={index < 2}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
