"use client";

import Image from "next/image";

export type HeroCarouselSlideImagesProps = {
  mobileSrc: string;
  desktopSrc: string;
  heroAlt: string;
  priority: boolean;
};

/** Plain Images — no Framer Motion (LCP path). */
export function HeroCarouselSlideImages({
  mobileSrc,
  desktopSrc,
  heroAlt,
  priority,
}: HeroCarouselSlideImagesProps) {
  const eager = priority;
  return (
    <>
      <div className="relative aspect-[391/429] w-full shrink-0 overflow-hidden p-0 md:hidden">
        <Image
          src={mobileSrc}
          alt={heroAlt}
          fill
          priority={priority}
          fetchPriority={eager ? "high" : "auto"}
          loading={eager ? "eager" : "lazy"}
          quality={60}
          className="object-contain object-center"
          sizes="(max-width: 767px) min(100vw, 391px), 0px"
        />
      </div>
      <div className="relative hidden aspect-[617/890] w-full shrink-0 overflow-hidden p-0 md:block">
        <Image
          src={desktopSrc}
          alt={heroAlt}
          fill
          priority={priority}
          fetchPriority={eager ? "high" : "auto"}
          loading={eager ? "eager" : "lazy"}
          quality={65}
          className="object-cover object-center"
          sizes="(max-width: 767px) 0px, min(50vw, 640px)"
        />
      </div>
    </>
  );
}
