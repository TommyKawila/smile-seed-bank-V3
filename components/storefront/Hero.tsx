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
    return <Skeleton className="h-full min-h-[44vh] w-full rounded-none bg-zinc-200 lg:min-h-0" />;
  }
  if (useAnimatedSvg) {
    return (
      <div
        className="h-full min-h-[44vh] w-full bg-zinc-100 [&>svg]:pointer-events-none [&>svg]:block [&>svg]:h-full [&>svg]:w-full [&>svg]:min-h-full [&>svg]:object-cover lg:min-h-0"
        dangerouslySetInnerHTML={{ __html: normalizeHeroSvgHtml(svgHtml) }}
      />
    );
  }
  if (useVideo && videoUrl) {
    return (
      <video
        className="h-full min-h-[44vh] w-full object-cover lg:min-h-0"
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
      className="h-full min-h-[44vh] w-full bg-cover bg-center animate-ken-burns lg:min-h-0"
      style={{ backgroundImage: `url('${staticBgUrl}')` }}
    />
  );
}

export function Hero() {
  const { t } = useLanguage();
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
        "relative overflow-hidden bg-zinc-50",
        playfair.variable,
        heroMono.variable
      )}
    >
      <div className="grid min-h-[88vh] lg:grid-cols-2 lg:items-stretch">
        <div className="relative z-10 order-2 flex flex-col justify-center px-6 py-16 sm:px-10 sm:py-20 lg:order-1 lg:max-w-xl lg:justify-center lg:py-24 lg:pl-12 lg:pr-10 xl:pl-16 xl:pr-14">
          <div className="space-y-7 sm:space-y-8">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="font-[family-name:var(--font-hero-mono)] text-[9px] font-medium leading-relaxed tracking-[0.22em] text-zinc-500 sm:text-[10px] sm:leading-relaxed sm:tracking-[0.26em]"
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
              className="font-[family-name:var(--font-hero-display)] text-[1.85rem] font-medium leading-[1.35] tracking-tight text-zinc-900 sm:text-4xl sm:leading-[1.28] lg:text-[2.35rem] lg:leading-[1.25] xl:text-5xl xl:leading-[1.2]"
            >
              {t(
                "คัดสรรพันธุกรรมระดับโลก สู่มือคุณ",
                "World-class genetics, curated for you"
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }}
              className="max-w-md text-[15px] font-light leading-[1.85] tracking-wide text-zinc-600 sm:text-base sm:leading-[1.82]"
            >
              {t(
                "จากร้านขายเมล็ดพันธุ์ยุคใต้ดิน สู่คลังเมล็ดพันธุ์แท้ที่สายเขียวรุ่นเก๋าไว้วางใจที่สุด การันตีคุณภาพจากประสบการณ์จริงที่ยาวนานเกือบ 10 ปี",
                "From an underground-era seed shop to a vault of authentic genetics trusted by seasoned growers — quality backed by nearly ten years of real experience."
              )}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2, ease: "easeOut" }}
              className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
            >
              <Button
                asChild
                className="h-11 min-w-[200px] rounded-sm border border-primary bg-primary px-6 text-sm font-medium text-primary-foreground shadow-none transition-colors hover:bg-primary/90"
              >
                <Link href="/seeds">
                  {t("เข้าสู่คลังพันธุกรรม", "Enter the genetic vault")}
                  <ChevronRight className="ml-1 h-4 w-4 opacity-90" strokeWidth={1.75} />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 min-w-[200px] rounded-sm border border-zinc-300 bg-transparent px-6 text-sm font-normal text-zinc-800 shadow-none transition-colors hover:border-primary/40 hover:bg-zinc-50"
              >
                <Link href="/blog">
                  {t("เข้าสู่คลังความรู้สายเขียว", "Enter the grower's knowledge vault")}
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>

        <div className="relative order-1 min-h-[44vh] lg:order-2 lg:min-h-[88vh]">
          <HeroMediaPanel
            isLoading={isLoading}
            useAnimatedSvg={Boolean(useAnimatedSvg)}
            useVideo={useVideo}
            videoUrl={videoUrl}
            staticBgUrl={staticBgUrl}
            svgHtml={siteSettings.hero_svg_code ?? ""}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-900/25 via-transparent to-zinc-900/10 lg:bg-gradient-to-l lg:from-transparent lg:via-transparent lg:to-zinc-50/90" />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-zinc-900/5" />
        </div>
      </div>
    </section>
  );
}
