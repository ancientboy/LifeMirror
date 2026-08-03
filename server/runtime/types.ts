import type { KnowledgeConflict, KnowledgeTrace } from "../knowledge/types.js";

export const INTERACTION_MODES = ["casual", "reflection", "deep", "review", "exploration"] as const;
export type InteractionMode = (typeof INTERACTION_MODES)[number];

export type ModeDecision = {
  mode: InteractionMode;
  confidence: number;
  reasons: string[];
  source: "explicit" | "deterministic" | "fallback";
};

export type ToolRisk = "low" | "medium" | "high";
export type ToolPermission = "public" | "authenticated" | "sensitive";

export type MirrorToolContext = {
  userId?: string;
  sessionId: string;
  mode: InteractionMode;
  consentedPermissions?: ToolPermission[];
  signal?: AbortSignal;
};

export type MirrorToolDefinition<TInput = unknown, TOutput = unknown> = {
  id: string;
  version: string;
  description: string;
  supportedModes: InteractionMode[];
  permission: ToolPermission;
  risk: ToolRisk;
  timeoutMs?: number;
  validate(input: unknown): TInput;
  execute(input: TInput, context: MirrorToolContext): Promise<TOutput>;
};

export type ToolExecutionTrace = {
  toolId: string;
  toolVersion: string;
  status: "succeeded" | "failed" | "denied" | "timed_out";
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  permission: ToolPermission;
  risk: ToolRisk;
  errorCode?: string;
};

export type ToolExecutionResult<T = unknown> = {
  output?: T;
  trace: ToolExecutionTrace;
};

export type EvaluationInput = {
  claims: Array<{
    text: string;
    kind: "observed" | "supported" | "inferred" | "unverified" | "restricted";
    confidence: number;
    evidenceIds?: string[];
    highImpact?: boolean;
  }>;
  knowledgeTraces?: KnowledgeTrace[];
  knowledgeConflicts?: KnowledgeConflict[];
  toolTraces?: ToolExecutionTrace[];
  safetyBoundaries?: string[];
};

export type TrustEvaluation = {
  level: "observed" | "supported" | "inferred" | "unverified" | "restricted";
  score: number;
  dimensions: {
    evidenceQuality: number;
    confidenceCalibration: number;
    consistency: number;
    safety: number;
  };
  flags: string[];
  requiresUserConfirmation: boolean;
};

export type RuntimeTrace = {
  id: string;
  startedAt: string;
  finishedAt: string;
  mode: ModeDecision;
  stages: Array<{
    name: "mode" | "memory" | "knowledge" | "tool" | "reflection" | "evaluation" | "save";
    status: "completed" | "skipped" | "failed";
    detail?: string;
  }>;
  knowledge: KnowledgeTrace[];
  tools: ToolExecutionTrace[];
  evaluation: TrustEvaluation;
};
