"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { resolveCatalogQuickFromFilter } from "@/lib/catalog-navigation";
import { shopCategoryQuickChipClasses } from "@/components/storefront/shop-filter-chip-styles";

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
  const pathname = usePathname();
  const quick = searchParams.get("quick")?.trim() ?? "";
  const filterRaw = searchParams.get("filter")?.trim() ?? "";
  const quickEff = quick || resolveCatalogQuickFromFilter(filterRaw) || "";
  const newActive = pathname === "/new" || pathname.startsWith("/new/") || quickEff === "new";
  const clearanceActive =
    pathname === "/clearance" || pathname.startsWith("/clearance/") || quickEff === "clearance";

  useEffect(() => {
    if (showClearance || quickEff !== "clearance") return;
    replaceCatalog((sp) => {
      sp.delete("quick");
      if (sp.get("filter")?.trim() === "clearance") sp.delete("filter");
    });
  }, [showClearance, quickEff, replaceCatalog]);

  return (
    <div className="contents">
      <Link href="/new" className={shopCategoryQuickChipClasses("new", compact, newActive)}>
        {t("สินค้ามาใหม่", "New arrivals")}
      </Link>
      {showClearance ? (
        <Link
          href="/clearance"
          prefetch={false}
          className={shopCategoryQuickChipClasses("clearance", compact, clearanceActive)}
        >
          {t("ล้างสต็อก", "Clearance")}
        </Link>
      ) : null}
    </div>
  );
}
