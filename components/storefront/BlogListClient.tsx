"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Calendar, Tag } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { formatDate } from "@/lib/utils";
import type { Blog } from "@/types/supabase";

function BlogCard({ blog }: { blog: Blog }) {
  const { t, locale } = useLanguage();
  const title = locale === "en" ? (blog.title_en ?? blog.title) : (blog.title ?? blog.title_en);
  const excerpt = locale === "en" ? (blog.excerpt_en ?? blog.excerpt) : (blog.excerpt ?? blog.excerpt_en);

  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative h-48 w-full overflow-hidden bg-zinc-100">
        {blog.image_url ? (
          <Image
            src={blog.image_url}
            alt={title ?? "Blog post"}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-primary/5">
            <BookOpen className="h-10 w-10 text-primary/20" />
          </div>
        )}
        {blog.category && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-primary backdrop-blur-sm">
            {blog.category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 line-clamp-2 text-base font-bold leading-tight text-zinc-900 group-hover:text-primary">
          {title}
        </h3>
        {excerpt && (
          <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-zinc-500">{excerpt}</p>
        )}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Calendar className="h-3.5 w-3.5" />
            <time dateTime={blog.created_at}>{formatDate(blog.created_at)}</time>
          </div>
          <span className="text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
            {t("บทความแนะนำ →", "Read more →")}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function BlogListClient({ blogs }: { blogs: Blog[] }) {
  const { t, locale } = useLanguage();
  const featured = blogs[0] ?? null;
  const rest = blogs.slice(1);

  if (blogs.length === 0) {
    return (
      <div className="py-20 text-center text-zinc-400">
        <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-30" />
        <p>{t("ยังไม่มีบทความในขณะนี้", "No articles yet")}</p>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-12 text-center">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <BookOpen className="h-3.5 w-3.5" />
          {t("บทความ & ความรู้", "Articles & Knowledge")}
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
          {t("เรียนรู้ไปพร้อมกัน", "Learn Together")}
        </h1>
        <p className="mt-3 text-base text-zinc-500">
          {t(
            "ความรู้เรื่องเมล็ดพันธุ์ เทคนิคการปลูก และข้อมูลน่ารู้จากทีมงาน",
            "Seed knowledge, growing techniques, and insights from our team"
          )}
        </p>
      </div>

      {/* Featured Post */}
      {featured && (
        <Link href={`/blog/${featured.slug}`} className="group mb-12 block">
          <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 shadow-sm transition-shadow duration-300 hover:shadow-lg sm:flex">
            <div className="relative h-60 w-full shrink-0 sm:h-auto sm:w-96">
              {featured.image_url ? (
                <Image
                  src={featured.image_url}
                  alt={(locale === "en" ? featured.title_en : featured.title) ?? "Featured"}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 384px"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10">
                  <BookOpen className="h-16 w-16 text-primary/30" />
                </div>
              )}
              <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-white">
                {t("บทความแนะนำ", "Featured")}
              </span>
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8">
              {featured.category && (
                <span className="mb-2 flex items-center gap-1 text-xs font-semibold text-primary">
                  <Tag className="h-3.5 w-3.5" />
                  {featured.category}
                </span>
              )}
              <h2 className="mb-3 text-xl font-bold leading-tight text-zinc-900 group-hover:text-primary sm:text-2xl">
                {(locale === "en" ? featured.title_en : featured.title) ?? featured.title}
              </h2>
              {((locale === "en" ? featured.excerpt_en : featured.excerpt) ?? featured.excerpt) && (
                <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-zinc-500">
                  {(locale === "en" ? featured.excerpt_en : featured.excerpt) ?? featured.excerpt}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <time dateTime={featured.created_at}>{formatDate(featured.created_at)}</time>
                </div>
                <span className="text-xs font-semibold text-primary">
                  {t("บทความแนะนำ →", "Read more →")}
                </span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Grid */}
      {rest.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      )}
    </>
  );
}
