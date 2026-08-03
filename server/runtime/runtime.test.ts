import assert from "node:assert/strict";
import test from "node:test";
import { evaluateTrust } from "./evaluation.js";
import { routeInteractionMode } from "./mode-router.js";
import { runMirrorRuntime } from "./runtime.js";
import { executeTool, ToolRegistry } from "./tool-registry.js";

test("mode router respects explicit selection and deterministic signals", () => {
  assert.equal(routeInteractionMode({ text: "随便聊聊", requestedMode: "deep" }).mode, "deep");
  assert.equal(routeInteractionMode({ text: "帮我回顾这一周" }).mode, "review");
  assert.equal(routeInteractionMode({ text: "你好" }).mode, "casual");
});

test("tool registry enforces mode and authentication permissions", async () => {
  const registry = new ToolRegistry();
  registry.register({ id: "private-note", version: "1.0.0", description: "test", supportedModes: ["reflection"], permission: "authenticated", risk: "low", validate: (value) => String(value), execute: async (value) => ({ value }) });
  const denied = await executeTool(registry, "private-note", "x", { sessionId: "s", mode: "reflection" });
  assert.equal(denied.trace.errorCode, "permission_denied");
  const success = await executeTool<{ value: string }>(registry, "private-note", "x", { sessionId: "s", userId: "u", mode: "reflection" });
  assert.deepEqual(success.output, { value: "x" });
});

test("evaluation exposes conflicts and high-impact uncertainty", () => {
  const result = evaluateTrust({ claims: [{ text: "重大判断", kind: "inferred", confidence: 0.9, highImpact: true }], knowledgeConflicts: [{ key: "claim", values: [] }] });
  assert.equal(result.requiresUserConfirmation, true);
  assert.ok(result.flags.includes("knowledge_conflict"));
  assert.ok(result.flags.includes("high_impact_confirmation_required"));
});

test("runtime emits a complete explainable trace", async () => {
  const registry = new ToolRegistry();
  registry.register({ id: "echo", version: "1.0.0", description: "test", supportedModes: ["deep"], permission: "public", risk: "low", validate: (value) => String(value), execute: async (value) => value });
  const result = await runMirrorRuntime<string>({ text: "请深入分析", sessionId: "s", registry, tool: { id: "echo", input: "ok" }, claims: [{ text: "工具返回 ok", kind: "observed", confidence: 1, evidenceIds: ["tool:echo"] }] });
  assert.equal(result.tool?.output, "ok");
  assert.equal(result.trace.mode.mode, "deep");
  assert.equal(result.trace.tools[0].status, "succeeded");
  assert.equal(result.trace.stages.at(-2)?.name, "evaluation");
});

test("runtime incorporates already-completed calculation, memory and reflection stages", async () => {
  const registry = new ToolRegistry();
  const completedTool = {
    toolId: "liuyao.calculate", toolVersion: "1", status: "succeeded" as const,
    startedAt: "2026-08-03T00:00:00.000Z", finishedAt: "2026-08-03T00:00:00.001Z",
    durationMs: 1, permission: "authenticated" as const, risk: "medium" as const,
  };
  const result = await runMirrorRuntime({
    text: "请深入分析", requestedMode: "deep", sessionId: "s", userId: "u", registry,
    completedToolTraces: [completedTool], memoryUsed: true, reflectionCompleted: true,
    claims: [{ text: "有明确依据", kind: "supported", confidence: 0.78, evidenceIds: ["rule:1"] }],
  });
  assert.equal(result.trace.mode.source, "explicit");
  assert.equal(result.trace.tools[0].toolId, "liuyao.calculate");
  assert.equal(result.trace.stages.find((stage) => stage.name === "memory")?.status, "completed");
  assert.equal(result.trace.stages.find((stage) => stage.name === "reflection")?.status, "completed");
  assert.deepEqual(result.trace.evaluation.flags, []);
});
