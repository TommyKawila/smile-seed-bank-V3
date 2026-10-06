import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EDITORIAL_STATUS } from "./editorial-types";
import {
  canApproveJob,
  canPublishJob,
  isApprovedCurrentRevision,
  isMeaningfulFieldChanged,
  nextRevisionAfterPatch,
  nextStatusAfterPatch,
  type EditorialJobSnapshot,
} from "./editorial-rules";

const tiptap = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Hello article" }],
    },
  ],
};

function job(
  overrides: Partial<EditorialJobSnapshot> = {}
): EditorialJobSnapshot {
  return {
    status: EDITORIAL_STATUS.REVIEW,
    revision: 1,
    approved_revision: null,
    title: "Humboldt comparison",
    slug: "humboldt-comparison",
    excerpt: "Excerpt",
    content: tiptap,
    title_en: null,
    excerpt_en: null,
    content_en: null,
    seo_title: null,
    seo_description: null,
    seo_keywords: [],
    category_id: null,
    tags: [],
    research_summary: null,
    sources: null,
    image_plan: null,
    featured_image: null,
    image_assets: null,
    ...overrides,
  };
}

describe("editorial revision rules", () => {
  it("increments revision when a meaningful article field changes", () => {
    const current = job({ revision: 2, approved_revision: 2 });
    const next = nextRevisionAfterPatch(current, { title: "New title" });
    assert.equal(next.revision, 3);
    assert.equal(next.approved_revision, null);
    assert.equal(next.clearApproval, true);
  });

  it("does not increment revision for operational status or asset fields", () => {
    const current = job({ revision: 2, approved_revision: 2 });
    const statusOnly = nextRevisionAfterPatch(current, {
      status: EDITORIAL_STATUS.REVIEW,
    });
    assert.equal(statusOnly.revision, 2);
    assert.equal(statusOnly.approved_revision, 2);

    const assetsOnly = nextRevisionAfterPatch(current, {
      featured_image: "https://cdn.example/hero.webp",
    });
    assert.equal(assetsOnly.revision, 2);
    assert.equal(assetsOnly.clearApproval, false);
  });

  it("clears approval when an approved article is edited", () => {
    const current = job({
      status: EDITORIAL_STATUS.APPROVED,
      revision: 4,
      approved_revision: 4,
    });
    assert.equal(isMeaningfulFieldChanged(current, { excerpt: "Changed" }), true);
    const next = nextRevisionAfterPatch(current, { excerpt: "Changed" });
    assert.equal(next.approved_revision, null);
    assert.equal(
      nextStatusAfterPatch(current.status, {}, true),
      EDITORIAL_STATUS.REVISION
    );
  });
});

describe("editorial approval gate", () => {
  it("stores approval against the current revision", () => {
    const current = job({ revision: 5, status: EDITORIAL_STATUS.REVIEW });
    const gate = canApproveJob(current);
    assert.equal(gate.ok, true);
    assert.equal(isApprovedCurrentRevision({ revision: 5, approved_revision: 5 }), true);
  });

  it("rejects approval without title, slug, or content", () => {
    assert.equal(canApproveJob(job({ title: null })).ok, false);
    assert.equal(canApproveJob(job({ slug: " " })).ok, false);
    assert.equal(
      canApproveJob(job({ content: { type: "doc", content: [] } })).ok,
      false
    );
    assert.equal(canApproveJob(job({ content: "plain text" })).ok, false);
  });
});

describe("editorial publish safety", () => {
  it("blocks stale revision from publishing", () => {
    const stale = job({
      status: EDITORIAL_STATUS.READY_TO_PUBLISH,
      revision: 3,
      approved_revision: 2,
    });
    const gate = canPublishJob(stale);
    assert.equal(gate.ok, false);
    if (!gate.ok) {
      assert.match(gate.error, /stale|approval/i);
    }
  });

  it("allows publishing an approved article without an image plan", () => {
    const ready = job({
      status: EDITORIAL_STATUS.APPROVED,
      revision: 1,
      approved_revision: 1,
      image_plan: null,
    });
    assert.equal(canPublishJob(ready).ok, true);
  });

  it("requires assets when an image plan exists", () => {
    const approved = job({
      status: EDITORIAL_STATUS.APPROVED,
      revision: 1,
      approved_revision: 1,
      image_plan: [{ type: "hero", prompt: "hero" }],
    });
    assert.equal(canPublishJob(approved).ok, false);

    const withAssets = job({
      status: EDITORIAL_STATUS.READY_TO_PUBLISH,
      revision: 1,
      approved_revision: 1,
      image_plan: [{ type: "hero", prompt: "hero" }],
      featured_image: "https://cdn.example/hero.webp",
    });
    assert.equal(canPublishJob(withAssets).ok, true);
  });
});
