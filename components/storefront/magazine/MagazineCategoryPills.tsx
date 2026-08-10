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
      "inline-flex min-h-10 items-center rounded-full border px-4 py-2 font-sans text-sm font-medium tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/35",
      isOn
        ? "border-zinc-600 bg-zinc-800/80 text-zinc-100"
        : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-300"
    );

  return (
    <nav
      className="flex flex-wrap justify-start gap-2 border-b border-border/60 pb-10 pt-1"
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
