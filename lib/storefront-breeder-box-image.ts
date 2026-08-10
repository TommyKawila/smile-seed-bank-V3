/** Bento breeder box — banner art uses cover; logo fallback uses contain on dark bg. */

export function breederBoxUsesBannerCover(
  imageUrl: string | null | undefined,
  logoUrl: string | null | undefined
): boolean {
  const img = imageUrl?.trim();
  if (!img) return false;
  const logo = logoUrl?.trim();
  return !logo || img !== logo;
}

export const BREEDER_BOX_BANNER_IMAGE_CLASS =
  "object-cover transition duration-700 group-hover:scale-[1.05]";

export const BREEDER_BOX_LOGO_IMAGE_CLASS =
  "object-contain p-3 transition duration-700 group-hover:scale-[1.05] sm:p-6 lg:p-8";
