import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildBlogPostMappedFields,
  buildResearchTrace,
  isUpdateExistingPost,
  redactResearchSecrets,
} from "./editorial-publish-map";

const tiptap = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Published body" }],
    },
  ],
};

describe("editorial publish mapping", () => {
  const job = {
    title: "Humboldt Seed Company vs HSO",
    slug: "humboldt-seed-company-vs-hso",
    excerpt: "A comparison",
    content: tiptap,
    title_en: "Humboldt Seed Company vs HSO",
    excerpt_en: "A comparison",
    content_en: tiptap,
    featured_image: "https://cdn.example/hero.webp",
    tags: ["humboldt"],
    category_id: 12,
    research_summary: "Desk research notes",
    source_prompt: "Compare the two Humboldt brands",
    sources: [
      {
        id: "src_01",
        title: "Official site",
        url: "https://example.com",
        publisher: "HSC",
        source_type: "PRIMARY",
      },
    ],
  };

  it("maps editorial fields onto blog_posts create payload", () => {
    const mapped = buildBlogPostMappedFields(job, "humboldt-seed-company-vs-hso");
    assert.equal(mapped.title, job.title);
    assert.equal(mapped.slug, "humboldt-seed-company-vs-hso");
    assert.equal(mapped.excerpt, job.excerpt);
    assert.equal(mapped.status, "PUBLISHED");
    assert.equal(mapped.category_id, 12n);
    assert.deepEqual(mapped.tags, ["humboldt"]);
    assert.equal(mapped.content, tiptap);
  });

  it("stores a research trace without secrets", () => {
    const trace = buildResearchTrace({
      ...job,
      source_prompt: "Compare brands Authorization: Bearer super-secret-token",
    });
    assert.ok(trace);
    assert.match(trace, /Compare brands/);
    assert.match(trace, /src_01/);
    assert.doesNotMatch(trace, /EDITORIAL_API_KEY/);
    assert.doesNotMatch(trace, /OPENAI_API_KEY/);
    assert.doesNotMatch(trace, /super-secret-token/);
    assert.match(redactResearchSecrets("Bearer abcdefghijklmnop"), /\[redacted\]/);
  });

  it("treats a stored published_post_id as an update, not a new post", () => {
    assert.equal(isUpdateExistingPost(null), false);
    assert.equal(isUpdateExistingPost(99n), true);
  });
});
