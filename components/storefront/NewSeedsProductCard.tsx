"use client";

import { ProductCard } from "@/components/storefront/ProductCard";
import type { ProductWithBreederAndVariants } from "@/lib/supabase/types";

export function NewSeedsProductCard({
  product,
}: {
  product: ProductWithBreederAndVariants;
}) {
  return <ProductCard product={product} linkOnly showNewBadge />;
}
