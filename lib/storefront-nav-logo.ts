/** Navbar brand logo — literal utilities (Tailwind content scan). Critical CSS on `/` must mirror sm+ sizes. */
export const NAV_LOGO_IMAGE_CLASS =
  "h-11 w-auto max-w-[min(152px,46vw)] shrink-0 object-contain object-left sm:h-14 sm:max-w-[12.5rem] lg:max-w-[14rem]";

export const NAV_LOGO_INTRINSIC = { width: 224, height: 77 } as const;

export const NAV_LOGO_SIZES = "(max-width: 640px) min(152px, 46vw), 224px";
