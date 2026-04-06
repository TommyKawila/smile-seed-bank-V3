"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { generateSlug } from "@/lib/product-utils";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { MagazineTiptapEditor } from "./MagazineTiptapEditor";
import { RelatedProductsSection } from "./RelatedProductsSection";
import {
  createMagazinePost,
  updateMagazinePost,
  type MagazineSaveInput,
} from "@/app/admin/magazine/actions";
import { Loader2, ArrowLeft } from "lucide-react";

type Category = { id: string; name: string };

type InitialPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: object | null;
  featured_image: string | null;
  tags: string[];
  status: string;
  category_id: string | null;
  related_products: number[];
};

const emptyDoc = { type: "doc", content: [{ type: "paragraph" }] };

function parseTags(s: string): string[] {
  return s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function MagazinePostForm({
  categories,
  initial,
}: {
  categories: Category[];
  initial: InitialPost | null;
}) {
  const router = useRouter();
  const isEdit = initial != null;
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugDirty, setSlugDirty] = useState(isEdit);
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [contentJson, setContentJson] = useState<object>(
    (initial?.content as object) ?? emptyDoc
  );
  const [featuredImage, setFeaturedImage] = useState(
    initial?.featured_image ?? ""
  );
  const [tagsInput, setTagsInput] = useState(
    (initial?.tags ?? []).join(", ")
  );
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(
    initial?.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT"
  );
  const [categoryId, setCategoryId] = useState<string>(
    initial?.category_id ?? ""
  );
  const [relatedProductIds, setRelatedProductIds] = useState<number[]>(
    initial?.related_products ?? []
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debouncedSlugFromTitle = useDebouncedCallback((t: string) => {
    if (!slugDirty) setSlug(generateSlug(t));
  }, 400);

  const onTitleChange = (v: string) => {
    setTitle(v);
    debouncedSlugFromTitle(v);
  };

  const editorKey = useMemo(
    () => (initial?.id != null ? `post-${initial.id}` : "new"),
    [initial?.id]
  );

  const buildPayload = useCallback((): MagazineSaveInput => {
    return {
      title,
      slug,
      excerpt,
      content: contentJson,
      featured_image: featuredImage.trim() || null,
      tags: parseTags(tagsInput),
      status,
      category_id: categoryId ? Number(categoryId) : null,
      related_product_ids: relatedProductIds,
    };
  }, [
    title,
    slug,
    excerpt,
    contentJson,
    featuredImage,
    tagsInput,
    status,
    categoryId,
    relatedProductIds,
  ]);

  const save = (nextStatus: "DRAFT" | "PUBLISHED") => {
    setStatus(nextStatus);
    setError(null);
    setFeedback(null);
    const payload = { ...buildPayload(), status: nextStatus };
    startTransition(async () => {
      if (isEdit && initial) {
        const r = await updateMagazinePost(initial.id, payload);
        if (!r.ok) {
          setError(r.error ?? "Save failed");
          return;
        }
        setFeedback("Saved");
        setTimeout(() => setFeedback(null), 2500);
        router.refresh();
        return;
      }
      const r = await createMagazinePost(payload);
      if (!r.ok) {
        setError(r.error ?? "Create failed");
        return;
      }
      router.push(`/admin/magazine/${r.id}/edit`);
      router.refresh();
    });
  };

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin/magazine"
              className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Magazine
              </p>
              <h1 className="truncate text-lg font-semibold tracking-tight text-white">
                {isEdit ? "Edit article" : "New article"}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {feedback && (
              <span className="text-sm text-emerald-400/90">{feedback}</span>
            )}
            {pending && (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => save("DRAFT")}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => save("PUBLISHED")}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {isEdit ? "Update & publish" : "Publish"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
        {error && (
          <p className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-base text-white placeholder:text-zinc-600 focus:border-emerald-600/50 focus:outline-none focus:ring-1 focus:ring-emerald-600/30"
            placeholder="Article title"
          />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Slug
            </label>
            <button
              type="button"
              onClick={() => {
                setSlug(generateSlug(title));
                setSlugDirty(false);
              }}
              className="text-xs font-medium text-emerald-500/90 hover:text-emerald-400"
            >
              Regenerate from title
            </button>
          </div>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugDirty(true);
            }}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 font-mono text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-600/50 focus:outline-none focus:ring-1 focus:ring-emerald-600/30"
            placeholder="url-friendly-slug"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Excerpt
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-600/50 focus:outline-none focus:ring-1 focus:ring-emerald-600/30"
            placeholder="Short summary for listings and SEO"
          />
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-200 focus:border-emerald-600/50 focus:outline-none focus:ring-1 focus:ring-emerald-600/30"
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Status
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "DRAFT" | "PUBLISHED")
              }
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-200 focus:border-emerald-600/50 focus:outline-none focus:ring-1 focus:ring-emerald-600/30"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>

        <ImageUploadField
          value={featuredImage}
          onChange={setFeaturedImage}
          disabled={pending}
          label="Featured image"
        />

        <RelatedProductsSection
          selectedIds={relatedProductIds}
          onChange={setRelatedProductIds}
        />

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Tags
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-600/50 focus:outline-none focus:ring-1 focus:ring-emerald-600/30"
            placeholder="comma, separated, tags"
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Content
          </label>
          <MagazineTiptapEditor
            key={editorKey}
            content={contentJson}
            onChange={setContentJson}
            placeholder="Write your story…"
          />
        </div>
      </div>
    </div>
  );
}
