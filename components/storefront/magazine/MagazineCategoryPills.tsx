"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
      "inline-flex min-h-11 items-center rounded-full border px-4 py-2 font-sans text-sm font-medium tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
      isOn
        ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
        : "border-border bg-card/60 text-foreground/75 hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
    );

  return (
    <nav
      className="flex flex-wrap justify-start gap-2 border-b border-border pb-10 pt-1"
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
