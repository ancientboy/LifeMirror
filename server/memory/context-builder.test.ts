import assert from "node:assert/strict";
import test from "node:test";
import { relevanceScore } from "./context-builder.js";

test("context ranking gives open real-world loops priority over stale symbolic history", () => {
  const now = new Date();
  const openScore = relevanceScore("合作结果后来怎么样", "等待合作结果", now, true);
  const staleScore = relevanceScore("合作结果后来怎么样", "一次塔罗镜像", new Date("2020-01-01T00:00:00.000Z"), false);
  assert.ok(openScore > staleScore);
});
