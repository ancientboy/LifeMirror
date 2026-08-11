import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const workerPath = new URL("../dist/server/index.js", import.meta.url);
const source = await readFile(workerPath, "utf8");
assert.ok(source.startsWith("const SESSION_COOKIE"), "worker must be emitted as readable ESM, not binary content");

for (const contract of [
  "/api/v1/account/daily-checkins",
  "/api/v1/account/expression-preferences",
  "/api/v1/account/notifications",
  "/api/v1/social/",
  "/api/v1/ops/summary",
  "/api/v1/ops/tasks/replay",
  "/api/v1/ops/recovery/drill",
  "/api/v1/ops/acceptance/run",
  "account_item_tombstones",
  "llm_call_audits",
  "background_tasks",
  "share_funnel_events",
  "mirror_feedback_events",
  "release_acceptance_runs",
  "async scheduled(",
]) assert.ok(source.includes(contract), `missing Worker release contract: ${contract}`);

const migration = await readFile(new URL("../.openai/drizzle/0012_release_reliability_and_moderation.sql", import.meta.url), "utf8");
for (const table of ["account_item_tombstones", "notification_delivery_outbox", "share_funnel_events", "recovery_drill_runs"]) assert.ok(migration.includes(table), `missing D1 migration table: ${table}`);
const acceptanceMigration = await readFile(new URL("../.openai/drizzle/0013_release_acceptance_and_feedback.sql", import.meta.url), "utf8");
for (const table of ["mirror_feedback_events", "release_acceptance_runs"]) assert.ok(acceptanceMigration.includes(table), `missing D1 acceptance migration table: ${table}`);

const worker = await import(pathToFileURL(workerPath.pathname).href + `?verify=${Date.now()}`);
assert.equal(typeof worker.default?.fetch, "function");
assert.equal(typeof worker.default?.scheduled, "function");
console.log("Sites Worker P0-P3 release contract verified");
