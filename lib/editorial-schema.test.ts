import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  editorialCreateJobSchema,
  editorialPatchJobSchema,
} from "./editorial-schema";

describe("editorial create schema", () => {
  it("accepts a topic and optional source_prompt", () => {
    const parsed = editorialCreateJobSchema.parse({
      topic: "Humboldt Seed Company vs Humboldt Seed Organization",
      source_prompt: "Compare the two brands",
    });
    assert.equal(parsed.topic.includes("Humboldt"), true);
  });

  it("rejects an empty topic", () => {
    const parsed = editorialCreateJobSchema.safeParse({ topic: "  " });
    assert.equal(parsed.success, false);
  });
});

describe("editorial patch schema", () => {
  it("rejects privileged status values", () => {
    for (const status of [
      "APPROVED",
      "GENERATING_ASSETS",
      "READY_TO_PUBLISH",
      "PUBLISHING",
      "PUBLISHED",
    ]) {
      const parsed = editorialPatchJobSchema.safeParse({ status });
      assert.equal(parsed.success, false, status);
    }
  });

  it("rejects direct writes to approval and publish fields", () => {
    const parsed = editorialPatchJobSchema.safeParse({
      revision: 9,
      approved_revision: 9,
      approved_at: new Date().toISOString(),
      published_post_id: 1,
      published_at: new Date().toISOString(),
    });
    assert.equal(parsed.success, false);
  });

  it("allows REVIEW status for a ready draft", () => {
    const parsed = editorialPatchJobSchema.parse({
      title: "Ready draft",
      status: "REVIEW",
    });
    assert.equal(parsed.status, "REVIEW");
  });
});

describe("editorial tiptap schema", () => {
  it("requires a TipTap doc with a content array", () => {
    const ok = editorialPatchJobSchema.safeParse({
      content: { type: "doc", content: [] },
    });
    assert.equal(ok.success, true);

    assert.equal(
      editorialPatchJobSchema.safeParse({ content: "plain text" }).success,
      false
    );
    assert.equal(
      editorialPatchJobSchema.safeParse({ content: { type: "doc" } }).success,
      false
    );
    assert.equal(
      editorialPatchJobSchema.safeParse({ content: { html: "<p>nope</p>" } })
        .success,
      false
    );
  });
});
