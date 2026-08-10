import { cn } from "@/lib/utils";
import { getAvailabilityNote } from "@/lib/product-card-present";
import { CLEARANCE_ACCENT } from "@/lib/storefront-category-accents";
import type { CatalogCardAccent } from "@/components/storefront/CatalogProductCardShell";

const PILL_ACCENT: Record<CatalogCardAccent, string> = {
  catalog: "border-violet-500/15 bg-violet-500/5 text-violet-300/75",
  clearance: CLEARANCE_ACCENT.availabilityPill,
};

export function ProductAvailabilityNote({
  stock,
  locale,
  className,
  accent = "catalog",
}: {
  stock: number | null | undefined;
  locale: string;
  className?: string;
  accent?: CatalogCardAccent;
}) {
  const note = getAvailabilityNote(stock, locale);
  if (!note) return null;

  return (
    <p
      className={cn(
        "inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-[10px] font-medium tracking-wide",
        PILL_ACCENT[accent],
        className
      )}
    >
      {note}
    </p>
  );
}
