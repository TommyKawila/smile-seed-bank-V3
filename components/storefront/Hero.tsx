"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, Leaf, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { isHeroSvgMarkup, normalizeHeroSvgHtml } from "@/lib/hero-svg";
import { resolvePublicAssetUrl } from "@/lib/public-storage-url";

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
      <div className="flex rounded-2xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-md transition-all focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
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
          className="rounded-r-2xl bg-primary/90 px-4 font-semibold text-white transition-colors hover:bg-primary sm:px-5"
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
    <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden bg-zinc-900">
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
        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
              <Leaf className="h-3 w-3" />
              {t("เมล็ดพันธุ์พรีเมียม", "Premium Cannabis Seeds")}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="flex flex-col gap-y-4 text-4xl font-extrabold leading-snug tracking-tight text-white sm:gap-y-5 sm:text-5xl lg:text-6xl"
          >
            <span>{t("เมล็ดพันธุ์คุณภาพ", "Quality Seeds")}</span>
            <span className="text-primary">
              {t("คัดสรรเพื่อคุณ", "Selected for You")}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="mx-auto max-w-lg text-base leading-relaxed text-zinc-300 sm:text-lg"
          >
            {t(
              "แหล่งรวมสายพันธุ์พรีเมียมจาก Breeder ชั้นนำทั่วโลก พร้อมส่งตรงถึงมือคุณด้วยความปลอดภัยและความใส่ใจ",
              "Your source for premium genetics from the world's top breeders — delivered safely and discreetly."
            )}
          </motion.p>

          <HeroSearchBar t={t} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button
              asChild
              className="h-12 min-w-[160px] bg-primary px-6 text-base font-semibold text-white shadow-lg shadow-primary/30 transition-transform hover:bg-primary/90 active:scale-95"
            >
              <Link href="/shop">
                {t("ดูสินค้าทั้งหมด", "Shop Now")}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 min-w-[160px] border-white/30 bg-white/10 px-6 text-base font-medium text-white backdrop-blur hover:bg-white/20"
            >
              <Link href="/blog">{t("อ่านบทความ", "Read Blog")}</Link>
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
