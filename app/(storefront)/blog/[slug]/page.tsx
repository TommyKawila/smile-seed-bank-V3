import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Blog } from "@/types/supabase";
import { formatDate } from "@/lib/utils";
import { Calendar, Tag, ArrowLeft, Eye } from "lucide-react";

export const revalidate = 600;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getBlogBySlug(slug: string): Promise<Blog | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  return (data as Blog) ?? null;
}

async function getRelatedBlogs(currentId: number, category: string | null): Promise<Blog[]> {
  const supabase = await createClient();
  let query = supabase
    .from("blogs")
    .select("id, slug, title, title_en, excerpt, excerpt_en, image_url, category, created_at, is_published, view_count, content, content_en, excerpt_en")
    .eq("is_published", true)
    .neq("id", currentId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (category) query = query.eq("category", category);

  const { data } = await query;
  return (data as Blog[]) ?? [];
}

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const blog = await getBlogBySlug(params.slug);
  if (!blog) return { title: "ไม่พบบทความ" };

  const title = blog.title ?? blog.title_en ?? "บทความ";
  const description = blog.excerpt ?? blog.excerpt_en ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    title: `${title} — Smile Seed Bank`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: blog.created_at,
      url: `${siteUrl}/blog/${blog.slug}`,
      images: blog.image_url ? [{ url: blog.image_url, alt: title }] : [],
      siteName: "Smile Seed Bank",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: blog.image_url ? [blog.image_url] : [],
    },
    alternates: {
      canonical: `${siteUrl}/blog/${blog.slug}`,
    },
  };
}

// ─── Static Params (optional: pre-generate at build time) ────────────────────

export async function generateStaticParams() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blogs")
    .select("slug")
    .eq("is_published", true);
  return (data ?? []).map((b: { slug: string }) => ({ slug: b.slug }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BlogDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const blog = await getBlogBySlug(params.slug);
  if (!blog) notFound();

  const related = await getRelatedBlogs(blog.id, blog.category);

  // Determine display language (prefer TH, fallback to EN)
  const title = blog.title ?? blog.title_en ?? "ไม่มีชื่อ";
  const content = blog.content ?? blog.content_en ?? "";

  return (
    <div className="min-h-screen bg-white pb-20 pt-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Back Link */}
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปหน้าบทความ
        </Link>

        {/* Hero Image */}
        {blog.image_url && (
          <div className="relative mb-8 h-56 w-full overflow-hidden rounded-2xl sm:h-80">
            <Image
              src={blog.image_url}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        {/* Meta */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {blog.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Tag className="h-3 w-3" />
              {blog.category}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Calendar className="h-3.5 w-3.5" />
            <time dateTime={blog.created_at}>{formatDate(blog.created_at)}</time>
          </span>
          <span className="flex items-center gap-1 text-xs text-zinc-400">
            <Eye className="h-3.5 w-3.5" />
            {blog.view_count.toLocaleString("th-TH")} ครั้ง
          </span>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-2xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-3xl">
          {title}
        </h1>

        {/* Bilingual Toggle — show EN title/excerpt if both languages exist */}
        {blog.title_en && blog.title && (
          <p className="mb-6 border-l-4 border-primary/30 pl-4 text-sm italic text-zinc-400">
            {blog.title_en}
          </p>
        )}

        {/* Article Content */}
        <article
          className="prose prose-zinc prose-headings:font-bold prose-a:text-primary prose-img:rounded-xl max-w-none leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* English Content (if bilingual) */}
        {blog.content_en && blog.content && (
          <details className="mt-8 rounded-xl border border-zinc-100 bg-zinc-50 p-5">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-600">
              🇬🇧 English Version
            </summary>
            <article
              className="prose prose-zinc prose-sm mt-4 max-w-none"
              dangerouslySetInnerHTML={{ __html: blog.content_en }}
            />
          </details>
        )}

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-lg font-bold text-zinc-900">บทความที่เกี่ยวข้อง</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/blog/${r.slug}`}
                  className="group overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  {r.image_url && (
                    <div className="relative h-32 w-full overflow-hidden">
                      <Image
                        src={r.image_url}
                        alt={r.title ?? "Related post"}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="line-clamp-2 text-sm font-semibold leading-tight text-zinc-900 group-hover:text-primary">
                      {r.title ?? r.title_en}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">{formatDate(r.created_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
