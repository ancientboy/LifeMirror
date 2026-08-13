import test from "node:test";
import assert from "node:assert/strict";
import { classifyClientSession } from "./client-session.js";

test("a confirmed account wins over an old guest marker during navigation", () => {
  assert.deepEqual(classifyClientSession(JSON.stringify({ email: "user@example.com", provider: "email" }), true), {
    status: "authenticated",
    user: { email: "user@example.com", provider: "email" },
  });
});

test("guest and cold-start states remain distinguishable", () => {
  assert.deepEqual(classifyClientSession(null, true), { status: "guest" });
  assert.deepEqual(classifyClientSession(null, false), { status: "unknown" });
  assert.deepEqual(classifyClientSession("not-json", false), { status: "unknown" });
});
