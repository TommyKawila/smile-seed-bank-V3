"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import { useLanguage } from "@/context/LanguageContext";
import { allCategoriesLabel, magazineCategoryLabel } from "@/lib/blog-category-labels";
import { cn } from "@/lib/utils";
import type { BlogCategoryPublic } from "@/lib/blog-service";

export function MagazineCategoryPills({ categories }: { categories: BlogCategoryPublic[] }) {
  const { locale } = useLanguage();
  const sp = useSearchParams();
  const active = sp.get("category") ?? "";

  const pill = (isOn: boolean) =>
    cn(
      "font-sans rounded-sm border px-3.5 py-2 text-sm font-normal tracking-tight transition-colors",
      isOn
        ? "border-emerald-800 bg-emerald-800 text-white shadow-sm hover:bg-emerald-900"
        : "border-zinc-200/90 bg-zinc-50/90 text-zinc-800 hover:border-zinc-300 hover:bg-white"
    );

  return (
    <nav
      className={cn(
        "flex flex-wrap justify-start gap-2 border-b border-[#f3f4f6] pb-10 pt-1",
        JOURNAL_PRODUCT_FONT_VARS
      )}
      aria-label={locale === "th" ? "หมวดบทความ" : "Article categories"}
    >
      <Link href="/blog" scroll={false} className={pill(!active)}>
        {allCategoriesLabel(locale)}
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/blog?category=${encodeURIComponent(c.slug)}`}
          scroll={false}
          className={pill(active === c.slug)}
        >
          {magazineCategoryLabel(c, locale)}
        </Link>
      ))}
    </nav>
  );
}
