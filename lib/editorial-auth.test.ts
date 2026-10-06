import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isEditorialAuthorized,
  readBearerToken,
} from "./editorial-auth";

describe("editorial API auth", () => {
  it("rejects a missing token", () => {
    assert.equal(readBearerToken(null), null);
    assert.equal(isEditorialAuthorized(null, "secret-key"), false);
    assert.equal(isEditorialAuthorized("Bearer ", "secret-key"), false);
  });

  it("rejects an incorrect token", () => {
    assert.equal(
      isEditorialAuthorized("Bearer wrong-key", "secret-key"),
      false
    );
  });

  it("rejects when the server key is missing", () => {
    assert.equal(
      isEditorialAuthorized("Bearer secret-key", undefined),
      false
    );
    assert.equal(isEditorialAuthorized("Bearer secret-key", ""), false);
    assert.equal(isEditorialAuthorized("Bearer secret-key", "   "), false);
  });

  it("accepts a matching Bearer token", () => {
    assert.equal(
      isEditorialAuthorized("Bearer secret-key", "secret-key"),
      true
    );
  });
});
