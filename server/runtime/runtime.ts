import type { KnowledgeConflict, KnowledgeTrace } from "../knowledge/types.js";
import { evaluateTrust } from "./evaluation.js";
import { routeInteractionMode } from "./mode-router.js";
import { executeTool, ToolRegistry } from "./tool-registry.js";
import type { EvaluationInput, InteractionMode, RuntimeTrace, ToolExecutionResult, ToolExecutionTrace } from "./types.js";

export async function runMirrorRuntime<T>(input: {
  text: string;
  requestedMode?: InteractionMode;
  sessionId: string;
  userId?: string;
  tool?: { id: string; input: unknown };
  registry: ToolRegistry;
  knowledge?: { traces: KnowledgeTrace[]; conflicts: KnowledgeConflict[] };
  completedToolTraces?: ToolExecutionTrace[];
  memoryUsed?: boolean;
  reflectionCompleted?: boolean;
  claims: EvaluationInput["claims"];
}): Promise<{ tool?: ToolExecutionResult<T>; trace: RuntimeTrace }> {
  const startedAt = new Date().toISOString();
  const mode = routeInteractionMode(input);
  const stages: RuntimeTrace["stages"] = [{ name: "mode", status: "completed", detail: mode.mode }];
  stages.push({ name: "memory", status: input.memoryUsed ? "completed" : "skipped", detail: input.memoryUsed ? "personal context supplied" : "memory adapter not supplied" });
  stages.push({ name: "knowledge", status: input.knowledge ? "completed" : "skipped" });
  let tool: ToolExecutionResult<T> | undefined;
  if (input.tool) {
    tool = await executeTool<T>(input.registry, input.tool.id, input.tool.input, { sessionId: input.sessionId, userId: input.userId, mode: mode.mode });
    stages.push({ name: "tool", status: tool.trace.status === "succeeded" ? "completed" : "failed", detail: tool.trace.errorCode });
  } else stages.push({ name: "tool", status: "skipped" });
  stages.push({ name: "reflection", status: input.reflectionCompleted ? "completed" : "skipped", detail: input.reflectionCompleted ? "reflection generated" : "reflection adapter not supplied" });
  const toolTraces = [...(input.completedToolTraces ?? []), ...(tool ? [tool.trace] : [])];
  const evaluation = evaluateTrust({ claims: input.claims, knowledgeTraces: input.knowledge?.traces, knowledgeConflicts: input.knowledge?.conflicts, toolTraces });
  stages.push({ name: "evaluation", status: "completed", detail: evaluation.level });
  stages.push({ name: "save", status: "skipped", detail: "persistence adapter not supplied" });
  return { tool, trace: { id: crypto.randomUUID(), startedAt, finishedAt: new Date().toISOString(), mode, stages, knowledge: input.knowledge?.traces ?? [], tools: toolTraces, evaluation } };
}
