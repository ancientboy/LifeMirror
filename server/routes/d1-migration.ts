import { createHash } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import type { AppConfig } from "../config.js";
import type { Database } from "../database/pool.js";

const allowedTables = new Set([
  "account_data", "account_item_tombstones", "attachment_metadata", "background_tasks", "beta_invites", "beta_participants",
  "context_audit_traces", "email_codes", "experience_invite_batches", "experience_invite_uses", "expression_preferences",
  "guest_migration_receipts", "identity_sessions", "identity_users", "llm_call_audits", "memory_events", "memory_evidence_links",
  "memory_observations", "memory_revisions", "mirror_feedback_events", "mirror_share_links", "mirror_share_responses",
  "notification_delivery_outbox", "product_metric_events", "recovery_drill_runs", "relationship_cases", "relationship_effect_events",
  "relationship_events", "relationship_feedback", "relationship_people", "relationship_person_links", "relationship_questions",
  "relationship_revisions", "relationship_safety_reports", "relationship_shared_events", "relationships", "release_acceptance_runs",
  "runtime_versions", "share_funnel_events", "social_notification_preferences", "social_notifications", "social_profiles",
]);

const chunkSchema = z.object({
  runId: z.string().min(8).max(120),
  table: z.string().min(1).max(80),
  rows: z.array(z.record(z.string(), z.unknown())).max(100),
  sourceCount: z.number().int().nonnegative().optional(),
  final: z.boolean().optional(),
});

function authorized(request: FastifyRequest, config: AppConfig) {
  const expected = config.D1_MIGRATION_TOKEN;
  const received = request.headers["x-lifemirror-migration-token"];
  return Boolean(expected && typeof received === "string" && received.length === expected.length && received === expected);
}

function fingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function sourceKey(row: Record<string, unknown>, fallbackIndex: number) {
  for (const field of ["id", "user_id", "email", "code", "component"]) {
    const value = row[field];
    if (typeof value === "string" && value) return `${field}:${value}`;
  }
  return `hash:${fallbackIndex}:${fingerprint(row)}`;
}

function timestamp(value: unknown) {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : new Date().toISOString();
}

type QueryClient = Pick<Database, "query">;

async function projectRow(database: QueryClient, table: string, row: Record<string, unknown>) {
  if (table === "identity_users" && typeof row.id === "string" && typeof row.email === "string") {
    const provider = typeof row.provider === "string" ? row.provider : "email";
    const displayName = typeof row.display_name === "string" ? row.display_name : null;
    await database.query(
      `INSERT INTO identity_users (id, email, password_hash, display_name, provider, legacy_d1_user, created_at, updated_at)
       VALUES ($1::uuid, $2, $3, $4, $5, TRUE, $6, $7)
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, display_name = COALESCE(EXCLUDED.display_name, identity_users.display_name),
         provider = EXCLUDED.provider, legacy_d1_user = TRUE, updated_at = EXCLUDED.updated_at`,
      [row.id, row.email.toLowerCase(), "!passwordless-d1-import!", displayName, provider, timestamp(row.created_at), timestamp(row.updated_at)],
    );
  }
  if (table === "identity_sessions" && typeof row.id === "string" && typeof row.user_id === "string" && typeof row.token_hash === "string") {
    await database.query(
      `INSERT INTO auth_sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $5)
       ON CONFLICT (id) DO UPDATE SET token_hash = EXCLUDED.token_hash, expires_at = EXCLUDED.expires_at, last_seen_at = EXCLUDED.last_seen_at`,
      [row.id, row.user_id, row.token_hash, timestamp(row.expires_at), timestamp(row.created_at)],
    );
  }
  if (table === "account_data" && typeof row.user_id === "string") {
    const json = (value: unknown, fallback: string) => typeof value === "string" ? value : fallback;
    await database.query(
      `INSERT INTO legacy_account_data (user_id, settings_json, facts_json, history_json, tarot_json, updated_at, imported_at)
       VALUES ($1::uuid, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, $6, now())
       ON CONFLICT (user_id) DO UPDATE SET settings_json = EXCLUDED.settings_json, facts_json = EXCLUDED.facts_json,
         history_json = EXCLUDED.history_json, tarot_json = EXCLUDED.tarot_json, updated_at = EXCLUDED.updated_at, imported_at = now()`,
      [row.user_id, json(row.settings_json, "{}"), json(row.facts_json, "[]"), json(row.history_json, "[]"), json(row.tarot_json, "[]"), timestamp(row.updated_at)],
    );
  }
}

export async function registerD1MigrationRoutes(app: FastifyInstance, dependencies: { config: AppConfig; database: Database }) {
  app.post("/api/internal/migration/v1/import", { config: { rateLimit: false } }, async (request, reply) => {
    if (!authorized(request, dependencies.config)) return reply.code(404).send({ error: "not_found" });
    const parsed = chunkSchema.safeParse(request.body);
    if (!parsed.success || !allowedTables.has(parsed.data.table)) return reply.code(400).send({ error: "invalid_migration_chunk" });
    const { runId, table, rows, sourceCount, final } = parsed.data;
    const client = await dependencies.database.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO d1_migration_runs (run_id, status, source_counts) VALUES ($1, 'receiving', '{}'::jsonb)
         ON CONFLICT (run_id) DO UPDATE SET status = 'receiving', updated_at = now()`,
        [runId],
      );
      for (const [index, row] of rows.entries()) {
        const key = sourceKey(row, index);
        const hash = fingerprint(row);
        await client.query(
          `INSERT INTO d1_migration_records (run_id, source_table, source_row_key, payload, payload_hash)
           VALUES ($1, $2, $3, $4::jsonb, $5)
           ON CONFLICT (run_id, source_table, source_row_key) DO UPDATE SET payload = EXCLUDED.payload, payload_hash = EXCLUDED.payload_hash, imported_at = now()`,
          [runId, table, key, JSON.stringify(row), hash],
        );
        await projectRow(client as unknown as QueryClient, table, row);
      }
      const count = typeof sourceCount === "number" ? sourceCount : null;
      await client.query(
        `UPDATE d1_migration_runs
           SET received_rows = (SELECT count(*) FROM d1_migration_records WHERE run_id = $1),
               source_counts = CASE WHEN $2::int IS NULL THEN source_counts ELSE jsonb_set(source_counts, ARRAY[$3], to_jsonb($2::int), true) END,
               status = CASE WHEN $4::boolean THEN 'completed' ELSE 'receiving' END,
               completed_at = CASE WHEN $4::boolean THEN now() ELSE completed_at END,
               updated_at = now()
         WHERE run_id = $1`,
        [runId, count, table, Boolean(final)],
      );
      await client.query("COMMIT");
      return { ok: true, runId, table, accepted: rows.length };
    } catch (error) {
      await client.query("ROLLBACK");
      await dependencies.database.query("UPDATE d1_migration_runs SET status = 'failed', updated_at = now() WHERE run_id = $1", [runId]).catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  });

  app.get("/api/internal/migration/v1/status/:runId", { config: { rateLimit: false } }, async (request, reply) => {
    if (!authorized(request, dependencies.config)) return reply.code(404).send({ error: "not_found" });
    const runId = String((request.params as { runId?: string }).runId || "");
    const run = await dependencies.database.query<{ run_id: string; status: string; received_rows: number; source_counts: unknown; target_counts: unknown; started_at: string; completed_at: string | null }>(
      "SELECT run_id, status, received_rows, source_counts, target_counts, started_at, completed_at FROM d1_migration_runs WHERE run_id = $1",
      [runId],
    );
    if (!run.rows[0]) return reply.code(404).send({ error: "migration_not_found" });
    const tables = await dependencies.database.query<{ source_table: string; rows: number }>(
      "SELECT source_table, count(*)::int AS rows FROM d1_migration_records WHERE run_id = $1 GROUP BY source_table ORDER BY source_table",
      [runId],
    );
    return { run: run.rows[0], tables: tables.rows };
  });
}
