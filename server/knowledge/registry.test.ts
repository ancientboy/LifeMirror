import assert from "node:assert/strict";
import test from "node:test";
import { KnowledgePackRegistry } from "./registry.js";
import { retrieveKnowledge } from "./retrieval.js";

function pack(version = "1.0.0", value = "reflection") {
  return {
    id: "test-pack", version, name: "Test Pack", description: "Contract fixture", status: "active" as const,
    scope: { domains: ["work"], intents: ["reflect"], locales: ["zh-CN"], excludes: ["diagnosis"] },
    sources: [{ id: "source-1", title: "Source", kind: "internal" as const, citation: "LifeMirror test source" }],
    entries: [{ id: `entry-${version}`, title: "工作反思", content: "观察工作选择中的边界", keywords: ["工作", "边界"], domains: ["work"], intents: ["reflect"], evidence: "experiential" as const, confidence: 0.8, sourceIds: ["source-1"], safetyBoundary: "不替用户做决定", claims: [{ key: "recommended-mode", value }] }],
  };
}

test("registry validates contracts, versions packs, and supports enable/disable", () => {
  const registry = new KnowledgePackRegistry();
  registry.register(pack("1.0.0"));
  registry.register(pack("1.2.0"));
  assert.equal(registry.get("test-pack")?.version, "1.2.0");
  registry.setStatus("test-pack", "1.2.0", "disabled");
  assert.equal(registry.get("test-pack")?.version, "1.0.0");
  assert.equal(registry.list().length, 1);
  assert.equal(registry.list({ includeDisabled: true }).length, 2);
  assert.throws(() => registry.register(pack("1.0.0")), /already registered/);
  assert.throws(() => registry.register({ ...pack("2.0.0"), sources: [] }));
});

test("retrieval ranks applicability and preserves complete source trace", () => {
  const registry = new KnowledgePackRegistry();
  registry.register(pack());
  const result = retrieveKnowledge(registry, { text: "工作边界", domains: ["work"], intent: "reflect", locale: "zh-CN" });
  assert.equal(result.matches.length, 1);
  assert.ok(result.matches[0].applicability > 0.8);
  assert.deepEqual(result.matches[0].trace.sourceIds, ["source-1"]);
  assert.equal(result.matches[0].sources[0].citation, "LifeMirror test source");
});

test("retrieval reports conflicting claims without hiding either source", () => {
  const registry = new KnowledgePackRegistry();
  registry.register(pack("1.0.0", "reflection"));
  const second = { ...pack("1.0.0", "action"), id: "second-pack", entries: [{ ...pack().entries[0], id: "second", claims: [{ key: "recommended-mode", value: "action" }] }] };
  registry.register(second);
  const result = retrieveKnowledge(registry, { text: "工作边界", domains: ["work"], intent: "reflect" });
  assert.equal(result.matches.length, 2);
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.conflicts[0].values.length, 2);
});
