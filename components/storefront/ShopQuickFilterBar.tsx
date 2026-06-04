"use client";

import { useCallback, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { parseListParam } from "@/lib/shop-attribute-filters";
import { normalizeCatalogFtUrlParam } from "@/lib/seed-type-filter";
import {
  resolveCatalogFtFromUrl,
  resolveCatalogQuickFromFilter,
  resolveCatalogSortFromFilter,
  type CatalogQuick,
} from "@/lib/catalog-navigation";
import { shopQuickChipClasses } from "@/components/storefront/shop-filter-chip-styles";

export function ShopQuickFilterBar({
  replaceCatalog,
  t,
  showClearance = true,
}: {
  replaceCatalog: (mutate: (sp: URLSearchParams) => void) => void;
  t: (th: string, en: string) => string;
  showClearance?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onBrandPath = pathname.startsWith("/brand/");
  const quick = searchParams.get("quick")?.trim() ?? "";
  const sort = searchParams.get("sort")?.trim() ?? "";
  const ftRaw = searchParams.get("ft")?.trim() ?? "";
  const filterRaw = searchParams.get("filter")?.trim() ?? "";
  const quickEff = quick || resolveCatalogQuickFromFilter(filterRaw) || "";
  const sortEff = sort || resolveCatalogSortFromFilter(filterRaw) || "";
  const ftKey = normalizeCatalogFtUrlParam(resolveCatalogFtFromUrl({ ft: ftRaw, filter: filterRaw }));
  const sexList = parseListParam(searchParams.get("sex"));
  const regularOn = sexList.includes("regular");

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

  const setSortPrice = useCallback(
    (val: "price_asc" | "price_desc") => {
      replaceCatalog((sp) => {
        const cur = sp.get("sort")?.trim() ?? "";
        if (cur === val) sp.delete("sort");
        else sp.set("sort", val);
      });
    },
    [replaceCatalog]
  );

  const toggleFt = useCallback(
    (slug: "photo" | "auto") => {
      replaceCatalog((sp) => {
        const effective = resolveCatalogFtFromUrl({ ft: sp.get("ft"), filter: sp.get("filter") });
        const cur = normalizeCatalogFtUrlParam(effective);
        const turnOff = cur === slug;
        if (onBrandPath) {
          if (turnOff) {
            sp.delete("filter");
            sp.delete("ft");
          } else {
            sp.delete("ft");
            sp.set("filter", slug);
          }
        } else if (turnOff) {
          sp.delete("ft");
        } else {
          sp.set("ft", slug);
        }
      });
    },
    [replaceCatalog, onBrandPath]
  );

  const toggleRegular = useCallback(() => {
    replaceCatalog((sp) => {
      const list = parseListParam(sp.get("sex"));
      const has = list.includes("regular");
      const next = has ? list.filter((s) => s !== "regular") : [...list, "regular"];
      if (next.length === 0) sp.delete("sex");
      else sp.set("sex", next.join(","));
    });
  }, [replaceCatalog]);

  return (
    <div
      role="toolbar"
      aria-label={t("กรองด่วน", "Quick filters")}
      className="flex gap-1.5 overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <button
        type="button"
        className={shopQuickChipClasses(quickEff === "new")}
        aria-pressed={quickEff === "new"}
        onClick={() => setQuick("new")}
      >
        ✨ {t("สินค้ามาใหม่", "New arrivals")}
      </button>
      {showClearance ? (
        <button
          type="button"
          className={shopQuickChipClasses(quickEff === "clearance")}
          aria-pressed={quickEff === "clearance"}
          onClick={() => setQuick("clearance")}
        >
          🏷️ {t("ล้างสต็อก", "Clearance")}
        </button>
      ) : null}
      <button
        type="button"
        className={shopQuickChipClasses(quickEff === "sale")}
        aria-pressed={quickEff === "sale"}
        onClick={() => setQuick("sale")}
      >
        🔥 {t("โปรแบรนด์", "Brand deals")}
      </button>
      <button
        type="button"
        className={shopQuickChipClasses(ftKey === "photo")}
        aria-pressed={ftKey === "photo"}
        onClick={() => toggleFt("photo")}
      >
        🌱 {t("เมล็ด Photo", "Photo seeds")}
      </button>
      <button
        type="button"
        className={shopQuickChipClasses(ftKey === "auto")}
        aria-pressed={ftKey === "auto"}
        onClick={() => toggleFt("auto")}
      >
        🚀 {t("เมล็ด Auto", "Auto seeds")}
      </button>
      <button
        type="button"
        className={shopQuickChipClasses(regularOn)}
        aria-pressed={regularOn}
        onClick={() => toggleRegular()}
      >
        👫 {t("เมล็ด Regular", "Regular seeds")}
      </button>
      <button
        type="button"
        className={shopQuickChipClasses(sortEff === "price_asc")}
        aria-pressed={sortEff === "price_asc"}
        onClick={() => setSortPrice("price_asc")}
      >
        💰 {t("ราคา: ถูก → แพง", "Price: low → high")}
      </button>
      <button
        type="button"
        className={shopQuickChipClasses(sortEff === "price_desc")}
        aria-pressed={sortEff === "price_desc"}
        onClick={() => setSortPrice("price_desc")}
      >
        💎 {t("ราคา: แพง → ถูก", "Price: high → low")}
      </button>
    </div>
  );
}
