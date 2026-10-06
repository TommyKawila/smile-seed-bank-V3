import {
  EDITORIAL_MEANINGFUL_FIELDS,
  EDITORIAL_STATUS,
  type EditorialMeaningfulField,
  type EditorialPatchableStatus,
  type EditorialStatus,
} from "@/lib/editorial-types";
import { isTiptapDocEmpty } from "@/lib/magazine-bilingual";

export type EditorialJobSnapshot = {
  status: string;
  revision: number;
  approved_revision: number | null;
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  content: unknown;
  title_en: string | null;
  excerpt_en: string | null;
  content_en: unknown;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[];
  category_id: bigint | number | null;
  tags: string[];
  research_summary: string | null;
  sources: unknown;
  image_plan: unknown;
  featured_image: string | null;
  image_assets: unknown;
};

export type EditorialPatchSnapshot = Partial<{
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  content: unknown;
  title_en: string | null;
  excerpt_en: string | null;
  content_en: unknown;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[];
  category_id: bigint | number | null;
  tags: string[];
  research_summary: string | null;
  sources: unknown;
  image_plan: unknown;
  featured_image: string | null;
  image_assets: unknown;
  review_notes: string | null;
  status: EditorialPatchableStatus;
  source_prompt: string | null;
}>;

function jsonEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizeJson(a)) === JSON.stringify(normalizeJson(b));
}

function normalizeJson(v: unknown): unknown {
  if (typeof v === "bigint") return Number(v);
  if (v === undefined) return null;
  return v;
}

function asCategoryKey(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

export function isMeaningfulFieldChanged(
  current: EditorialJobSnapshot,
  patch: EditorialPatchSnapshot
): boolean {
  for (const key of EDITORIAL_MEANINGFUL_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
    const nextVal = patch[key as keyof EditorialPatchSnapshot];
    if (key === "category_id") {
      if (asCategoryKey(current.category_id) !== asCategoryKey(nextVal)) {
        return true;
      }
      continue;
    }
    const currentVal = current[key as EditorialMeaningfulField];
    if (!jsonEqual(currentVal, nextVal)) return true;
  }
  return false;
}

export function nextRevisionAfterPatch(
  current: EditorialJobSnapshot,
  patch: EditorialPatchSnapshot
): {
  revision: number;
  approved_revision: number | null;
  clearApproval: boolean;
} {
  if (!isMeaningfulFieldChanged(current, patch)) {
    return {
      revision: current.revision,
      approved_revision: current.approved_revision,
      clearApproval: false,
    };
  }
  return {
    revision: current.revision + 1,
    approved_revision: null,
    clearApproval: true,
  };
}

export function nextStatusAfterPatch(
  currentStatus: string,
  patch: EditorialPatchSnapshot,
  meaningfulChanged: boolean
): string {
  if (patch.status) return patch.status;
  if (!meaningfulChanged) return currentStatus;
  if (
    currentStatus === EDITORIAL_STATUS.APPROVED ||
    currentStatus === EDITORIAL_STATUS.GENERATING_ASSETS ||
    currentStatus === EDITORIAL_STATUS.READY_TO_PUBLISH ||
    currentStatus === EDITORIAL_STATUS.PUBLISHING ||
    currentStatus === EDITORIAL_STATUS.PUBLISHED
  ) {
    return EDITORIAL_STATUS.REVISION;
  }
  if (currentStatus === EDITORIAL_STATUS.REVIEW) {
    return EDITORIAL_STATUS.REVISION;
  }
  return currentStatus;
}

export function isTiptapDoc(doc: unknown): boolean {
  if (!doc || typeof doc !== "object") return false;
  const o = doc as { type?: unknown; content?: unknown };
  return o.type === "doc" && Array.isArray(o.content);
}

export function hasRequiredArticleFields(job: {
  title: string | null;
  slug: string | null;
  content: unknown;
}): boolean {
  return Boolean(
    job.title?.trim() &&
      job.slug?.trim() &&
      isTiptapDoc(job.content) &&
      !isTiptapDocEmpty(job.content)
  );
}

export function isApprovedCurrentRevision(job: {
  revision: number;
  approved_revision: number | null;
}): boolean {
  return (
    job.approved_revision != null && job.approved_revision === job.revision
  );
}

export function imagePlanRequiresAssets(imagePlan: unknown): boolean {
  return Array.isArray(imagePlan) && imagePlan.length > 0;
}

export function jobHasImageAssets(job: {
  featured_image: string | null;
  image_assets: unknown;
}): boolean {
  if (job.featured_image?.trim()) return true;
  return Array.isArray(job.image_assets) && job.image_assets.length > 0;
}

export function canApproveJob(job: EditorialJobSnapshot): {
  ok: true;
} | { ok: false; error: string } {
  if (
    job.status !== EDITORIAL_STATUS.REVIEW &&
    job.status !== EDITORIAL_STATUS.REVISION
  ) {
    return { ok: false, error: "Job must be in REVIEW or REVISION to approve" };
  }
  if (!hasRequiredArticleFields(job)) {
    return { ok: false, error: "Title, slug, and content are required to approve" };
  }
  return { ok: true };
}

export function canStartAssets(job: EditorialJobSnapshot): {
  ok: true;
} | { ok: false; error: string } {
  if (!isApprovedCurrentRevision(job)) {
    return { ok: false, error: "Job must have an approved current revision" };
  }
  if (
    job.status !== EDITORIAL_STATUS.APPROVED &&
    job.status !== EDITORIAL_STATUS.GENERATING_ASSETS
  ) {
    return { ok: false, error: "Assets can start only from APPROVED" };
  }
  return { ok: true };
}

export function canCompleteAssets(job: EditorialJobSnapshot): {
  ok: true;
} | { ok: false; error: string } {
  if (!isApprovedCurrentRevision(job)) {
    return { ok: false, error: "Job must have an approved current revision" };
  }
  if (
    job.status !== EDITORIAL_STATUS.APPROVED &&
    job.status !== EDITORIAL_STATUS.GENERATING_ASSETS
  ) {
    return {
      ok: false,
      error: "Assets can complete only while approved for the current revision",
    };
  }
  return { ok: true };
}

export function canPublishJob(job: EditorialJobSnapshot): {
  ok: true;
} | { ok: false; error: string } {
  if (!hasRequiredArticleFields(job)) {
    return { ok: false, error: "Title, slug, and content are required to publish" };
  }
  if (!isApprovedCurrentRevision(job)) {
    return { ok: false, error: "Stale or missing approval" };
  }

  const imagesRequired = imagePlanRequiresAssets(job.image_plan);
  const status = job.status as EditorialStatus | string;

  if (status === EDITORIAL_STATUS.READY_TO_PUBLISH) return { ok: true };

  if (status === EDITORIAL_STATUS.APPROVED) {
    if (imagesRequired) {
      return {
        ok: false,
        error: "Complete image assets before publishing this revision",
      };
    }
    return { ok: true };
  }

  if (status === EDITORIAL_STATUS.PUBLISHING || status === EDITORIAL_STATUS.FAILED) {
    if (imagesRequired && !jobHasImageAssets(job)) {
      return {
        ok: false,
        error: "Complete image assets before publishing this revision",
      };
    }
    return { ok: true };
  }

  return {
    ok: false,
    error: "Job must be READY_TO_PUBLISH or APPROVED (when no images are required)",
  };
}

export function patchBlockedWhilePublishing(status: string): boolean {
  return status === EDITORIAL_STATUS.PUBLISHING;
}
