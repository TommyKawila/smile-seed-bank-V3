"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BlogCategoryPublic } from "@/lib/blog-service";

export function MagazineCategoryPills({ categories }: { categories: BlogCategoryPublic[] }) {
  const sp = useSearchParams();
  const active = sp.get("category") ?? "";

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-white/5 pb-8 pt-2"
      aria-label="Categories"
    >
      <Link
        href="/blog"
        scroll={false}
        className={`rounded-full px-4 py-2 text-xs font-medium transition ${
          !active
            ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/35"
            : "text-zinc-500 hover:text-zinc-200"
        }`}
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/blog?category=${encodeURIComponent(c.slug)}`}
          scroll={false}
          className={`rounded-full px-4 py-2 text-xs font-medium transition ${
            active === c.slug
              ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/35"
              : "text-zinc-500 hover:text-zinc-200"
          }`}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
