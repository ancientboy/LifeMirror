export const GOLDEN_EVALUATION_VERSION = "2026-08-11.1";

export const REQUIRED_GOLDEN_SCENARIOS = [
  "recall_relevance",
  "time_recency",
  "relationship_isolation",
  "deletion_tombstone",
  "user_correction",
  "symbolic_reality_boundary",
  "daily_personalization",
  "guest_migration",
] as const;

export type GoldenScenarioId = (typeof REQUIRED_GOLDEN_SCENARIOS)[number];
export type GoldenScenario = {
  id: GoldenScenarioId;
  version: string;
  input: Record<string, unknown>;
  expected: Record<string, unknown>;
};

export type GoldenGateResult = { passed: boolean; version: string; failures: string[] };

const FORBIDDEN_FIXTURE_KEYS = /(?:email|phone|name|content|prompt|message|body|quote)/i;

/**
 * The release fixture is intentionally structural: it has opaque IDs and
 * expected behaviour only.  Golden data must never become a second store of
 * customer conversations or relationship details.
 */
export function validateGoldenEvaluation(scenarios: readonly GoldenScenario[]): GoldenGateResult {
  const failures: string[] = [];
  const seen = new Set<string>();
  for (const scenario of scenarios) {
    if (seen.has(scenario.id)) failures.push(`duplicate:${scenario.id}`);
    seen.add(scenario.id);
    if (scenario.version !== GOLDEN_EVALUATION_VERSION) failures.push(`version:${scenario.id}`);
    for (const key of [...Object.keys(scenario.input), ...Object.keys(scenario.expected)]) {
      if (FORBIDDEN_FIXTURE_KEYS.test(key)) failures.push(`privacy_key:${scenario.id}:${key}`);
    }
  }
  for (const id of REQUIRED_GOLDEN_SCENARIOS) if (!seen.has(id)) failures.push(`missing:${id}`);
  return { passed: failures.length === 0, version: GOLDEN_EVALUATION_VERSION, failures };
}

export const GOLDEN_EVALUATION_SUITE: readonly GoldenScenario[] = [
  { id: "recall_relevance", version: GOLDEN_EVALUATION_VERSION, input: { queryToken: "work", recentEventIds: ["evt-current", "evt-unrelated"] }, expected: { includes: ["evt-current"], excludes: ["evt-unrelated"] } },
  { id: "time_recency", version: GOLDEN_EVALUATION_VERSION, input: { candidateIds: ["evt-recent", "evt-stale"] }, expected: { first: "evt-recent" } },
  { id: "relationship_isolation", version: GOLDEN_EVALUATION_VERSION, input: { requestedScope: "person:a", candidateScopes: ["person:a", "person:b"] }, expected: { excludesScope: "person:b" } },
  { id: "deletion_tombstone", version: GOLDEN_EVALUATION_VERSION, input: { deletedId: "evt-deleted", staleUploadId: "evt-deleted" }, expected: { excludes: ["evt-deleted"], writeResult: "tombstone_wins" } },
  { id: "user_correction", version: GOLDEN_EVALUATION_VERSION, input: { observationId: "obs-corrected", revision: "contradicted" }, expected: { recall: "excluded" } },
  { id: "symbolic_reality_boundary", version: GOLDEN_EVALUATION_VERSION, input: { sourceKind: "mirror_history", claimKind: "symbolic" }, expected: { writesUserFact: false } },
  { id: "daily_personalization", version: GOLDEN_EVALUATION_VERSION, input: { activeObservationIds: ["obs-current"] }, expected: { source: "authorized_server_context", includes: ["obs-current"] } },
  { id: "guest_migration", version: GOLDEN_EVALUATION_VERSION, input: { migrationId: "guest-once", attempts: 2 }, expected: { acceptedMigrations: 1, historyPreserved: true } },
] as const;
