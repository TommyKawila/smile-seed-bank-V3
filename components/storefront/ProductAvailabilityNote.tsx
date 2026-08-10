import { cn } from "@/lib/utils";
import { getAvailabilityNote } from "@/lib/product-card-present";

export function ProductAvailabilityNote({
  stock,
  locale,
  className,
}: {
  stock: number | null | undefined;
  locale: string;
  className?: string;
}) {
  const note = getAvailabilityNote(stock, locale);
  if (!note) return null;

  return (
    <p
      className={cn(
        "inline-flex max-w-full items-center rounded-md border border-violet-500/15 bg-violet-500/5 px-2 py-0.5 text-[10px] font-medium tracking-wide text-violet-300/75",
        className
      )}
    >
      {note}
    </p>
  );
}
