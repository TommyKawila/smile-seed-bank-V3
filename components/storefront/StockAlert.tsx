import { cn } from "@/lib/utils";

export function StockAlert({
  quantity,
  locale,
  className,
}: {
  quantity: number | null | undefined;
  locale: string;
  className?: string;
}) {
  const count = Number(quantity ?? 0);
  if (!Number.isFinite(count) || count <= 0 || count >= 5) return null;

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border border-primary/15 bg-accent/70 px-2.5 text-[11px] font-semibold tabular-nums text-primary",
        className
      )}
    >
      {locale === "th" ? `เหลือเพียง ${count} ชิ้น` : `Only ${count} items left!`}
    </span>
  );
}
