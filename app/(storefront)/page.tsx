"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { ChevronRight, Leaf, Zap, Shield, Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks/useProducts";
import { BreederRibbon } from "@/components/storefront/BreederRibbon";
import { formatPrice } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

// ─── Hero Search Bar ───────────────────────────────────────────────────────────

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
          placeholder={t("ค้นหาสินค้าหรือแบรนด์ที่คุณชอบ...", "Search products or brands you like...")}
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

// ─── Animation Variants ────────────────────────────────────────────────────────

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

// ─── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: ReturnType<typeof useProducts>["products"][number] }) {
  const { t } = useLanguage();
  const glassBadge = "rounded-full border border-white/30 bg-white/20 px-2 py-0.5 text-[10px] font-medium backdrop-blur-md";
  const glassChip = "rounded-full border border-zinc-200/70 bg-white/70 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm";

  return (
    <motion.div
      variants={cardVariant}
      className="group overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition-shadow hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-zinc-50">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Leaf className="h-10 w-10 text-zinc-200" />
          </div>
        )}
        {product.breeders && (
          <Link
            href={`/shop?breeder=${product.breeders.id}`}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/30 bg-white/20 shadow-md backdrop-blur-md transition-transform duration-200 hover:scale-110"
          >
            {product.breeders.logo_url ? (
              <span className="relative h-full w-full">
                <Image src={product.breeders.logo_url} alt={product.breeders.name} fill className="object-contain p-1" unoptimized />
              </span>
            ) : (
              <Leaf className="h-5 w-5 text-primary/60" />
            )}
          </Link>
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <span className={`absolute left-2 top-2 ${glassBadge} text-red-800`}>
            {t("เหลือน้อย", "Low Stock")}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4 sm:p-4">
        {product.breeders && (
          <Link
            href={`/shop?breeder=${product.breeders.id}`}
            onClick={(e) => e.stopPropagation()}
            className="mb-0.5 inline-block max-w-fit text-xs font-semibold text-primary underline-offset-2 hover:underline"
          >
            {product.breeders.name}
          </Link>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900">
          {product.name}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {product.flowering_type && (
            <span className={`${glassChip} text-zinc-700`}>{product.flowering_type}</span>
          )}
          {product.seed_type && (
            <span className={`${glassChip} text-zinc-700`}>{product.seed_type}</span>
          )}
          {product.thc_percent && (
            <span className={`${glassChip} text-primary`}>THC {product.thc_percent}%</span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-base font-bold text-primary">
            {product.price > 0 ? `${formatPrice(product.price)}+` : t("สอบถาม", "Inquire")}
          </span>
          <Button
            size="sm"
            className="h-8 bg-primary text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-primary/90 active:scale-95"
            asChild
          >
            <Link href={`/product/${product.id}`}>{t("ดูสินค้า", "View")}</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Home Page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { products, isLoading } = useProducts({ limit: 8, autoFetch: true });
  const { t } = useLanguage();
  const { settings: siteSettings } = useSiteSettings();
  const useAnimatedSvg =
    siteSettings.hero_bg_mode === "animated_svg" && !!siteSettings.hero_svg_code?.trim();

  const features = [
    {
      icon: Shield,
      label: t("คัดสรรคุณภาพ", "Quality Seeds"),
      sub: t("ผ่านการตรวจสอบทุกล็อต", "Every batch tested & verified"),
    },
    {
      icon: Package,
      label: t("จัดส่งรวดเร็ว", "Fast Shipping"),
      sub: t("แพ็กเกจมิดชิด ปลอดภัย", "Discreet & secure packaging"),
    },
    {
      icon: Zap,
      label: t("สายพันธุ์หายาก", "Rare Strains"),
      sub: t("นำเข้าจาก Breeder ชั้นนำ", "Imported from top breeders"),
    },
  ];

  return (
    <div className="bg-white">
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden bg-zinc-900">
        {useAnimatedSvg ? (
          <div
            className="absolute inset-0 [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: siteSettings.hero_svg_code! }}
          />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center animate-ken-burns opacity-40"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1601412436405-1f0c6b50921f?w=1600&q=80')",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/60 via-zinc-900/40 to-zinc-900/80" />

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
              className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              {t("เมล็ดพันธุ์คุณภาพ", "Quality Seeds")}
              <br />
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

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-8 w-5 rounded-full border-2 border-white/40 p-1">
            <div className="mx-auto h-2 w-1 rounded-full bg-white/60" />
          </div>
        </div>
      </section>

      {/* ── BREEDERS SHOWCASE ─────────────────────────────────────────────── */}
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Leaf className="h-3.5 w-3.5" />
                {t("แบรนด์ชั้นนำ", "World-Class Breeders")}
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
                {t("Breeders ที่เราคัดสรร", "Our Trusted Partners")}
              </h2>
            </div>
            <Link
              href="/breeders"
              className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex"
            >
              {t("ดูทั้งหมด", "View All")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <BreederRibbon />
          <div className="mt-6 flex justify-center sm:hidden">
            <Link href="/breeders">
              <Button variant="outline" size="sm" className="gap-1.5 text-primary">
                {t("ดู Breeder ทั้งหมด", "View All Breeders")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES STRIP ────────────────────────────────────────────────── */}
      <section className="border-b border-zinc-100 bg-zinc-50">
        <div className="mx-auto grid max-w-5xl grid-cols-1 divide-y divide-zinc-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="flex items-center gap-3 px-6 py-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800">{f.label}</p>
                  <p className="text-xs text-zinc-500">{f.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── BESTSELLERS ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
        >
          <motion.div variants={cardVariant} className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("สินค้ายอดนิยม", "Popular")}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-zinc-900 sm:text-3xl">
                {t("สินค้าแนะนำ", "Bestsellers")}
              </h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              <Link href="/shop">
                {t("ดูทั้งหมด", "View All")} <ChevronRight className="ml-0.5 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-zinc-100">
                  <div className="aspect-square animate-pulse bg-zinc-100" />
                  <div className="space-y-2 p-4">
                    <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100" />
                    <div className="h-4 animate-pulse rounded bg-zinc-100" />
                    <div className="h-8 animate-pulse rounded bg-zinc-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Leaf className="h-10 w-10 text-zinc-200" />
              <p className="text-sm text-zinc-400">
                {t("กำลังเพิ่มสินค้าเร็วๆ นี้", "Products coming soon")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────────── */}
      <section className="mx-4 mb-14 overflow-hidden rounded-3xl bg-primary sm:mx-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 px-6 py-10 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="text-xl font-bold text-white sm:text-2xl">
              {t("สมัครสมาชิกฟรี", "Join Free")}
            </h3>
            <p className="mt-1 text-sm text-white/80">
              {t(
                "รับสิทธิพิเศษและข้อเสนอ Wholesale สำหรับลูกค้า VIP",
                "Get exclusive deals and Wholesale offers for VIP members"
              )}
            </p>
          </div>
          <Button
            asChild
            className="shrink-0 border-2 border-white bg-transparent px-6 py-2.5 text-sm font-semibold text-white hover:bg-white hover:text-primary"
          >
            <Link href="/profile">{t("สมัครสมาชิก", "Sign Up")}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
