"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { floweringTypeToSlug } from "@/lib/seed-type-filter";

export type BreederTypeOption = { slug: string; label: string; count: number };

export function BreederTypeFilter({
  options,
  allLabel,
  paramKey = "ft",
  ariaLabel,
}: {
  options: BreederTypeOption[];
  allLabel: string;
  /** URL query key (default `ft` for catalog Auto / Photo / Photo FF). */
  paramKey?: string;
  ariaLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = floweringTypeToSlug(searchParams.get(paramKey));

  const setType = useCallback(
    (slug: string | null) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (slug == null || slug === "") sp.delete(paramKey);
      else sp.set(paramKey, slug);
      const q = sp.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, paramKey]
  );

  if (options.length === 0) return null;

  return (
    <div className="mb-4 -mx-1 px-1">
      <div
        role="tablist"
        aria-label={ariaLabel ?? "Flowering type"}
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          type="button"
          role="tab"
          aria-selected={!active}
          onClick={() => setType(null)}
          className={`inline-flex min-w-[6.5rem] shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            !active
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/50 text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {allLabel}
        </button>
        {options.map(({ slug, label, count }) => {
          const isOn = active === slug;
          return (
            <button
              key={slug}
              type="button"
              role="tab"
              aria-selected={isOn}
              onClick={() => setType(slug)}
              className={`inline-flex min-w-[6.5rem] shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                isOn
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
