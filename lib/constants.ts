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
