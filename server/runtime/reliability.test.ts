import assert from "node:assert/strict";
import test from "node:test";
import { PRIVATE_RESPONSE_CACHE_POLICY, dailyBudgetDecision, nextTaskAttempt, recoveryContract } from "./reliability.js";

test("daily budget stops a model call before the configured limit is exceeded", () => {
  assert.equal(dailyBudgetDecision(999, 1_000).allowed, true);
  assert.equal(dailyBudgetDecision(1_000, 1_000).allowed, false);
  assert.equal(dailyBudgetDecision(20, undefined).allowed, true);
});

test("task replay cancels deleted or version-mismatched sources", () => {
  assert.equal(nextTaskAttempt({ attempts: 0, deletedSource: true, runtimeVersion: 1, requestedVersion: 1, now: new Date(0) }).state, "cancelled");
  assert.equal(nextTaskAttempt({ attempts: 0, deletedSource: false, runtimeVersion: 2, requestedVersion: 1, now: new Date(0) }).errorCode, "runtime_version_mismatch");
  assert.equal(nextTaskAttempt({ attempts: 2, deletedSource: false, runtimeVersion: 1, requestedVersion: 1, now: new Date(0) }).state, "queued");
});

test("recovery contract requires release identity, schema and core D1 tables", () => {
  const result = recoveryContract({ sourceCommit: "2f35151168dca41e", schemaVersion: 12, runtimeVersions: { observation_extractor: 1, context_builder: 2, account_merge_policy: 2, release_recovery_contract: 1 }, requiredTables: ["account_data", "memory_events", "memory_observations", "background_tasks", "account_item_tombstones"] });
  assert.equal(result.passed, true);
  assert.equal(PRIVATE_RESPONSE_CACHE_POLICY, "disabled");
});
