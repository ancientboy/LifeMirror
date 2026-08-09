import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { findUserBySession, type AuthenticatedUser } from "../auth/session.js";
import type { AppDependencies } from "../app.js";
import { acceptConversationMemory } from "../memory/conversation-gate.js";
import { buildPersonalContext } from "../memory/context-builder.js";

const sourceSchema = z.enum(["liuyao", "tarot", "bazi", "astrology", "conversation"]);
const historySchema = z.object({
  sourceKind: sourceSchema,
  sourceRecordKey: z.string().trim().min(1).max(180),
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(2000),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
  occurredAt: z.string().datetime().optional(),
  stableReference: z.boolean().optional().default(false),
  important: z.boolean().optional().default(false),
  openLoopStatus: z.enum(["open", "resolved", "unknown"]).optional().default("unknown"),
  personId: z.string().uuid().nullable().optional(),
}).strict();
const historyPatchSchema = z.object({ important: z.boolean().optional(), openLoopStatus: z.enum(["open", "resolved", "unknown"]).optional(), personId: z.string().uuid().nullable().optional() }).strict();
const conversationSchema = z.object({ message: z.string().trim().min(1).max(500), conversationKey: z.string().trim().min(1).max(180).optional() }).strict();
const personSchema = z.object({ displayName: z.string().trim().min(1).max(80), relationshipType: z.string().trim().max(80).optional(), userDescription: z.string().trim().max(500).optional(), communicationNotes: z.string().trim().max(500).optional() }).strict();
const contextQuery = z.object({ mode: z.enum(["chat", "daily_guidance", "review", "relationship", "rehearsal"]).optional().default("chat"), q: z.string().trim().max(300).optional(), personId: z.string().uuid().optional(), limit: z.coerce.number().int().min(1).max(12).optional() });

async function requireUser(request: FastifyRequest, reply: FastifyReply, dependencies: AppDependencies): Promise<AuthenticatedUser | null> {
  const user = await findUserBySession(dependencies.database, request.cookies[dependencies.config.SESSION_COOKIE_NAME]);
  if (!user) reply.code(401).send({ error: "authentication_required" });
  return user;
}

export async function registerContextRoutes(app: FastifyInstance, dependencies: AppDependencies) {
  app.post("/api/v1/history", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies); if (!user) return;
    const parsed = historySchema.safeParse(request.body); if (!parsed.success) return reply.code(400).send({ error: "invalid_history_record" });
    const item = parsed.data;
    const result = await dependencies.database.query<{ id: string; created_at: Date; updated_at: Date }>(
      `INSERT INTO user_history_records (id, user_id, source_kind, source_record_key, title, summary, payload, occurred_at, stable_reference, important, open_loop_status, person_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12)
       ON CONFLICT (user_id, source_kind, source_record_key) DO UPDATE SET
         title = EXCLUDED.title, summary = EXCLUDED.summary, payload = EXCLUDED.payload, important = user_history_records.important OR EXCLUDED.important,
         open_loop_status = EXCLUDED.open_loop_status, person_id = COALESCE(EXCLUDED.person_id, user_history_records.person_id), updated_at = now()
       RETURNING id, created_at, updated_at`,
      [randomUUID(), user.id, item.sourceKind, item.sourceRecordKey, item.title, item.summary, JSON.stringify(item.payload), item.occurredAt ?? new Date().toISOString(), item.stableReference, item.important, item.openLoopStatus, item.personId ?? null],
    );
    return reply.code(201).send({ history: { id: result.rows[0].id, createdAt: result.rows[0].created_at.toISOString(), updatedAt: result.rows[0].updated_at.toISOString(), deduplicatedBy: ["userId", "sourceKind", "sourceRecordKey"] }, memory: { written: false, reason: "history_is_not_long_term_memory" } });
  });

  app.patch("/api/v1/history/:id", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies); if (!user) return;
    const params = z.object({ id: z.string().uuid() }).safeParse(request.params); const parsed = historyPatchSchema.safeParse(request.body);
    if (!params.success || !parsed.success || !Object.keys(parsed.data).length) return reply.code(400).send({ error: "invalid_history_update" });
    const fields = { important: "important", openLoopStatus: "open_loop_status", personId: "person_id" } as const;
    const entries = Object.entries(parsed.data) as Array<[keyof typeof fields, unknown]>;
    const sets = entries.map(([key], index) => `${fields[key]} = $${index + 3}`);
    const result = await dependencies.database.query<{ id: string }>(`UPDATE user_history_records SET ${sets.join(", ")}, updated_at = now() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id`, [params.data.id, user.id, ...entries.map(([, value]) => value)]);
    if (!result.rows[0]) return reply.code(404).send({ error: "history_not_found" });
    return { history: result.rows[0] };
  });

  app.delete("/api/v1/history/:id", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies); if (!user) return;
    const params = z.object({ id: z.string().uuid() }).safeParse(request.params); if (!params.success) return reply.code(400).send({ error: "invalid_history_target" });
    const result = await dependencies.database.query<{ id: string }>(`UPDATE user_history_records SET deleted_at = now(), updated_at = now() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id`, [params.data.id, user.id]);
    if (!result.rows[0]) return reply.code(404).send({ error: "history_not_found" });
    return reply.code(204).send();
  });

  app.post("/api/v1/conversations/memory", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies); if (!user) return;
    const parsed = conversationSchema.safeParse(request.body); if (!parsed.success) return reply.code(400).send({ error: "invalid_conversation_memory" });
    const accepted = acceptConversationMemory(parsed.data.message);
    if (!accepted) return { memory: null, accepted: false, reason: "conversation_not_explicit_or_confirmed" };
    const result = await dependencies.database.query<{ id: string; updated_at: Date }>(
      `INSERT INTO user_explicit_facts (id, user_id, fact_text, fact_kind, source_conversation_key)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id, fact_text) DO UPDATE SET fact_kind = EXCLUDED.fact_kind, source_conversation_key = EXCLUDED.source_conversation_key, visibility = 'visible', updated_at = now()
       RETURNING id, updated_at`, [randomUUID(), user.id, accepted.text, accepted.kind, parsed.data.conversationKey ?? null],
    );
    return reply.code(201).send({ memory: { id: result.rows[0].id, text: accepted.text, kind: accepted.kind, updatedAt: result.rows[0].updated_at.toISOString() }, accepted: true });
  });

  app.get("/api/v1/context", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies); if (!user) return;
    const parsed = contextQuery.safeParse(request.query); if (!parsed.success) return reply.code(400).send({ error: "invalid_context_query" });
    return { context: await buildPersonalContext(dependencies.database, user.id, { mode: parsed.data.mode, query: parsed.data.q, personId: parsed.data.personId, limit: parsed.data.limit }) };
  });

  app.get("/api/v1/people", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies); if (!user) return;
    const people = await dependencies.database.query(`SELECT id, display_name AS "displayName", relationship_type AS "relationshipType", user_description AS "userDescription", communication_notes AS "communicationNotes", created_at AS "createdAt", updated_at AS "updatedAt" FROM relationship_people WHERE owner_user_id = $1 AND deleted_at IS NULL ORDER BY updated_at DESC`, [user.id]);
    return { people: people.rows, provenance: "owner_authored_perspective" };
  });

  app.post("/api/v1/people", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies); if (!user) return;
    const parsed = personSchema.safeParse(request.body); if (!parsed.success) return reply.code(400).send({ error: "invalid_person" });
    const person = parsed.data;
    const result = await dependencies.database.query<{ id: string; created_at: Date; updated_at: Date }>(`INSERT INTO relationship_people (id, owner_user_id, display_name, relationship_type, user_description, communication_notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, created_at, updated_at`, [randomUUID(), user.id, person.displayName, person.relationshipType ?? null, person.userDescription ?? null, person.communicationNotes ?? null]);
    return reply.code(201).send({ person: { id: result.rows[0].id, ...person, createdAt: result.rows[0].created_at.toISOString(), updatedAt: result.rows[0].updated_at.toISOString() }, provenance: "owner_authored_perspective" });
  });
}
