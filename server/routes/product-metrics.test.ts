import assert from "node:assert/strict";
import test from "node:test";
import { productMetricEventSchema, summarizeProductMetrics } from "./product-metrics.js";

test("product metrics accept only opaque allow-listed fields", () => {
  assert.equal(productMetricEventSchema.safeParse({ eventType: "daily_opened", surface: "daily", eventKey: "daily:2026-08-11" }).success, true);
  assert.equal(productMetricEventSchema.safeParse({ eventType: "daily_opened", surface: "daily", eventKey: "daily:2026-08-11", text: "private" }).success, false);
  assert.equal(productMetricEventSchema.safeParse({ eventType: "unknown", surface: "daily", eventKey: "daily:2026-08-11" }).success, false);
});

test("product metric rates remain defensive", () => {
  const metrics = summarizeProductMetrics([{ event_type: "daily_opened", total: 2 }, { event_type: "daily_checkin_completed", total: 1 }, { event_type: "mirror_result_ready", total: 4 }, { event_type: "tool_continued_chat", total: 1 }]);
  assert.equal(metrics.dailyCompletionRate, .5);
  assert.equal(metrics.tool_continued_chat, 1);
  assert.equal(summarizeProductMetrics([]).shareRate, 0);
});
