"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { isHeroSvgMarkup, normalizeHeroSvgHtml } from "@/lib/hero-svg";
import { resolvePublicAssetUrl } from "@/lib/public-storage-url";
import { cn, getLocalizedPath } from "@/lib/utils";
import {
  resolveSectionHeading,
  type SectionTitle,
} from "@/lib/homepage-section-title";
import {
  DEFAULT_HERO_CTA_BUTTONS,
  heroCtaButtonClassName,
  heroCtaShowsChevron,
  type HeroCtaButtonPayload,
} from "@/lib/homepage-hero-cta";

const HERO_MONO =
  "font-[family-name:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace]";

const STATIC_HERO_FALLBACK =
  "https://images.unsplash.com/photo-1601412436405-1f0c6b50921f?w=1800&q=85";

function HeroMediaPanel({
  isLoading,
  useAnimatedSvg,
  useVideo,
  videoUrl,
  staticBgUrl,
  svgHtml,
  heroCarousel,
  staticImageAlt,
}: {
  isLoading: boolean;
  useAnimatedSvg: boolean;
  useVideo: boolean;
  videoUrl: string | null;
  staticBgUrl: string;
  svgHtml: string;
  heroCarousel?: ReactNode;
  staticImageAlt: string;
}) {
  if (heroCarousel) {
    return (
      <div className="relative h-full w-full overflow-hidden p-0">{heroCarousel}</div>
    );
  }
  if (isLoading) {
    return <Skeleton className="h-full w-full rounded-none bg-zinc-200" />;
  }
  if (useAnimatedSvg) {
    return (
      <div
        className="h-full w-full bg-zinc-100 [&>svg]:pointer-events-none [&>svg]:block [&>svg]:h-full [&>svg]:w-full [&>svg]:min-h-full [&>svg]:object-cover"
        dangerouslySetInnerHTML={{ __html: normalizeHeroSvgHtml(svgHtml) }}
      />
    );
  }
  if (useVideo && videoUrl) {
    return (
      <video
        className="h-full w-full object-cover"
        src={videoUrl}
        preload="none"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
      />
    );
  }
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image
        src={staticBgUrl}
        alt={staticImageAlt.trim() || "Smile Seed Bank"}
        fill
        priority
        fetchPriority="high"
        loading="eager"
        className="object-cover animate-ken-burns"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
}

export default function Hero({
  sectionTitle,
  heroCarousel,
  heroCtaButtons,
}: {
  sectionTitle?: SectionTitle;
  heroCarousel?: ReactNode;
  heroCtaButtons?: HeroCtaButtonPayload[];
}) {
  const { t, locale } = useLanguage();
  const headline = resolveSectionHeading(
    locale,
    sectionTitle,
    "คัดสรรพันธุกรรมระดับโลก สู่มือคุณ",
    "World-class genetics, curated for you"
  );
  const { settings: siteSettings, isLoading } = useSiteSettings();

  const useAnimatedSvg =
    !isLoading &&
    siteSettings.hero_bg_mode === "animated_svg" &&
    isHeroSvgMarkup(siteSettings.hero_svg_code);

  const videoUrl = resolvePublicAssetUrl(siteSettings.hero_video_url);
  const useVideo =
    !isLoading && siteSettings.hero_bg_mode === "video" && Boolean(videoUrl);

  const staticBgUrl =
    resolvePublicAssetUrl(siteSettings.hero_static_image_url) ?? STATIC_HERO_FALLBACK;

  const ctaButtons =
    heroCtaButtons && heroCtaButtons.length > 0 ? heroCtaButtons : DEFAULT_HERO_CTA_BUTTONS;

  return (
    <section
      className="relative flex w-full flex-col overflow-hidden rounded-none bg-zinc-50 max-lg:max-h-[100svh] max-lg:w-full lg:max-h-none"
    >
      <div className="flex flex-1 flex-col lg:grid lg:min-h-0 lg:max-h-none lg:grid-cols-2 lg:items-stretch lg:gap-0 lg:min-w-0">
        <div className="relative z-10 order-2 -mt-20 flex min-h-[auto] w-full min-w-0 flex-1 flex-col justify-end bg-white px-4 pb-5 pt-5 sm:-mt-24 sm:px-8 sm:pb-8 md:py-20 lg:order-1 lg:mt-0 lg:min-w-0 lg:max-w-xl lg:w-full lg:justify-center lg:self-stretch lg:bg-transparent lg:px-10 lg:py-12 lg:pl-12 lg:pr-10 xl:py-20 xl:pl-16 xl:pr-14">
          <div
            className={cn(
              "w-full lg:min-w-0 space-y-3 break-words sm:space-y-4 lg:space-y-7 xl:space-y-8",
              "animate-in fade-in slide-in-from-left-5 duration-500 fill-mode-both"
            )}
          >
            <p className={cn(HERO_MONO, "text-[9px] font-bold leading-relaxed tracking-[0.2em] text-emerald-950 break-words sm:text-[10px] sm:tracking-[0.26em] lg:text-[10px]")}>
              {t(
                "ก่อตั้ง ค.ศ. 2018 // ร้านเมล็ดพันธุ์แห่งรอยยิ้มยุคแรกของไทย",
                "EST. 2018 // THAILAND'S FIRST SMILE-ERA SEED SHOP"
              )}
            </p>

            <h1 className="font-sans text-[1.65rem] font-bold leading-[1.3] tracking-tight text-zinc-900 break-words sm:text-4xl sm:leading-[1.28] lg:text-[2.35rem] lg:leading-[1.25] xl:text-5xl xl:leading-[1.2]">
              {headline}
            </h1>

            <p className="max-w-md text-sm font-normal leading-relaxed tracking-wide text-zinc-700 break-words sm:text-[15px] lg:text-base">
              {t(
                "จากร้านลับสู่คลังเมล็ดพันธุ์แท้ที่มือโปรวางใจ การันตีคุณภาพจากประสบการณ์จริงเกือบ 10 ปี",
                "From underground roots to a vault of authentic genetics. Quality backed by a decade of real experience."
              )}
            </p>

            <div className="grid grid-cols-1 gap-2.5 pt-0.5 sm:grid-cols-2 sm:gap-3 sm:pt-2">
              {ctaButtons.map((btn) => {
                const label = locale === "en" ? btn.labelEn : btn.labelTh;
                const href = getLocalizedPath(btn.href, locale);
                const showChevron = heroCtaShowsChevron(btn.color);
                return (
                  <Button
                    key={btn.id}
                    asChild
                    variant="ghost"
                    className={cn(
                      "h-11 w-full rounded-lg px-6 text-sm shadow-none transition-colors sm:min-w-0",
                      heroCtaButtonClassName(btn.color)
                    )}
                  >
                    <Link href={href} aria-label={label}>
                      {label}
                      {showChevron ? (
                        <ChevronRight className="ml-1 h-4 w-4 opacity-90" strokeWidth={1.75} aria-hidden />
                      ) : null}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative order-1 w-full shrink-0 overflow-hidden bg-zinc-100 aspect-[392/429] lg:order-2 lg:aspect-[617/712] lg:h-auto lg:min-h-0 lg:w-full lg:min-w-0">
          <HeroMediaPanel
            isLoading={isLoading}
            useAnimatedSvg={Boolean(useAnimatedSvg)}
            useVideo={useVideo}
            videoUrl={videoUrl}
            staticBgUrl={staticBgUrl}
            svgHtml={siteSettings.hero_svg_code ?? ""}
            heroCarousel={heroCarousel}
            staticImageAlt={
              headline.trim()
                ? headline
                : t(
                    "คัดสรรพันธุกรรมระดับโลก สู่มือคุณ",
                    "World-class genetics, curated for you"
                  )
            }
          />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-zinc-900/5 max-lg:hidden" />
        </div>
      </div>
    </section>
  );
}
