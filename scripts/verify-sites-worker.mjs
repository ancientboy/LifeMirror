import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const workerPath = new URL("../dist/server/index.js", import.meta.url);
const source = await readFile(workerPath, "utf8");
assert.ok(source.startsWith("const SESSION_COOKIE"), "worker must be emitted as readable ESM, not binary content");

for (const contract of [
  "/api/v1/account/daily-checkins",
  "/api/v1/account/life-loops",
  "/api/v1/account/product-metrics/events",
  "/api/v1/account/expression-preferences",
  "/api/v1/account/notifications",
  "/api/v1/account/relationships",
  "/api/shiguang/vision/extract",
  "/api/v1/social/",
  "/api/v1/ops/summary",
  "/api/v1/ops/tasks/replay",
  "/api/v1/ops/recovery/drill",
  "/api/v1/ops/acceptance/run",
  "/api/v1/auth/invite",
  "/api/v1/ops/invites",
  "account_item_tombstones",
  "llm_call_audits",
  "background_tasks",
  "share_funnel_events",
  "mirror_feedback_events",
  "release_acceptance_runs",
  "relationship_people",
  "relationship_cases",
  "relationship_feedback",
  "attachment_metadata",
  "coreExperience",
  "openChatStream",
  '"text/event-stream; charset=utf-8"',
  "async scheduled(",
]) assert.ok(source.includes(contract), `missing Worker release contract: ${contract}`);

const migration = await readFile(new URL("../.openai/drizzle/0012_release_reliability_and_moderation.sql", import.meta.url), "utf8");
for (const table of ["account_item_tombstones", "notification_delivery_outbox", "share_funnel_events", "recovery_drill_runs"]) assert.ok(migration.includes(table), `missing D1 migration table: ${table}`);
const acceptanceMigration = await readFile(new URL("../.openai/drizzle/0013_release_acceptance_and_feedback.sql", import.meta.url), "utf8");
for (const table of ["mirror_feedback_events", "release_acceptance_runs"]) assert.ok(acceptanceMigration.includes(table), `missing D1 acceptance migration table: ${table}`);
const coreMetricsMigration = await readFile(new URL("../.openai/drizzle/0014_core_experience_metrics.sql", import.meta.url), "utf8");
for (const eventType of ["life_loop_created", "life_loop_feedback", "memory_recall_positive", "memory_recall_negative", "share_intent"]) assert.ok(coreMetricsMigration.includes(eventType), `missing core experience metric: ${eventType}`);
const betaMigration = await readFile(new URL("../.openai/drizzle/0015_beta_access_and_chat_experience.sql", import.meta.url), "utf8");
for (const contract of ["beta_invites", "beta_participants", "invite_accepted", "generation_retried", "chat_feedback_helpful", "account_bound"]) assert.ok(betaMigration.includes(contract), `missing beta experience contract: ${contract}`);
const relationshipMigration = await readFile(new URL("../.openai/drizzle/0016_relationship_engine.sql", import.meta.url), "utf8");
for (const contract of ["relationship_people", "relationship_cases", "relationship_events", "relationship_feedback", "attachment_metadata", "relationship_outcome_positive", "vision_parse_failed"]) assert.ok(relationshipMigration.includes(contract), `missing relationship engine contract: ${contract}`);
assert.ok(source.includes("原图") === false, "Worker must not persist screenshot originals");

const worker = await import(pathToFileURL(workerPath.pathname).href + `?verify=${Date.now()}`);
assert.equal(typeof worker.default?.fetch, "function");
assert.equal(typeof worker.default?.scheduled, "function");
console.log("Sites Worker promotion-readiness contract verified");
