"use client";

import { AnimatePresence, m } from "framer-motion";
import { HeroCarouselSlideImages } from "@/components/storefront/HeroCarouselSlideImages";

const FADE_DURATION = 0.8;

export type AnimatedHeroSlideProps = {
  bannerKey: string | number;
  mobileSrc: string;
  desktopSrc: string;
  heroAlt: string;
  panelBackdrop?: string;
};

/** Loaded only after leaving slide 0 — keeps Framer off the LCP path. */
export function AnimatedHeroSlide({
  bannerKey,
  mobileSrc,
  desktopSrc,
  heroAlt,
  panelBackdrop,
}: AnimatedHeroSlideProps) {
  const transition = { duration: FADE_DURATION, ease: "easeInOut" as const };
  return (
    <AnimatePresence mode="wait">
      <m.div
        key={bannerKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition}
        className="absolute inset-0 overflow-hidden bg-zinc-100 md:flex md:items-center md:justify-center"
        style={panelBackdrop ? { backgroundColor: panelBackdrop } : undefined}
      >
        {/* Plain anchor between LazyMotion layer and Image fill (layout containment). */}
        <div className="relative h-full w-full min-h-0 flex-1 overflow-hidden md:flex md:items-center md:justify-center">
          <HeroCarouselSlideImages
            mobileSrc={mobileSrc}
            desktopSrc={desktopSrc}
            heroAlt={heroAlt}
            priority={false}
          />
        </div>
      </m.div>
    </AnimatePresence>
  );
}
