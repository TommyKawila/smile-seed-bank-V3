import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("editorial_jobs RLS", () => {
  it("enables row level security and does not add an anon policy", () => {
    const sql = readFileSync(
      "prisma/migrations/20261007110300_editorial_jobs_rls/migration.sql",
      "utf8"
    );
    assert.match(
      sql,
      /ALTER TABLE "public"\."editorial_jobs" ENABLE ROW LEVEL SECURITY/
    );
    assert.match(sql, /REVOKE ALL ON TABLE public\.editorial_jobs FROM anon/);
    assert.doesNotMatch(sql, /CREATE POLICY/i);
    assert.doesNotMatch(sql, /GRANT[\s\S]+TO anon/i);
  });
});
