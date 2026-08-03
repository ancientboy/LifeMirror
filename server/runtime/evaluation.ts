import type { EvaluationInput, TrustEvaluation } from "./types.js";

const LEVEL_ORDER = ["observed", "supported", "inferred", "unverified", "restricted"] as const;

export function evaluateTrust(input: EvaluationInput): TrustEvaluation {
  const flags: string[] = [];
  const claims = input.claims;
  const evidenceCoverage = claims.length ? claims.filter((claim) => claim.evidenceIds?.length).length / claims.length : 0;
  const failedTools = (input.toolTraces ?? []).filter((trace) => trace.status !== "succeeded");
  const conflictCount = input.knowledgeConflicts?.length ?? 0;
  const overconfident = claims.some((claim) => claim.confidence > 0.8 && !claim.evidenceIds?.length);
  const restricted = claims.some((claim) => claim.kind === "restricted");
  const unsupportedHighImpact = claims.some((claim) => claim.highImpact && (!claim.evidenceIds?.length || claim.confidence < 0.75));
  if (evidenceCoverage < 1) flags.push("incomplete_evidence");
  if (overconfident) flags.push("uncalibrated_confidence");
  if (conflictCount) flags.push("knowledge_conflict");
  if (failedTools.length) flags.push("tool_execution_issue");
  if (restricted) flags.push("restricted_claim");
  if (unsupportedHighImpact) flags.push("high_impact_confirmation_required");

  const dimensions = {
    evidenceQuality: Math.max(0, Math.min(1, evidenceCoverage)),
    confidenceCalibration: overconfident ? 0.35 : 0.9,
    consistency: conflictCount ? Math.max(0.2, 1 - conflictCount * 0.2) : 1,
    safety: restricted ? 0 : unsupportedHighImpact ? 0.45 : 1,
  };
  const score = Number((Object.values(dimensions).reduce((sum, value) => sum + value, 0) / 4).toFixed(2));
  const worstClaim = claims.map((claim) => LEVEL_ORDER.indexOf(claim.kind)).reduce((worst, value) => Math.max(worst, value), 3);
  const level = restricted ? "restricted" : unsupportedHighImpact || score < 0.5 ? "unverified" : score < 0.7 ? "inferred" : LEVEL_ORDER[Math.min(worstClaim, 1)];
  return { level, score, dimensions, flags, requiresUserConfirmation: restricted || unsupportedHighImpact || conflictCount > 0 };
}
