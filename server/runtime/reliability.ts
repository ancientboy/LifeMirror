export const RUNTIME_COMPONENT_VERSIONS = {
  observationExtractor: 1,
  contextBuilder: 2,
  expressionPolicy: 1,
  accountMergePolicy: 2,
  notificationPolicy: 2,
  recoveryContract: 1,
} as const;

export type DailyBudgetDecision = {
  allowed: boolean;
  usedMicrousd: number;
  limitMicrousd: number;
  remainingMicrousd: number;
};

export function dailyBudgetDecision(used: number | string, configuredLimit: number | string | undefined): DailyBudgetDecision {
  const usedMicrousd = Math.max(0, Number(used) || 0);
  const parsed = Number(configuredLimit);
  const limitMicrousd = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
  return {
    allowed: !limitMicrousd || usedMicrousd < limitMicrousd,
    usedMicrousd,
    limitMicrousd,
    remainingMicrousd: limitMicrousd ? Math.max(0, limitMicrousd - usedMicrousd) : Number.POSITIVE_INFINITY,
  };
}

export function nextTaskAttempt(input: { attempts: number; deletedSource: boolean; runtimeVersion: number; requestedVersion: number; now: Date }) {
  if (input.deletedSource) return { state: "cancelled" as const, availableAt: null, errorCode: "source_deleted" };
  if (input.runtimeVersion !== input.requestedVersion) return { state: "cancelled" as const, availableAt: null, errorCode: "runtime_version_mismatch" };
  const attempts = Math.max(0, input.attempts);
  if (attempts >= 5) return { state: "failed" as const, availableAt: null, errorCode: "attempts_exhausted" };
  const delayMinutes = Math.min(360, 2 ** attempts * 5);
  return { state: "queued" as const, availableAt: new Date(input.now.getTime() + delayMinutes * 60_000).toISOString(), errorCode: "retry_scheduled" };
}

export function recoveryContract(input: { sourceCommit: string; schemaVersion: number; runtimeVersions: Record<string, number>; requiredTables: string[] }) {
  const checks = {
    sourceCommit: /^[0-9a-f]{7,64}$/i.test(input.sourceCommit),
    schemaVersion: input.schemaVersion >= 12,
    runtimeVersions: ["observation_extractor", "context_builder", "account_merge_policy", "release_recovery_contract"].every((key) => Number(input.runtimeVersions[key]) >= 1),
    requiredTables: ["account_data", "memory_events", "memory_observations", "background_tasks", "account_item_tombstones"].every((table) => input.requiredTables.includes(table)),
  };
  return { passed: Object.values(checks).every(Boolean), checks };
}

/** Private LLM output is intentionally never cached across requests/users. */
export const PRIVATE_RESPONSE_CACHE_POLICY = "disabled" as const;
