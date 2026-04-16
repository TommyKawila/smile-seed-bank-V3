"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
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
  type MagazineEmailTemplateId,
  type MagazineSaveInput,
} from "@/app/admin/magazine/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

/** TipTap JSON + server action transport: plain JSON only (no File/BigInt/class instances). */
function toPlainContentJson(obj: object): object {
  try {
    return JSON.parse(
      JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
    ) as object;
  } catch {
    return emptyDoc;
  }
}

function toSerializablePayload(raw: MagazineSaveInput): MagazineSaveInput {
  const fi = raw.featured_image;
  const featured =
    fi == null || fi === ""
      ? null
      : typeof fi === "string"
        ? fi.trim() || null
        : null;

  return {
    title: String(raw.title ?? "").trim(),
    slug: String(raw.slug ?? "").trim(),
    excerpt: String(raw.excerpt ?? ""),
    content: toPlainContentJson(raw.content as object),
    featured_image: featured,
    tags: (raw.tags ?? []).map((t) => String(t)),
    status: raw.status,
    category_id:
      raw.category_id == null || !Number.isFinite(Number(raw.category_id))
        ? null
        : Number(raw.category_id),
    related_product_ids: [
      ...new Set(
        (raw.related_product_ids ?? [])
          .map((n) => Number(n))
          .filter((n) => Number.isFinite(n) && n > 0)
      ),
    ],
    ...(raw.send_email
      ? {
          send_email: true as const,
          email_template: raw.email_template ?? "research",
          field_notes_creator_url: raw.field_notes_creator_url,
          field_notes_bullets: raw.field_notes_bullets,
        }
      : {}),
  };
}

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
  const [imageBusy, setImageBusy] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [emailTemplate, setEmailTemplate] =
    useState<MagazineEmailTemplateId>("research");
  const [creatorLink, setCreatorLink] = useState("");
  const [fieldBullets, setFieldBullets] = useState(["", "", ""]);

  const saveDisabled = pending || imageBusy;

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

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("magazine_email_broadcast");
      if (!raw) return;
      sessionStorage.removeItem("magazine_email_broadcast");
      const j = JSON.parse(raw) as { sent?: number; error?: string };
      const parts: string[] = [];
      if (typeof j.sent === "number") {
        parts.push(
          j.sent > 0
            ? `Newsletter sent to ${j.sent} subscriber(s)`
            : "Newsletter: no active subscribers"
        );
      }
      if (j.error) parts.push(`Email: ${j.error}`);
      if (parts.length) setFeedback(parts.join(" · "));
    } catch {
      /* ignore */
    }
  }, []);

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
    if (imageBusy) {
      setError("รอให้อัปโหลดรูปเสร็จก่อน / Wait for image upload to finish.");
      return;
    }
    if (
      nextStatus === "PUBLISHED" &&
      sendEmail &&
      emailTemplate === "field_notes"
    ) {
      const u = creatorLink.trim();
      try {
        const parsed = new URL(u);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          throw new Error("protocol");
        }
      } catch {
        setError("Field Notes: add a valid https:// link to the original creator.");
        return;
      }
      if (fieldBullets.some((b) => !b.trim())) {
        setError("Field Notes: fill all three highlight bullets.");
        return;
      }
    }
    setStatus(nextStatus);
    setError(null);
    setFeedback(null);
    const core = buildPayload();
    const merged: MagazineSaveInput = {
      ...core,
      status: nextStatus,
      ...(nextStatus === "PUBLISHED" && sendEmail
        ? {
            send_email: true,
            email_template: emailTemplate,
            field_notes_creator_url: creatorLink.trim(),
            field_notes_bullets: fieldBullets.map((b) => b.trim()),
          }
        : {}),
    };
    const payload = toSerializablePayload(merged);
    startTransition(async () => {
      if (isEdit && initial) {
        const r = await updateMagazinePost(initial.id, payload);
        if (!r.ok) {
          setError(r.error ?? "Save failed");
          return;
        }
        const extra: string[] = [];
        if (r.emailSent != null) {
          extra.push(
            r.emailSent > 0
              ? `Newsletter: ${r.emailSent} sent`
              : "Newsletter: 0 active subscribers"
          );
        }
        if (r.emailError) extra.push(`Email: ${r.emailError}`);
        setFeedback(extra.length ? extra.join(" · ") : "Saved");
        setTimeout(() => setFeedback(null), 8000);
        router.refresh();
        return;
      }
      const r = await createMagazinePost(payload);
      if (!r.ok) {
        setError(r.error ?? "Create failed");
        return;
      }
      if (r.emailSent != null || r.emailError) {
        try {
          sessionStorage.setItem(
            "magazine_email_broadcast",
            JSON.stringify({
              sent: r.emailSent,
              error: r.emailError,
            })
          );
        } catch {
          /* ignore */
        }
      }
      router.push(`/admin/magazine/${r.id}/edit`);
      router.refresh();
    });
  };

  const fieldClass =
    "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm focus:border-emerald-700/40 focus:outline-none focus:ring-1 focus:ring-emerald-700/25";

  return (
    <div className="min-h-full bg-white text-zinc-900">
      <div className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin/magazine"
              className="rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800/80">
                Blog CMS
              </p>
              <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-900">
                {isEdit ? "Edit article" : "New article"}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {feedback && (
              <span className="text-sm text-emerald-800">{feedback}</span>
            )}
            {(pending || imageBusy) && (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
            )}
            <button
              type="button"
              disabled={saveDisabled}
              onClick={() => save("DRAFT")}
              className="rounded-lg border border-emerald-800/35 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50 disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={saveDisabled}
              onClick={() => save("PUBLISHED")}
              className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 disabled:opacity-50"
            >
              {isEdit ? "Update & publish" : "Publish"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className={`${fieldClass} text-base`}
            placeholder="Article title"
          />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
              Slug
            </label>
            <button
              type="button"
              onClick={() => {
                setSlug(generateSlug(title));
                setSlugDirty(false);
              }}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950"
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
            className={`${fieldClass} font-mono text-[13px]`}
            placeholder="url-friendly-slug"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Excerpt
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className={`${fieldClass} resize-y`}
            placeholder="Short summary for listings and SEO"
          />
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={fieldClass}
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
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
              Status
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "DRAFT" | "PUBLISHED")
              }
              className={fieldClass}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>

        <ImageUploadField
          value={featuredImage}
          onChange={setFeaturedImage}
          onPhaseChange={(phase) => setImageBusy(phase !== "idle")}
          disabled={pending}
          label="Featured image"
          variant="product"
          uploadTarget="magazine"
        />

        <RelatedProductsSection
          selectedIds={relatedProductIds}
          onChange={setRelatedProductIds}
        />

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Tags
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className={fieldClass}
            placeholder="comma, separated, tags"
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Newsletter (on publish)
          </p>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 bg-white text-emerald-800 focus:ring-emerald-700/35"
            />
            <span className="text-sm leading-relaxed text-zinc-700">
              Send email to newsletter subscribers when you publish (uses{" "}
              <span className="font-medium text-zinc-800">Resend</span>).
            </span>
          </label>
          {sendEmail && (
            <div className="space-y-3 pl-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Template type
              </label>
              <Select
                value={emailTemplate}
                onValueChange={(v) =>
                  setEmailTemplate(v as MagazineEmailTemplateId)
                }
              >
                <SelectTrigger className="w-full rounded-xl border-zinc-200 bg-white text-zinc-900 shadow-sm focus:ring-emerald-700/25 [&>span]:text-zinc-900">
                  <SelectValue placeholder="Choose template" />
                </SelectTrigger>
                <SelectContent className="border-zinc-200 bg-white text-zinc-900">
                  <SelectItem value="research">
                    Research Paper (Standard)
                  </SelectItem>
                  <SelectItem value="field_notes">
                    Field Notes (YouTube / story summary)
                  </SelectItem>
                </SelectContent>
              </Select>
              {emailTemplate === "field_notes" && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-600">
                      Original creator link
                    </label>
                    <input
                      type="url"
                      value={creatorLink}
                      onChange={(e) => setCreatorLink(e.target.value)}
                      placeholder="https://…"
                      className={`${fieldClass} py-2.5 font-mono text-[13px]`}
                    />
                  </div>
                  <p className="text-xs text-zinc-500">
                    3-bullet highlights (shown in the email)
                  </p>
                  {fieldBullets.map((h, i) => (
                    <input
                      key={i}
                      type="text"
                      value={h}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFieldBullets((prev) => {
                          const next = [...prev];
                          next[i] = v;
                          return next;
                        });
                      }}
                      placeholder={`Highlight ${i + 1}`}
                      className={fieldClass}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
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
