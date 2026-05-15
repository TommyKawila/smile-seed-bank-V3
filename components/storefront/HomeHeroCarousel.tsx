"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import type { HeroBanner } from "@/lib/hero-banners";
import { HeroCarouselSlideImages } from "@/components/storefront/HeroCarouselSlideImages";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalizedPath, type AppLocale } from "@/lib/utils";

const AUTOPLAY_INTERVAL = 5000;
const FADE_DURATION = 0.8;

const AnimatedHeroSlide = dynamic(
  () => import("./HomeHeroCarouselMotion").then((m) => m.AnimatedHeroSlide),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-zinc-100" aria-hidden />,
  }
);

function resolveHeroAsset(b: HeroBanner, locale: AppLocale, device: "desktop" | "mobile"): string {
  const en = locale === "en";
  const dTh = b.desktopSrc;
  const dEn = b.desktopSrcEn ?? null;
  const mTh = b.mobileSrc;
  const mEn = b.mobileSrcEn ?? null;
  if (device === "desktop") {
    return en ? dEn || dTh : dTh;
  }
  return en ? mEn || mTh || dEn || dTh : mTh || dTh;
}

function resolveHeroAlt(b: HeroBanner, locale: AppLocale): string {
  const th = b.altTh.trim() || "Smile Seed Bank";
  if (locale === "en") {
    const en = b.altEn?.trim();
    return en || th;
  }
  return th;
}

type Props = { banners: HeroBanner[] };

export function HomeHeroCarousel({ banners }: Props) {
  const { locale, t } = useLanguage();
  const [index, setIndex] = useState(0);
  const slides = banners.length ? banners : [];
  const current = slides[index];

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_INTERVAL);
    return () => window.clearInterval(id);
  }, [slides.length]);

  if (!current) {
    return <div className="h-full min-h-0 w-full bg-zinc-100" />;
  }

  const href = current.link.trim()
    ? getLocalizedPath(current.link, locale)
    : null;

  const mobileSrc = resolveHeroAsset(current, locale, "mobile");
  const desktopSrc = resolveHeroAsset(current, locale, "desktop");
  const heroAlt = resolveHeroAlt(current, locale);
  const panelBackdrop =
    current.panelBgHex && /^#[0-9A-Fa-f]{6}$/.test(current.panelBgHex)
      ? current.panelBgHex
      : undefined;

  /** Slide 0: zero Framer Motion — dynamic chunk loads only after leaving slide 0. */
  const slidesMarkup =
    index === 0 ? (
      <div
        className="absolute inset-0 flex flex-col items-stretch justify-start overflow-hidden bg-zinc-100 md:items-center md:justify-center"
        style={panelBackdrop ? { backgroundColor: panelBackdrop } : undefined}
        suppressHydrationWarning
      >
        <HeroCarouselSlideImages
          mobileSrc={mobileSrc}
          desktopSrc={desktopSrc}
          heroAlt={heroAlt}
          priority
        />
      </div>
    ) : (
      <AnimatedHeroSlide
        bannerKey={current.id}
        mobileSrc={mobileSrc}
        desktopSrc={desktopSrc}
        heroAlt={heroAlt}
        panelBackdrop={panelBackdrop}
      />
    );

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-zinc-100 p-0">
      {href ? (
        <Link
          href={href}
          aria-label={heroAlt}
          className="absolute inset-0 z-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/40 focus-visible:ring-offset-0"
        >
          <div className="relative h-full w-full p-0">{slidesMarkup}</div>
        </Link>
      ) : (
        slidesMarkup
      )}

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            aria-label={t("สไลด์ก่อนหน้า", "Previous Slide")}
            className="pointer-events-auto absolute left-2 top-1/2 z-20 flex h-11 min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white shadow-md transition-colors hover:bg-black/45 md:left-3"
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            aria-label={t("สไลด์ถัดไป", "Next Slide")}
            className="pointer-events-auto absolute right-2 top-1/2 z-20 flex h-11 min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white shadow-md transition-colors hover:bg-black/45 md:right-3"
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
          >
            <ChevronRight className="h-6 w-6" strokeWidth={2} aria-hidden />
          </button>
        </>
      ) : null}

      {slides.length > 1 ? (
        <div
          className="pointer-events-auto absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2 md:bottom-4"
          role="tablist"
          aria-label="Hero slides"
        >
          {slides.map((b, i) => (
            <button
              key={b.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={t(`ไปที่สไลด์ ${i + 1}`, `Go to slide ${i + 1}`)}
              className={`flex h-11 min-w-[44px] items-center justify-center rounded-full transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
                i === index ? "opacity-100" : "opacity-70 hover:opacity-90"
              }`}
              onClick={() => setIndex(i)}
            >
              <span
                className={`block h-2.5 w-2.5 rounded-full ${
                  i === index ? "bg-white/90" : "bg-white/40"
                }`}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { AUTOPLAY_INTERVAL, FADE_DURATION };
