export const EDITORIAL_STATUSES = [
  "IDEA",
  "RESEARCHING",
  "REVIEW",
  "REVISION",
  "APPROVED",
  "GENERATING_ASSETS",
  "READY_TO_PUBLISH",
  "PUBLISHING",
  "PUBLISHED",
  "FAILED",
] as const;

export type EditorialStatus = (typeof EDITORIAL_STATUSES)[number];

export const EDITORIAL_STATUS: { [K in EditorialStatus]: K } = {
  IDEA: "IDEA",
  RESEARCHING: "RESEARCHING",
  REVIEW: "REVIEW",
  REVISION: "REVISION",
  APPROVED: "APPROVED",
  GENERATING_ASSETS: "GENERATING_ASSETS",
  READY_TO_PUBLISH: "READY_TO_PUBLISH",
  PUBLISHING: "PUBLISHING",
  PUBLISHED: "PUBLISHED",
  FAILED: "FAILED",
};

/** Status values allowed on PATCH. Approval / assets / publish use dedicated endpoints. */
export const EDITORIAL_PATCHABLE_STATUSES = [
  "IDEA",
  "RESEARCHING",
  "REVIEW",
  "REVISION",
  "FAILED",
] as const;

export type EditorialPatchableStatus =
  (typeof EDITORIAL_PATCHABLE_STATUSES)[number];

export const EDITORIAL_MEANINGFUL_FIELDS = [
  "title",
  "slug",
  "excerpt",
  "content",
  "title_en",
  "excerpt_en",
  "content_en",
  "seo_title",
  "seo_description",
  "seo_keywords",
  "category_id",
  "tags",
  "research_summary",
  "sources",
  "image_plan",
] as const;

export type EditorialMeaningfulField =
  (typeof EDITORIAL_MEANINGFUL_FIELDS)[number];

export const EDITORIAL_SOURCE_TYPES = [
  "PRIMARY",
  "SECONDARY",
  "ANECDOTAL",
] as const;

export type EditorialSourceType = (typeof EDITORIAL_SOURCE_TYPES)[number];

export const EDITORIAL_CONFIDENCE = ["HIGH", "MEDIUM", "LOW"] as const;

export type EditorialConfidence = (typeof EDITORIAL_CONFIDENCE)[number];

export class EditorialError extends Error {
  readonly status: 400 | 404 | 409 | 500;

  constructor(status: 400 | 404 | 409 | 500, message: string) {
    super(message);
    this.name = "EditorialError";
    this.status = status;
  }
}
