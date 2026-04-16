"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, Search } from "lucide-react";
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

function HeroSearchBar({ t }: { t: (th: string, en: string) => string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
  };
  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-xl"
    >
      <div className="flex rounded-sm border border-white/25 bg-white/10 shadow-xl backdrop-blur-md transition-all focus-within:border-emerald-400/40 focus-within:ring-1 focus-within:ring-emerald-500/25">
        <span className="flex items-center pl-4 text-zinc-400">
          <Search className="h-5 w-5" />
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t(
            "ค้นหาสินค้าหรือแบรนด์ที่คุณชอบ...",
            "Search products or brands you like..."
          )}
          className="min-h-12 flex-1 bg-transparent px-3 py-3 text-base text-white placeholder:text-zinc-400 focus:outline-none sm:min-h-14 sm:py-4"
        />
        <button
          type="submit"
          className="rounded-r-sm bg-emerald-800 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-900 sm:px-5"
        >
          {t("ค้นหา", "Search")}
        </button>
      </div>
    </motion.form>
  );
}

const STATIC_HERO_FALLBACK =
  "https://images.unsplash.com/photo-1601412436405-1f0c6b50921f?w=1600&q=80";

export function Hero() {
  const { t } = useLanguage();
  const { settings: siteSettings, isLoading } = useSiteSettings();

  const useAnimatedSvg =
    !isLoading &&
    siteSettings.hero_bg_mode === "animated_svg" &&
    isHeroSvgMarkup(siteSettings.hero_svg_code);

  const videoUrl = resolvePublicAssetUrl(siteSettings.hero_video_url);
  const useVideo =
    !isLoading &&
    siteSettings.hero_bg_mode === "video" &&
    Boolean(videoUrl);

  const staticBgUrl =
    resolvePublicAssetUrl(siteSettings.hero_static_image_url) ?? STATIC_HERO_FALLBACK;

  return (
    <section
      className={cn(
        "relative flex min-h-[88vh] items-center justify-center overflow-hidden bg-zinc-900",
        playfair.variable,
        heroMono.variable
      )}
    >
      {isLoading ? (
        <div className="absolute inset-0 z-0 bg-zinc-900">
          <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-zinc-800" />
        </div>
      ) : useAnimatedSvg ? (
        <div
          className="absolute inset-0 z-0 [&>svg]:pointer-events-none [&>svg]:block [&>svg]:h-full [&>svg]:w-full [&>svg]:min-h-full"
          dangerouslySetInnerHTML={{
            __html: normalizeHeroSvgHtml(siteSettings.hero_svg_code),
          }}
        />
      ) : useVideo && videoUrl ? (
        <video
          className="absolute inset-0 z-0 h-full w-full object-cover opacity-40"
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden
        />
      ) : (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center animate-ken-burns opacity-40"
          style={{ backgroundImage: `url('${staticBgUrl}')` }}
        />
      )}

      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-zinc-900/60 via-zinc-900/40 to-zinc-900/80" />

      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center">
        <div className="space-y-6 sm:space-y-7">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="font-[family-name:var(--font-hero-mono)] text-[10px] uppercase tracking-[0.22em] text-white/70 sm:text-[11px]"
          >
            {t(
              "ที่ตั้ง: แม่สาย เชียงใหม่ | ก่อตั้ง ค.ศ. 2025",
              "LOCATION: MAE SAO, CHIANG MAI | EST. 2025"
            )}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease: "easeOut" }}
            className="font-[family-name:var(--font-hero-display)] text-[2rem] font-medium leading-[1.12] tracking-tighter text-white sm:text-5xl lg:text-6xl"
          >
            <span className="block">{t("เมล็ดพันธุ์คุณภาพ", "Quality Seeds")}</span>
            <span className="mt-3 block text-white/88 sm:mt-4">
              {t("คัดสรรเพื่อคุณ", "Selected for You")}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.14, ease: "easeOut" }}
            className="mx-auto max-w-lg text-base font-light leading-relaxed tracking-[0.02em] text-zinc-200 sm:text-lg sm:leading-[1.75]"
          >
            {t(
              "แหล่งรวมสายพันธุ์พรีเมียมจาก Breeder ชั้นนำทั่วโลก พร้อมส่งตรงถึงมือคุณด้วยความปลอดภัยและความใส่ใจ",
              "Your source for premium genetics from the world's top breeders — delivered safely and discreetly."
            )}
          </motion.p>

          <HeroSearchBar t={t} />

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32, ease: "easeOut" }}
            className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          >
            <Button
              asChild
              className="h-12 min-w-[168px] rounded-sm border-0 bg-emerald-800 px-6 text-base font-medium text-white shadow-md shadow-emerald-950/25 transition-colors hover:bg-emerald-900"
            >
              <Link href="/shop">
                {t("ดูสินค้าทั้งหมด", "Shop Now")}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-12 min-w-[168px] rounded-sm border border-white/55 bg-transparent px-6 text-base font-normal text-white shadow-none transition-colors hover:border-white/80 hover:bg-white/[0.06]"
            >
              <Link href="/blog">{t("อ่าน Smile Seed Blog", "Read Smile Seed Blog")}</Link>
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 animate-bounce">
        <div className="h-8 w-5 rounded-full border-2 border-white/40 p-1">
          <div className="mx-auto h-2 w-1 rounded-full bg-white/60" />
        </div>
      </div>
    </section>
  );
}
