import assert from "node:assert/strict";
import test from "node:test";
import { moderationTransition, normalizeReportReason } from "./moderation.js";

test("moderation accepts fixed codes only and never free-form report content", () => {
  assert.equal(normalizeReportReason("privacy"), "privacy");
  assert.equal(normalizeReportReason("copied chat text"), null);
});

test("an open report can receive one auditable resolution", () => {
  assert.deepEqual(moderationTransition("open", "confirmed"), { status: "reviewed", resolutionCode: "confirmed" });
  assert.equal(moderationTransition("reviewed", "confirmed"), null);
});
