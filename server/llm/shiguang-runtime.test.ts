import assert from "node:assert/strict";
import test from "node:test";
import { normalizeResearchResult, parseShiguangPlan } from "./shiguang-runtime.js";

test("planner accepts an LLM research decision with a precise query", () => {
  assert.deepEqual(parseShiguangPlan('{"intent":"research","searchQuery":"上海 2026 落户 政策 官方"}'), { intent: "research", searchQuery: "上海 2026 落户 政策 官方" });
});

test("planner fails closed to conversation instead of keyword routing", () => {
  assert.deepEqual(parseShiguangPlan("not json"), { intent: "conversation" });
});

test("research normalization only exposes valid HTTP sources", () => {
  const result = normalizeResearchResult("test", { results: [{ title: "Official source", url: "https://example.com/a", content: "A verified update." }, { title: "bad", url: "javascript:alert(1)" }] });
  assert.equal(result.sources.length, 1);
  assert.equal(result.sources[0]?.title, "Official source");
});
