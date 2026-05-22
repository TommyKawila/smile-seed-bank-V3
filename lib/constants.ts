/**
 * Storefront / catalog constants — keep in sync with `products.flowering_type` (lowercase snake_case in DB).
 */

/** DB value for Triploid / Photo 3N */
export const FLOWERING_DB_PHOTO_3N = "photo_3n" as const;

/** Plain photoperiod DB strings (not `photo_ff` / `photo_3n`) — aligned with Prisma + `normalizeFloweringFromDb` */
export const FLOWERING_DB_PHOTO_PLAIN = ["photoperiod", "photo"] as const;

/**
 * Normalized `product_categories.name` (trim + lower + collapse spaces) that bucket as plain **Photo**
 * when `products.flowering_type` is NULL — must stay stricter than substring rules for 3N/FF.
 */
export const CATEGORY_NAME_PLAIN_PHOTO = ["photo", "photoperiod"] as const;

/** URL `?ft=` slug (hyphenated) */
export const FLOWERING_SLUG_PHOTO_3N = "photo-3n" as const;

export const FLOWERING_LABEL_PHOTO_3N = "Photo 3N";

/** Home page «New Arrivals» rail — hybrid pinned + recent; must match Prisma `take` / UI slices. */
export const HOME_NEW_ARRIVALS_LIMIT = 8;

/** Featured carousel pool before shuffle + slice for home / storefront featured API. */
export const HOME_FEATURED_POOL = 8;

/** Featured strains shown on home after shuffle. */
export const HOME_FEATURED_SHOW = 4;

/** Clearance rail on home payload only (catalog APIs may use a larger limit). */
export const HOME_CLEARANCE_LIMIT = 8;

/** Featured breeder icon grid on home — ranked by active strain count (not full catalog). */
export const BREEDER_SHOWCASE_LIMIT = 8;

/** Max rows per rail in `GET /api/storefront/home` JSON (payload guardrail). */
export const HOME_STOREFRONT_HOME_API_SECTION_LIMIT = 4 as const;
