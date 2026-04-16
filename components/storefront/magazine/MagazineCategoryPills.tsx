"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { BlogCategoryPublic } from "@/lib/blog-service";

export function MagazineCategoryPills({ categories }: { categories: BlogCategoryPublic[] }) {
  const sp = useSearchParams();
  const active = sp.get("category") ?? "";

  const pill = (isOn: boolean) =>
    cn(
      "rounded-sm border px-3.5 py-2 text-xs font-medium transition-colors",
      isOn
        ? "border-emerald-800 bg-emerald-800 text-white shadow-sm hover:bg-emerald-900"
        : "border-zinc-300 bg-transparent text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
    );

  return (
    <nav className="flex flex-wrap justify-start gap-2 border-b border-[#f3f4f6] pb-10 pt-1" aria-label="Categories">
      <Link href="/blog" scroll={false} className={pill(!active)}>
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/blog?category=${encodeURIComponent(c.slug)}`}
          scroll={false}
          className={pill(active === c.slug)}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
