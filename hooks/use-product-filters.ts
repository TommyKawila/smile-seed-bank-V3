"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseListParam } from "@/lib/shop-attribute-filters";

export const SEEDS_URL_PARAM = "seeds";

/** Shop catalog URL filters (extensible). Currently: `seeds` multi-select. */
export function useProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const seeds = useMemo(
    () => parseListParam(searchParams.get(SEEDS_URL_PARAM)),
    [searchParams]
  );

  const toggleSeed = useCallback(
    (slug: string) => {
      const sp = new URLSearchParams(searchParams.toString());
      const cur = parseListParam(sp.get(SEEDS_URL_PARAM));
      const lower = slug.toLowerCase();
      const next = cur.includes(lower) ? cur.filter((s) => s !== lower) : [...cur, lower];
      if (next.length === 0) sp.delete(SEEDS_URL_PARAM);
      else sp.set(SEEDS_URL_PARAM, next.join(","));
      const q = sp.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return { seeds, toggleSeed };
}
