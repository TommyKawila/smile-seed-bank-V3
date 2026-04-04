"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { ChevronRight, Leaf, Zap, Shield, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks/useProducts";
import { BreederRibbon } from "@/components/storefront/BreederRibbon";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import { formatPrice } from "@/lib/utils";
import { productDetailHref } from "@/lib/product-utils";
import { shopBreederHref } from "@/lib/breeder-slug";
import { useLanguage } from "@/context/LanguageContext";
import { Hero } from "@/components/storefront/Hero";
import {
  labelForSeedTypeBadge,
  productCardFloweringChipLabel,
} from "@/lib/seed-type-filter";

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
  const compactSpecChip = `${glassChip} bg-muted/50 text-[9px] font-medium tracking-wide text-zinc-700`;
  const compactSpecChipThc = `${glassChip} bg-muted/50 text-[9px] font-medium tracking-wide text-primary`;
  const floweringLabel = productCardFloweringChipLabel(product);
  const seedLabel = labelForSeedTypeBadge(product.seed_type);

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
            href={shopBreederHref(product.breeders)}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/30 bg-white/20 shadow-md backdrop-blur-md transition-transform duration-200 hover:scale-110"
          >
            <BreederLogoImage
              src={product.breeders.logo_url}
              breederName={product.breeders.name}
              width={40}
              height={40}
              className="rounded-xl"
              imgClassName="object-contain p-1"
              sizes="40px"
            />
          </Link>
        )}
        {(product.stock ?? 0) <= 5 && (product.stock ?? 0) > 0 && (
          <span className={`absolute left-2 top-2 ${glassBadge} text-red-800`}>
            {t("เหลือน้อย", "Low Stock")}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4 sm:p-4">
        {product.breeders && (
          <Link
            href={shopBreederHref(product.breeders)}
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
          {floweringLabel && <span className={compactSpecChip}>{floweringLabel}</span>}
          {seedLabel && <span className={compactSpecChip}>{seedLabel}</span>}
          {product.thc_percent != null && (
            <span className={compactSpecChipThc}>THC {product.thc_percent}%</span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-base font-bold text-primary">
            {(product.price ?? 0) > 0 ? `${formatPrice(product.price ?? 0)}+` : t("สอบถาม", "Inquire")}
          </span>
          <Button
            size="sm"
            className="h-8 bg-primary text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-primary/90 active:scale-95"
            asChild
          >
            <Link href={productDetailHref(product)}>{t("ดูสินค้า", "View")}</Link>
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
      <Hero />

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
