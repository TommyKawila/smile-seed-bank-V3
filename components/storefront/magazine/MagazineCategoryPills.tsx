"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BlogCategoryPublic } from "@/lib/blog-service";

export function MagazineCategoryPills({ categories }: { categories: BlogCategoryPublic[] }) {
  const sp = useSearchParams();
  const active = sp.get("category") ?? "";

  return (
    <nav
      className="flex flex-wrap gap-3 border-b border-[#f3f4f6] pb-10 pt-2"
      aria-label="Categories"
    >
      <Link
        href="/blog"
        scroll={false}
        className={`rounded-full px-4 py-2 text-xs font-medium transition ${
          !active
            ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
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
              ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          }`}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
