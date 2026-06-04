"use client";

import { useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  resolveCatalogQuickFromFilter,
  type CatalogQuick,
} from "@/lib/catalog-navigation";
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

  const setQuick = useCallback(
    (val: CatalogQuick) => {
      replaceCatalog((sp) => {
        const cur = sp.get("quick")?.trim() ?? "";
        if (cur === val) sp.delete("quick");
        else sp.set("quick", val);
      });
    },
    [replaceCatalog]
  );

  return (
    <div className="contents">
      <button
        type="button"
        className={shopQuickChipClasses(quickEff === "new", compact)}
        aria-pressed={quickEff === "new"}
        onClick={() => setQuick("new")}
      >
        ✨ {t("สินค้ามาใหม่", "New arrivals")}
      </button>
      {showClearance ? (
        <button
          type="button"
          className={shopQuickChipClasses(quickEff === "clearance", compact)}
          aria-pressed={quickEff === "clearance"}
          onClick={() => setQuick("clearance")}
        >
          🏷️ {t("ล้างสต็อก", "Clearance")}
        </button>
      ) : null}
    </div>
  );
}
