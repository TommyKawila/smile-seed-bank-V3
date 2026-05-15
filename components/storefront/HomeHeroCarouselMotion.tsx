"use client";

import { AnimatePresence, motion } from "framer-motion";
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
      <motion.div
        key={bannerKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition}
        className="absolute inset-0 flex flex-col items-stretch justify-start overflow-hidden bg-zinc-100 md:items-center md:justify-center"
        style={panelBackdrop ? { backgroundColor: panelBackdrop } : undefined}
      >
        <HeroCarouselSlideImages
          mobileSrc={mobileSrc}
          desktopSrc={desktopSrc}
          heroAlt={heroAlt}
          priority={false}
        />
      </motion.div>
    </AnimatePresence>
  );
}
