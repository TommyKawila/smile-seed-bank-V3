import { getImageProps } from "next/image";
import type { HeroBanner } from "@/lib/hero-banners";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

/** Match `HeroCarouselSlideImages` + `next.config.mjs` deviceSizes / qualities. */
const MOBILE_W = 390;
const MOBILE_H = Math.round((MOBILE_W * 429) / 391);
const DESKTOP_W = 640;
const DESKTOP_H = Math.round((DESKTOP_W * 890) / 617);

function preloadHref(src: string, width: number, height: number, quality: number): string | null {
  const s = src.trim();
  if (!s) return null;
  if (shouldOffloadImageOptimization(s)) return s;
  try {
    const { props } = getImageProps({
      src: s,
      alt: "",
      width,
      height,
      quality,
    });
    return typeof props.src === "string" ? props.src : null;
  } catch {
    return null;
  }
}

/** Thai-default assets for LCP (matches server-first paint before client locale hydrates). */
function firstBannerSources(b: HeroBanner): { mobile: string; desktop: string } {
  const desktop = b.desktopSrc.trim();
  const mobile = (b.mobileSrc?.trim() ? b.mobileSrc : b.desktopSrc).trim();
  return { mobile, desktop };
}

/**
 * Emits responsive preload hints for the first hero slide so the preload scanner
 * can start `/_next/image` (or raw URL) before the client carousel hydrates.
 */
export function HomeHeroLcpPreload({ banner }: { banner: HeroBanner | undefined }) {
  if (!banner) return null;
  const { mobile, desktop } = firstBannerSources(banner);
  if (!mobile || !desktop) return null;

  const mobileHref = preloadHref(mobile, MOBILE_W, MOBILE_H, 60);
  const desktopHref = preloadHref(desktop, DESKTOP_W, DESKTOP_H, 65);
  if (!mobileHref || !desktopHref) return null;

  return (
    <>
      <link
        rel="preload"
        as="image"
        href={mobileHref}
        fetchPriority="high"
        media="(max-width: 767px)"
      />
      <link
        rel="preload"
        as="image"
        href={desktopHref}
        fetchPriority="high"
        media="(min-width: 768px)"
      />
    </>
  );
}
