"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resolveCatalogQuickFromFilter } from "@/lib/catalog-navigation";
import { shopQuickChipClasses } from "@/components/storefront/shop-filter-chip-styles";

export function ShopQuickFilterBar({
  replaceCatalog,
  t,
  showClearance = true,
  compact = false,
}: {
  replaceCatalog: (mutate: (sp: URLSearchParams) => void) => void;
  t: (th: string, en: string) => string;
  showClearance?: boolean;
  compact?: boolean;
}) {
  const searchParams = useSearchParams();
  const quick = searchParams.get("quick")?.trim() ?? "";
  const filterRaw = searchParams.get("filter")?.trim() ?? "";
  const quickEff = quick || resolveCatalogQuickFromFilter(filterRaw) || "";

  useEffect(() => {
    if (showClearance || quickEff !== "clearance") return;
    replaceCatalog((sp) => {
      sp.delete("quick");
      if (sp.get("filter")?.trim() === "clearance") sp.delete("filter");
    });
  }, [showClearance, quickEff, replaceCatalog]);

  return (
    <div className="contents">
      <Link href="/new" className={shopQuickChipClasses(false, compact)}>
        ✨ {t("สินค้ามาใหม่", "New arrivals")}
      </Link>
      {showClearance ? (
        <Link
          href="/clearance"
          className={shopQuickChipClasses(false, compact)}
        >
          🏷️ {t("ล้างสต็อก", "Clearance")}
        </Link>
      ) : null}
    </div>
  );
}
