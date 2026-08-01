import assert from "node:assert/strict";
import test from "node:test";
import { hashSessionToken } from "./session.js";

test("session tokens are stored as deterministic hashes", () => {
  const token = "private-session-token";
  const hash = hashSessionToken(token);

  assert.notEqual(hash, token);
  assert.equal(hash, hashSessionToken(token));
  assert.equal(hash.length, 64);
});
