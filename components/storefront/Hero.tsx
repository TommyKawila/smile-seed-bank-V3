"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { JetBrains_Mono, Playfair_Display } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { isHeroSvgMarkup, normalizeHeroSvgHtml } from "@/lib/hero-svg";
import { resolvePublicAssetUrl } from "@/lib/public-storage-url";
import { cn } from "@/lib/utils";
import {
  resolveSectionHeading,
  type SectionTitle,
} from "@/lib/homepage-section-title";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-hero-display" });
const heroMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-hero-mono" });

const STATIC_HERO_FALLBACK =
  "https://images.unsplash.com/photo-1601412436405-1f0c6b50921f?w=1800&q=85";

function HeroMediaPanel({
  isLoading,
  useAnimatedSvg,
  useVideo,
  videoUrl,
  staticBgUrl,
  svgHtml,
}: {
  isLoading: boolean;
  useAnimatedSvg: boolean;
  useVideo: boolean;
  videoUrl: string | null;
  staticBgUrl: string;
  svgHtml: string;
}) {
  if (isLoading) {
    return <Skeleton className="h-full min-h-0 w-full rounded-none bg-zinc-200" />;
  }
  if (useAnimatedSvg) {
    return (
      <div
        className="h-full min-h-0 w-full bg-zinc-100 [&>svg]:pointer-events-none [&>svg]:block [&>svg]:h-full [&>svg]:w-full [&>svg]:min-h-full [&>svg]:object-cover"
        dangerouslySetInnerHTML={{ __html: normalizeHeroSvgHtml(svgHtml) }}
      />
    );
  }
  if (useVideo && videoUrl) {
    return (
      <video
        className="h-full min-h-0 w-full object-cover"
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
      />
    );
  }
  return (
    <div
      className="h-full min-h-0 w-full bg-cover bg-center animate-ken-burns"
      style={{ backgroundImage: `url('${staticBgUrl}')` }}
    />
  );
}

export default function Hero({ sectionTitle }: { sectionTitle?: SectionTitle }) {
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

  return (
    <section
      className={cn(
        "relative flex min-h-0 w-full flex-col overflow-hidden rounded-none bg-zinc-50 max-lg:-mt-[4.5rem] max-lg:max-h-[100svh] max-lg:w-full lg:mt-0 lg:max-h-none",
        playfair.variable,
        heroMono.variable
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:min-h-[88vh] lg:max-h-none lg:grid-cols-2 lg:items-stretch">
        <div className="relative z-10 order-2 -mt-20 flex flex-col justify-end bg-gradient-to-t from-white from-0% via-white via-[88%] to-transparent to-100% px-4 pb-5 pt-5 sm:-mt-24 sm:px-8 sm:pb-8 lg:order-1 lg:mt-0 lg:max-w-xl lg:justify-center lg:bg-transparent lg:bg-none lg:px-10 lg:py-24 lg:pl-12 lg:pr-10 lg:pb-24 xl:pl-16 xl:pr-14">
          <div className="space-y-3 sm:space-y-4 lg:space-y-7 xl:space-y-8">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="font-[family-name:var(--font-hero-mono)] text-[9px] font-semibold leading-relaxed tracking-[0.2em] text-emerald-900/75 sm:text-[10px] sm:tracking-[0.26em] lg:text-[10px] lg:font-medium lg:text-zinc-500"
            >
              {t(
                "ก่อตั้ง ค.ศ. 2018 // ร้านเมล็ดพันธุ์แห่งรอยยิ้มยุคแรกของไทย",
                "EST. 2018 // THAILAND'S FIRST SMILE-ERA SEED SHOP"
              )}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05, ease: "easeOut" }}
              className="font-[family-name:var(--font-hero-display)] text-[1.65rem] font-medium leading-[1.3] tracking-tight text-zinc-900 sm:text-4xl sm:leading-[1.28] lg:text-[2.35rem] lg:leading-[1.25] xl:text-5xl xl:leading-[1.2]"
            >
              {headline}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }}
              className="max-w-md text-sm font-light leading-relaxed tracking-wide text-zinc-500 opacity-90 sm:text-[15px] lg:text-base"
            >
              {t(
                "จากร้านลับสู่คลังเมล็ดพันธุ์แท้ที่มือโปรวางใจ การันตีคุณภาพจากประสบการณ์จริงเกือบ 10 ปี",
                "From underground roots to a vault of authentic genetics. Quality backed by a decade of real experience."
              )}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2, ease: "easeOut" }}
              className="flex flex-col gap-2.5 pt-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:pt-2"
            >
              <Button
                asChild
                className="h-11 min-w-[200px] rounded-sm border border-primary bg-primary px-6 text-sm font-medium text-primary-foreground shadow-none transition-colors hover:bg-primary/90"
              >
                <Link href="/seeds">
                  {t("เลือกซื้อเมล็ดพันธุ์", "Shop Seeds")}
                  <ChevronRight className="ml-1 h-4 w-4 opacity-90" strokeWidth={1.75} />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 min-w-[200px] rounded-sm border border-zinc-300 bg-transparent px-6 text-sm font-normal text-zinc-800 shadow-none transition-colors hover:border-primary/40 hover:bg-zinc-50"
              >
                <Link href="/blog">
                  {t("บทความ/คลังความรู้", "Grower's Guide")}
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>

        <div className="relative order-1 h-[65svh] w-full flex-shrink-0 overflow-hidden lg:order-2 lg:h-auto lg:min-h-[88vh]">
          <HeroMediaPanel
            isLoading={isLoading}
            useAnimatedSvg={Boolean(useAnimatedSvg)}
            useVideo={useVideo}
            videoUrl={videoUrl}
            staticBgUrl={staticBgUrl}
            svgHtml={siteSettings.hero_svg_code ?? ""}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-900/10 via-transparent to-zinc-900/5 max-lg:from-zinc-900/15 lg:bg-gradient-to-l lg:from-transparent lg:via-transparent lg:to-zinc-50/90" />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-zinc-900/5 max-lg:hidden" />
        </div>
      </div>
    </section>
  );
}
