/** Seeds Hub chooser — shown on bare `/seeds` before catalog filters. */

export type SeedsHubBreederBox = {
  breederId: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  productCount: number;
};

export type SeedsHubFacetBox = {
  id: string;
  href: string;
  labelTh: string;
  labelEn: string;
  productCount: number | null;
  accent: "emerald" | "violet" | "amber" | "sky";
  /** Optional banner art (16:10) for flowering / genetics chooser cards. */
  imageUrl?: string | null;
};

/** Local storefront assets for Seeds Hub flowering chooser (V4 dark theme). */
export const SEEDS_HUB_FLOWERING_IMAGES = {
  auto: "/images/seeds-hub/autoflower.webp",
  photo: "/images/seeds-hub/photoperiod.webp",
} as const;

/** Local storefront assets for Seeds Hub genetics chooser (V4 dark theme). */
export const SEEDS_HUB_GENETICS_IMAGES = {
  sativa: "/images/seeds-hub/sativa.webp",
  indica: "/images/seeds-hub/indica.webp",
  hybrid: "/images/seeds-hub/hybrid.webp",
} as const;

export type SeedsHubPayload = {
  breeders: SeedsHubBreederBox[];
  flowering: SeedsHubFacetBox[];
  genetics: SeedsHubFacetBox[];
};

const HUB_BLOCKING_KEYS = [
  "view",
  "ft",
  "filter",
  "quick",
  "genetics",
  "q",
  "breeder",
  "category",
  "sort",
  "seeds",
  "difficulty",
  "thc",
  "cbd",
  "sex",
  "yield",
  "pmin",
  "pmax",
] as const;

function firstParam(value: string | string[] | undefined | null): string {
  if (Array.isArray(value)) return (value[0] ?? "").trim();
  return (value ?? "").trim();
}

/** True when `/seeds` should render the chooser hub (no filters / no view=all). */
export function shouldShowSeedsHub(
  searchParams: Record<string, string | string[] | undefined> | undefined | null
): boolean {
  if (!searchParams) return true;
  for (const key of HUB_BLOCKING_KEYS) {
    const v = firstParam(searchParams[key]);
    if (!v) continue;
    if (key === "view") {
      if (v.toLowerCase() === "all") return false;
      continue;
    }
    return false;
  }
  return true;
}

/** Facet boxes without live counts — used as withTimeout fallback. */
export function seedsHubFacetFallback(): Pick<SeedsHubPayload, "flowering" | "genetics"> {
  return {
    flowering: [
      {
        id: "auto",
        href: "/seeds?ft=auto",
        labelTh: "ออโต้ฟลาวเวอร์",
        labelEn: "Autoflower",
        productCount: null,
        accent: "amber",
        imageUrl: SEEDS_HUB_FLOWERING_IMAGES.auto,
      },
      {
        id: "photo",
        href: "/seeds?ft=photo",
        labelTh: "โฟโต้พีเรียด",
        labelEn: "Photoperiod",
        productCount: null,
        accent: "sky",
        imageUrl: SEEDS_HUB_FLOWERING_IMAGES.photo,
      },
    ],
    genetics: [
      {
        id: "sativa",
        href: "/seeds?genetics=sativa-dom",
        labelTh: "ซาติวา",
        labelEn: "Sativa",
        productCount: null,
        accent: "emerald",
        imageUrl: SEEDS_HUB_GENETICS_IMAGES.sativa,
      },
      {
        id: "indica",
        href: "/seeds?genetics=indica-dom",
        labelTh: "อินดิกา",
        labelEn: "Indica",
        productCount: null,
        accent: "violet",
        imageUrl: SEEDS_HUB_GENETICS_IMAGES.indica,
      },
      {
        id: "hybrid",
        href: "/seeds?genetics=hybrid",
        labelTh: "ไฮบริด",
        labelEn: "Hybrid",
        productCount: null,
        accent: "amber",
        imageUrl: SEEDS_HUB_GENETICS_IMAGES.hybrid,
      },
    ],
  };
}
