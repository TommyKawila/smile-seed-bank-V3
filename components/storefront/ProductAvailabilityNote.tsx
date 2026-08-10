import { cn } from "@/lib/utils";
import { getAvailabilityNote } from "@/lib/product-card-present";
import {
  productAccentTokens,
  type ProductStatusAccent,
} from "@/lib/storefront-category-accents";

export function ProductAvailabilityNote({
  stock,
  locale,
  className,
  accent = "vault",
}: {
  stock: number | null | undefined;
  locale: string;
  className?: string;
  accent?: ProductStatusAccent;
}) {
  const note = getAvailabilityNote(stock, locale);
  if (!note) return null;

  const a = productAccentTokens(accent);

  return (
    <p
      className={cn(
        "inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-[10px] font-medium tracking-wide",
        a.availabilityPill,
        className
      )}
    >
      {note}
    </p>
  );
}
