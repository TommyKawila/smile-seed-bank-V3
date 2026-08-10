import { cn } from "@/lib/utils";
import {
  productAccentTokens,
  type ProductStatusAccent,
} from "@/lib/storefront-category-accents";

export function StockAlert({
  quantity,
  locale,
  className,
  accent = "vault",
}: {
  quantity: number | null | undefined;
  locale: string;
  className?: string;
  accent?: ProductStatusAccent;
}) {
  const count = Number(quantity ?? 0);
  if (!Number.isFinite(count) || count <= 0 || count >= 5) return null;

  const tokens = productAccentTokens(accent);

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2.5 text-[10px] font-semibold tabular-nums",
        tokens.pdpStockPill,
        className
      )}
    >
      {locale === "th" ? `เหลือเพียง ${count} ชิ้น` : `Only ${count} items left!`}
    </span>
  );
}
