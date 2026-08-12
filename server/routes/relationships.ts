import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { findUserBySession } from "../auth/session.js";
import type { AppDependencies } from "../app.js";

const personSchema = z.object({ displayName: z.string().trim().min(1).max(40), relationshipLabel: z.string().trim().max(80).optional(), legacyPersonId: z.string().max(120).optional() }).strict();
const caseSchema = z.object({ personId: z.string().uuid().optional(), text: z.string().trim().min(1).max(2_000), source: z.enum(["text", "screenshot"]), recommendedReply: z.string().max(500).optional() }).strict();
const feedbackSchema = z.object({ caseId: z.string().uuid(), acted: z.boolean(), outcome: z.enum(["positive", "mixed", "negative", "no_response", "not_yet"]), actualReply: z.string().max(500).optional(), note: z.string().max(500).optional() }).strict();
const idParamsSchema = z.object({ id: z.string().uuid() });
const caseLinkSchema = z.object({ personId: z.string().uuid() }).strict();

async function user(request: FastifyRequest, reply: FastifyReply, dependencies: AppDependencies) {
  const value = await findUserBySession(dependencies.database, request.cookies[dependencies.config.SESSION_COOKIE_NAME]);
  if (!value) reply.code(401).send({ error: "authentication_required" });
  return value;
}

function classify(label: string) {
  if (/前任/u.test(label)) return { domain: "romance", role: "ex", power: "roughly_equal" };
  if (/伴侣|对象|男友|女友/u.test(label)) return { domain: "romance", role: "partner", power: "roughly_equal" };
  if (/暧昧|约会/u.test(label)) return { domain: "romance", role: "dating", power: "roughly_equal" };
  if (/领导|老板/u.test(label)) return { domain: "work", role: "manager", power: "user_lower_power" };
  if (/同事/u.test(label)) return { domain: "work", role: "colleague", power: "roughly_equal" };
  if (/朋友/u.test(label)) return { domain: "friendship", role: "friend", power: "roughly_equal" };
  if (/家人|父|母|孩子|兄|姐|弟|妹/u.test(label)) return { domain: "family", role: "relative", power: "unknown" };
  return { domain: "other", role: "other", power: "unknown" };
}

function redact(value: string | undefined, max: number) {
  return String(value ?? "").replace(/1[3-9]\d{9}/g, "[手机号]").replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[邮箱]").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function registerRelationshipRoutes(app: FastifyInstance, dependencies: AppDependencies) {
  app.get("/api/v1/account/relationships", async (request, reply) => {
    const owner = await user(request, reply, dependencies); if (!owner) return;
    const [people, cases] = await Promise.all([
      dependencies.database.query("SELECT id, display_name AS \"displayName\", relationship_label AS \"relationshipLabel\", domain, role, stage, power_position AS \"powerPosition\", confirmed_by_user AS \"confirmedByUser\", legacy_person_id AS \"legacyPersonId\", created_at AS \"createdAt\", updated_at AS \"updatedAt\" FROM relationship_people WHERE owner_user_id = $1 AND deleted_at IS NULL AND archived_at IS NULL ORDER BY updated_at DESC LIMIT 40", [owner.id]),
      dependencies.database.query("SELECT id, person_id AS \"personId\", goal, status, source, strategy_key AS \"strategyKey\", initial_text_redacted AS summary, recommended_reply AS \"recommendedReply\", created_at AS \"createdAt\", updated_at AS \"updatedAt\", resolved_at AS \"resolvedAt\" FROM relationship_cases WHERE owner_user_id = $1 AND status <> 'archived' ORDER BY updated_at DESC LIMIT 100", [owner.id]),
    ]);
    return { people: people.rows, cases: cases.rows };
  });

  app.post("/api/v1/account/relationships/people", async (request, reply) => {
    const owner = await user(request, reply, dependencies); if (!owner) return;
    const parsed = personSchema.safeParse(request.body); if (!parsed.success) return reply.code(400).send({ error: "invalid_relationship_person" });
    const id = randomUUID(); const now = new Date().toISOString(); const label = parsed.data.relationshipLabel ?? ""; const kind = classify(label);
    const result = await dependencies.database.query<{ id: string }>("INSERT INTO relationship_people (id, owner_user_id, display_name, relationship_type, relationship_label, domain, role, stage, power_position, classification_source, confirmed_by_user, legacy_person_id, created_at, updated_at) VALUES ($1,$2,$3,$4,$4,$5,$6,'unknown',$7,'user_confirmed',true,$8,$9,$9) ON CONFLICT (owner_user_id, legacy_person_id) WHERE legacy_person_id IS NOT NULL DO UPDATE SET display_name = excluded.display_name, relationship_type = excluded.relationship_type, relationship_label = excluded.relationship_label, domain = excluded.domain, role = excluded.role, power_position = excluded.power_position, confirmed_by_user = true, deleted_at = NULL, archived_at = NULL, updated_at = excluded.updated_at RETURNING id", [id, owner.id, parsed.data.displayName, label, kind.domain, kind.role, kind.power, parsed.data.legacyPersonId ?? null, now]);
    return reply.code(201).send({ person: { id: result.rows[0]?.id ?? id, displayName: parsed.data.displayName, relationshipLabel: label, domain: kind.domain, role: kind.role, stage: "unknown", powerPosition: kind.power, confirmedByUser: true, legacyPersonId: parsed.data.legacyPersonId, createdAt: now, updatedAt: now } });
  });

  app.post("/api/v1/account/relationships/cases", async (request, reply) => {
    const owner = await user(request, reply, dependencies); if (!owner) return;
    const parsed = caseSchema.safeParse(request.body); if (!parsed.success) return reply.code(400).send({ error: "invalid_relationship_case" });
    if (parsed.data.personId) { const found = await dependencies.database.query("SELECT 1 FROM relationship_people WHERE id = $1 AND owner_user_id = $2", [parsed.data.personId, owner.id]); if (!found.rowCount) return reply.code(404).send({ error: "relationship_person_not_found" }); }
    const id = randomUUID(); const now = new Date().toISOString(); const cleanText = redact(parsed.data.text, 800); const cleanReply = redact(parsed.data.recommendedReply, 500) || undefined; const kind = classify(cleanText); const goal = /怎么回|回复/u.test(cleanText) ? "draft_reply" : /要不要主动/u.test(cleanText) ? "decide_initiation" : "interpret_signal";
    const client = await dependencies.database.connect();
    try {
      await client.query("BEGIN");
      await client.query("INSERT INTO relationship_cases (id, owner_user_id, person_id, goal, status, source, initial_text_redacted, strategy_key, recommended_reply, created_at, updated_at) VALUES ($1,$2,$3,$4,'awaiting_reply',$5,$6,$7,$8,$9,$9)", [id, owner.id, parsed.data.personId ?? null, goal, parsed.data.source, cleanText, kind.role, cleanReply ?? null, now]);
      await client.query("INSERT INTO relationship_events (id, owner_user_id, person_id, case_id, event_kind, payload_json, provenance, created_at) VALUES ($1,$2,$3,$4,'user_message',$5::jsonb,'user_authored',$6)", [randomUUID(), owner.id, parsed.data.personId ?? null, id, JSON.stringify({ version: 1, summary: cleanText, source: parsed.data.source }), now]);
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
    return reply.code(201).send({ case: { id, personId: parsed.data.personId, goal, status: "awaiting_reply", source: parsed.data.source, strategyKey: kind.role, summary: cleanText.slice(0, 180), recommendedReply: cleanReply, createdAt: now, updatedAt: now } });
  });

  app.post("/api/v1/account/relationships/feedback", async (request, reply) => {
    const owner = await user(request, reply, dependencies); if (!owner) return;
    const parsed = feedbackSchema.safeParse(request.body); if (!parsed.success) return reply.code(400).send({ error: "invalid_relationship_feedback" });
    const relationCase = await dependencies.database.query<{ person_id: string | null }>("SELECT person_id FROM relationship_cases WHERE id = $1 AND owner_user_id = $2", [parsed.data.caseId, owner.id]);
    if (!relationCase.rowCount) return reply.code(404).send({ error: "relationship_case_not_found" });
    const id = randomUUID(); const now = new Date().toISOString(); const summary = redact(parsed.data.actualReply || parsed.data.note, 500);
    const client = await dependencies.database.connect();
    try {
      await client.query("BEGIN");
      await client.query("INSERT INTO relationship_feedback (id, owner_user_id, person_id, case_id, acted, outcome, actual_reply_summary, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [id, owner.id, relationCase.rows[0]?.person_id ?? null, parsed.data.caseId, parsed.data.acted, parsed.data.outcome, summary || null, now]);
      await client.query("INSERT INTO relationship_events (id, owner_user_id, person_id, case_id, event_kind, payload_json, provenance, created_at) VALUES ($1,$2,$3,$4,'reality_feedback',$5::jsonb,'user_authored',$6)", [randomUUID(), owner.id, relationCase.rows[0]?.person_id ?? null, parsed.data.caseId, JSON.stringify({ version: 1, acted: parsed.data.acted, outcome: parsed.data.outcome, note: summary || undefined }), now]);
      await client.query("UPDATE relationship_cases SET status = CASE WHEN $1 = 'not_yet' THEN 'awaiting_reply' ELSE 'resolved' END, resolved_at = CASE WHEN $1 = 'not_yet' THEN NULL ELSE $2::timestamptz END, updated_at = $2 WHERE id = $3 AND owner_user_id = $4", [parsed.data.outcome, now, parsed.data.caseId, owner.id]);
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
    return reply.code(201).send({ feedback: { id, ...parsed.data, createdAt: now } });
  });

  app.delete("/api/v1/account/relationships/cases/:id", async (request, reply) => {
    const owner = await user(request, reply, dependencies); if (!owner) return;
    const params = idParamsSchema.safeParse(request.params); if (!params.success) return reply.code(400).send({ error: "invalid_relationship_case" });
    const result = await dependencies.database.query("UPDATE relationship_cases SET status = 'archived', updated_at = now() WHERE id = $1 AND owner_user_id = $2", [params.data.id, owner.id]);
    return result.rowCount ? reply.code(204).send() : reply.code(404).send({ error: "relationship_case_not_found" });
  });

  app.patch("/api/v1/account/relationships/cases/:id", async (request, reply) => {
    const owner = await user(request, reply, dependencies); if (!owner) return;
    const params = idParamsSchema.safeParse(request.params); const input = caseLinkSchema.safeParse(request.body);
    if (!params.success || !input.success) return reply.code(400).send({ error: "invalid_relationship_case_link" });
    const person = await dependencies.database.query("SELECT id FROM relationship_people WHERE id = $1 AND owner_user_id = $2 AND deleted_at IS NULL AND archived_at IS NULL", [input.data.personId, owner.id]);
    if (!person.rowCount) return reply.code(404).send({ error: "relationship_person_not_found" });
    const result = await dependencies.database.query("UPDATE relationship_cases SET person_id = $1, updated_at = now() WHERE id = $2 AND owner_user_id = $3 AND status <> 'archived' RETURNING id, person_id AS \"personId\", goal, status, source, strategy_key AS \"strategyKey\", initial_text_redacted AS summary, recommended_reply AS \"recommendedReply\", created_at AS \"createdAt\", updated_at AS \"updatedAt\", resolved_at AS \"resolvedAt\"", [input.data.personId, params.data.id, owner.id]);
    return result.rows[0] ? { case: result.rows[0] } : reply.code(404).send({ error: "relationship_case_not_found" });
  });

  app.delete("/api/v1/account/relationships/people/:id", async (request, reply) => {
    const owner = await user(request, reply, dependencies); if (!owner) return;
    const params = idParamsSchema.safeParse(request.params); if (!params.success) return reply.code(400).send({ error: "invalid_relationship_person" });
    const result = await dependencies.database.query("UPDATE relationship_people SET archived_at = now(), updated_at = now() WHERE id = $1 AND owner_user_id = $2 AND deleted_at IS NULL", [params.data.id, owner.id]);
    return result.rowCount ? reply.code(204).send() : reply.code(404).send({ error: "relationship_person_not_found" });
  });
}
