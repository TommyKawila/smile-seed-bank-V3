"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MerchBreederBoxCard } from "@/components/storefront/MerchBreederBoxCard";
import { MerchCategoryBoxCard } from "@/components/storefront/MerchCategoryBoxCard";
import { MerchProductCard } from "@/components/storefront/MerchProductCard";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import { saveCatalogReturnPath } from "@/lib/catalog-return-path";
import {
  merchBreederHref,
  type MerchBreederBox,
  type MerchCategory,
  type MerchCategoryId,
  type MerchStorefrontProduct,
} from "@/lib/merch-catalog";
import { cn, formatPrice } from "@/lib/utils";

const ACCENT_BG: Record<MerchStorefrontProduct["accent"], string> = {
  emerald: "from-emerald-600/50 via-zinc-900 to-zinc-950",
  violet: "from-violet-600/50 via-zinc-900 to-zinc-950",
  amber: "from-amber-500/50 via-zinc-900 to-zinc-950",
  sky: "from-sky-500/50 via-zinc-900 to-zinc-950",
};

export function MerchLandingClient({
  breederSlug,
  categoryId,
  hubBoxes,
  breeder,
  category,
  categoryCounts,
  categories,
  products,
}: {
  breederSlug: string | null;
  categoryId: string | null;
  hubBoxes: MerchBreederBox[];
  breeder: MerchBreederBox | null;
  category: MerchCategory | null;
  categoryCounts: Record<MerchCategoryId, number> | null;
  categories: MerchCategory[];
  products: MerchStorefrontProduct[];
}) {
  const { t, locale } = useLanguage();
  const isEn = locale === "en";
  const [lookId, setLookId] = useState<string | null>(null);

  useEffect(() => {
    let path = "/merch";
    if (breederSlug) {
      path = `/merch?breeder=${encodeURIComponent(breederSlug)}`;
      if (categoryId) path += `&cat=${encodeURIComponent(categoryId)}`;
    }
    saveCatalogReturnPath(path);
  }, [breederSlug, categoryId]);

  const lookProduct = lookId ? products.find((p) => p.id === lookId) ?? null : null;

  const comingSoon = t("เร็วๆ นี้ — ยังไม่เปิดสั่งซื้อ", "Coming soon — not for sale yet");
  const stagger = (i: number): CSSProperties => ({
    animationDelay: `${Math.min(i, 8) * 55}ms`,
  });

  const level: "hub" | "categories" | "products" =
    breeder && category ? "products" : breeder ? "categories" : "hub";

  return (
    <div className={cn("min-h-[60vh] bg-background text-foreground", JOURNAL_PRODUCT_FONT_VARS)}>
      <div className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.18),_transparent_55%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:32px_32px]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          {level !== "hub" ? (
            <Link
              href={level === "products" && breeder ? merchBreederHref(breeder.slug) : "/merch"}
              className="mb-4 inline-flex min-h-12 items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
            >
              <ArrowLeft className="h-4 w-4" />
              {level === "products"
                ? t("กลับไปหมวดของค่าย", "Back to categories")
                : t("กลับไปคลัง Merch", "Back to Merch vault")}
            </Link>
          ) : null}
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-500/90">
            {t("เกียร์สายเขียว", "GROWER GEAR")}
          </p>
          <h1 className="mt-2 max-w-2xl font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {level === "products" && category
              ? isEn
                ? category.labelEn
                : category.labelTh
              : level === "categories" && breeder
                ? breeder.name
                : t("Merchandise", "Merchandise")}
          </h1>
          <p className="mt-2 max-w-xl text-sm font-light text-muted-foreground">
            {level === "products"
              ? t(
                  "เลือกชิ้นที่ใช่ — ดูได้แล้ว สั่งซื้อเร็วๆ นี้",
                  "Browse the drop — preview live, checkout soon."
                )
              : level === "categories" && breeder
                ? isEn
                  ? breeder.taglineEn
                  : breeder.taglineTh
                : t(
                    "เลือกค่าย → เลือกหมวด → จับจองเกียร์ก่อนใคร",
                    "Pick a breeder → choose a category → claim the gear."
                  )}
          </p>
        </div>
      </div>

      {level === "products" && breeder ? (
        <div className="sticky top-16 z-20 border-b border-border bg-background/90 backdrop-blur-md sm:top-20">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="truncate text-sm font-medium text-foreground">
              {breeder.name}
              <span className="mx-2 text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                {isEn ? category?.labelEn : category?.labelTh}
              </span>
            </p>
            <Link
              href={merchBreederHref(breeder.slug)}
              className="shrink-0 text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              {t("เปลี่ยนหมวด", "Change category")}
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {level === "hub" ? (
          hubBoxes.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {t("ยังไม่มีสินค้า Merch ในคลัง", "No merch in the vault yet.")}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hubBoxes.map((b, i) => (
                <div
                  key={b.slug}
                  className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500"
                  style={stagger(i)}
                >
                  <MerchBreederBoxCard
                    breeder={b}
                    productCount={b.productCount}
                    subtitle={isEn ? b.taglineEn : b.taglineTh}
                  />
                </div>
              ))}
            </div>
          )
        ) : null}

        {level === "categories" && breeder && categoryCounts ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c, i) => {
              const n = categoryCounts[c.id];
              return (
                <div
                  key={c.id}
                  className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500"
                  style={stagger(i)}
                >
                  <MerchCategoryBoxCard
                    breederSlug={breeder.slug}
                    category={c}
                    title={isEn ? c.labelEn : c.labelTh}
                    countLabel={t(`${n} ชิ้น`, `${n} items`)}
                  />
                </div>
              );
            })}
          </div>
        ) : null}

        {level === "categories" && breederSlug && !breeder ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {t("ไม่พบค่ายนี้ในคลัง Merch", "This breeder has no merch yet.")}
          </p>
        ) : null}

        {level === "products" ? (
          products.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {t("ยังไม่มีสินค้าในหมวดนี้", "No items in this category yet")}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p, i) => (
                <div
                  key={p.id}
                  className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500"
                  style={stagger(i)}
                >
                  <MerchProductCard
                    product={p}
                    name={isEn ? p.nameEn : p.nameTh}
                    blurb={isEn ? p.blurbEn : p.blurbTh}
                    comingSoonLabel={comingSoon}
                    quickLookLabel={t("ดูด่วน", "Quick look")}
                    onQuickLook={() => setLookId(p.id)}
                  />
                </div>
              ))}
            </div>
          )
        ) : null}
      </div>

      <Dialog open={lookProduct != null} onOpenChange={(o) => !o && setLookId(null)}>
        <DialogContent className="max-w-md border-border bg-card">
          {lookProduct ? (
            <>
              <DialogHeader>
                <DialogTitle>{isEn ? lookProduct.nameEn : lookProduct.nameTh}</DialogTitle>
              </DialogHeader>
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-zinc-900">
                {lookProduct.imageUrl ? (
                  <Image
                    src={lookProduct.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                ) : (
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br",
                      ACCENT_BG[lookProduct.accent]
                    )}
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {isEn ? lookProduct.blurbEn : lookProduct.blurbTh}
              </p>
              <p className="text-lg font-bold tabular-nums text-emerald-400">
                {formatPrice(lookProduct.priceBaht)}
              </p>
              <DialogFooter>
                <Button
                  type="button"
                  className="min-h-11 w-full bg-emerald-600 hover:bg-emerald-500"
                  onClick={() => toast.message(comingSoon)}
                >
                  {t("ใส่ตะกร้า", "Add to cart")}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
