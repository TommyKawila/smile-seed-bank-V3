"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { DynamicBanner } from "@/services/banner-service";
import { getLocalizedPath, type AppLocale } from "@/lib/utils";
import { useHasMounted } from "@/hooks/use-has-mounted";

function bannerImage(
  banner: DynamicBanner,
  locale: AppLocale,
  device: "desktop" | "mobile"
): string {
  const lang = locale === "en" ? "en" : "th";
  const dTh = banner.desktop_image_th;
  const dEn = banner.desktop_image_en ?? "";
  const mTh = banner.mobile_image_th ?? "";
  const mEn = banner.mobile_image_en ?? "";
  const primary =
    device === "desktop"
      ? lang === "en"
        ? dEn || dTh
        : dTh || dEn
      : lang === "en"
        ? mEn || mTh
        : mTh || mEn;
  const fallback =
    device === "desktop"
      ? dTh || dEn
      : mTh || mEn || dTh || dEn;
  return primary || fallback;
}

function bannerTitle(banner: DynamicBanner, locale: AppLocale): string {
  if (locale === "en") return banner.title_en || banner.title_th || "Smile Seed Bank banner";
  return banner.title_th || banner.title_en || "Smile Seed Bank banner";
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${h}:${pad(m)}:${pad(sec)}`;
}

/** Fixed-height overlay bottom of slide — no layout shift vs slide media. */
function BannerEndCountdownStrip({
  endDateIso,
  locale,
  withinMs,
}: {
  endDateIso: string | null;
  locale: AppLocale;
  withinMs: number;
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!endDateIso) return;
    const end = Date.parse(endDateIso);
    if (Number.isNaN(end)) return;
    const left = end - Date.now();
    if (left <= 0 || left > withinMs) return;
    const id = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(id);
  }, [endDateIso, withinMs]);

  if (!endDateIso) return null;
  const end = Date.parse(endDateIso);
  if (Number.isNaN(end)) return null;
  const remaining = end - Date.now();
  if (remaining <= 0 || remaining > withinMs) return null;

  const label =
    locale === "en"
      ? "Ends in"
      : "สิ้นสุดใน";

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex min-h-[2.75rem] items-end justify-center bg-gradient-to-t from-black/55 via-black/20 to-transparent px-3 pb-3 pt-8"
      aria-live="polite"
    >
      <span className="rounded-full border border-white/30 bg-black/35 px-3 py-1 text-center font-mono text-[11px] font-semibold tabular-nums tracking-tight text-white backdrop-blur-sm sm:text-xs">
        {label}{" "}
        <span className="inline-block min-w-[4.5rem] text-left">{formatCountdown(remaining)}</span>
      </span>
    </div>
  );
}

function BannerSlideMedia({
  src,
  alt,
  priority,
  sizes,
}: {
  src: string;
  alt: string;
  priority: boolean;
  sizes: string;
}) {
  if (!src.trim()) return null;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      fetchPriority={priority ? "high" : "auto"}
      loading={priority ? "eager" : "lazy"}
      className="object-cover"
      sizes={sizes}
    />
  );
}

function BannerFrame({
  banner,
  priority,
  locale,
  urgencyEndWithinMs,
}: {
  banner: DynamicBanner;
  priority: boolean;
  locale: AppLocale;
  urgencyEndWithinMs: number | null;
}) {
  const title = bannerTitle(banner, locale);
  const desktopSrc = bannerImage(banner, locale, "desktop");
  const mobileSrc = bannerImage(banner, locale, "mobile");
  /** md = 768px: portrait mobile vs 1920×700 desktop frame (no shared aspect box). */
  const countdownStrip =
    urgencyEndWithinMs !== null ? (
      <BannerEndCountdownStrip
        endDateIso={banner.end_date}
        locale={locale}
        withinMs={urgencyEndWithinMs}
      />
    ) : null;

  const content = (
    <>
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-100 md:hidden">
        <BannerSlideMedia src={mobileSrc} alt={title} priority={priority} sizes="100vw" />
        {countdownStrip}
      </div>
      <div className="relative hidden aspect-[1920/700] w-full overflow-hidden bg-zinc-100 md:block">
        <BannerSlideMedia
          src={desktopSrc}
          alt={title}
          priority={priority}
          sizes="(min-width: 768px) min(1280px, 100vw), 100vw"
        />
        {countdownStrip}
      </div>
    </>
  );

  const rawLink = banner.link_url?.trim();
  if (!rawLink) return content;
  return (
    <Link href={getLocalizedPath(rawLink, locale)} aria-label={title} className="block">
      {content}
    </Link>
  );
}

export function DynamicHero({
  banners,
  locale,
  urgencyEndWithinMs = null,
}: {
  banners: DynamicBanner[];
  locale: AppLocale;
  /** Show end countdown overlay when expiry is within this window (typically 24h). `null` = off. */
  urgencyEndWithinMs?: number | null;
}) {
  const mounted = useHasMounted();
  if (banners.length === 0) return null;

  const useEmblaCarousel = mounted && banners.length > 1;
  const urgency =
    typeof urgencyEndWithinMs === "number" && urgencyEndWithinMs > 0 ? urgencyEndWithinMs : null;

  return (
    <section className="bg-white pb-6 sm:pb-8">
      <div className="mx-auto max-w-7xl max-lg:px-0 max-lg:pt-0 px-4 pt-5 sm:px-6 sm:pt-6">
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_24px_64px_-18px_rgba(18,70,62,0.18)] ring-1 ring-zinc-200/80 max-lg:rounded-none max-lg:border-0 max-lg:shadow-none max-lg:ring-0">
          {useEmblaCarousel ? (
            <Carousel opts={{ loop: banners.length > 1 }}>
              <CarouselContent>
                {banners.map((banner, index) => (
                  <CarouselItem key={banner.id}>
                    <BannerFrame
                      banner={banner}
                      priority={index === 0}
                      locale={locale}
                      urgencyEndWithinMs={urgency}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden border-white/60 bg-white/80 text-primary backdrop-blur hover:bg-white md:inline-flex" />
              <CarouselNext className="hidden border-white/60 bg-white/80 text-primary backdrop-blur hover:bg-white md:inline-flex" />
            </Carousel>
          ) : (
            <BannerFrame
              banner={banners[0]!}
              priority
              locale={locale}
              urgencyEndWithinMs={urgency}
            />
          )}
        </div>
      </div>
    </section>
  );
}
