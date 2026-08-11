import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { findUserBySession, type AuthenticatedUser } from "../auth/session.js";
import type { AppDependencies } from "../app.js";

const eventTypes = ["rehearsal_started", "followup_seen", "action_taken", "feedback_reported"] as const;
export type EffectLoopEventType = typeof eventTypes[number];

/** This schema intentionally rejects every content field: product analytics must not receive rehearsal text. */
export const effectLoopEventSchema = z.object({
  loopId: z.string().uuid(),
  relationshipKey: z.string().uuid(),
  eventType: z.enum(eventTypes),
}).strict();

export const effectLoopDeleteSchema = z.object({
  loopId: z.string().uuid().optional(),
  relationshipKey: z.string().uuid().optional(),
}).strict().refine((value) => Boolean(value.loopId || value.relationshipKey), { message: "loopId_or_relationshipKey_required" });

type MetricRow = { event_type: EffectLoopEventType; total: number | string };

export function summarizeEffectLoopMetrics(rows: MetricRow[]) {
  const totals: Record<EffectLoopEventType, number> = {
    rehearsal_started: 0,
    followup_seen: 0,
    action_taken: 0,
    feedback_reported: 0,
  };
  for (const row of rows) totals[row.event_type] = Number(row.total) || 0;
  const started = totals.rehearsal_started;
  return {
    rehearsalsStarted: started,
    followupsSeen: totals.followup_seen,
    actionsTaken: totals.action_taken,
    feedbackReported: totals.feedback_reported,
    actionRate: started ? totals.action_taken / started : 0,
    feedbackCompletionRate: started ? totals.feedback_reported / started : 0,
  };
}

async function requireUser(request: FastifyRequest, reply: FastifyReply, dependencies: AppDependencies): Promise<AuthenticatedUser | null> {
  const user = await findUserBySession(dependencies.database, request.cookies[dependencies.config.SESSION_COOKIE_NAME]);
  if (!user) reply.code(401).send({ error: "authentication_required" });
  return user;
}

export async function registerEffectLoopRoutes(app: FastifyInstance, dependencies: AppDependencies) {
  async function readMetrics(request: FastifyRequest, reply: FastifyReply) {
    const user = await requireUser(request, reply, dependencies); if (!user) return null;
    const result = await dependencies.database.query<MetricRow>(
      `SELECT event_type, count(*)::int AS total
         FROM relationship_effect_events
        WHERE user_id = $1
        GROUP BY event_type`,
      [user.id],
    );
    return summarizeEffectLoopMetrics(result.rows);
  }

  app.post("/api/v1/account/effect-loop/events", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies); if (!user) return;
    const parsed = effectLoopEventSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_effect_loop_event" });
    const event = parsed.data;
    await dependencies.database.query(
      `INSERT INTO relationship_effect_events (id, user_id, loop_id, relationship_key, event_type)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, loop_id, event_type) DO NOTHING`,
      [randomUUID(), user.id, event.loopId, event.relationshipKey, event.eventType],
    );
    dependencies.metrics?.increment("relationship_effect_events_total", { event: event.eventType });
    return reply.code(202).send({ accepted: true, privacy: "opaque_lifecycle_only" });
  });

  app.delete("/api/v1/account/effect-loop/events", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies); if (!user) return;
    const parsed = effectLoopDeleteSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_effect_loop_delete" });
    const { loopId, relationshipKey } = parsed.data;
    const clauses = ["user_id = $1"];
    const values: unknown[] = [user.id];
    if (loopId) { values.push(loopId); clauses.push(`loop_id = $${values.length}`); }
    if (relationshipKey) { values.push(relationshipKey); clauses.push(`relationship_key = $${values.length}`); }
    const result = await dependencies.database.query<{ id: string }>(`DELETE FROM relationship_effect_events WHERE ${clauses.join(" AND ")} RETURNING id`, values);
    return { deleted: result.rows.length, privacy: "opaque_lifecycle_only" };
  });

  app.get("/api/v1/account/effect-loop/metrics", async (request, reply) => {
    const metrics = await readMetrics(request, reply); if (!metrics) return;
    return { metrics, privacy: "aggregate_only" };
  });

  // Preserves the existing dashboard contract while keeping the stored data identical.
  app.get("/api/v1/account/effect-loop/summary", async (request, reply) => {
    const summary = await readMetrics(request, reply); if (!summary) return;
    return { summary, privacy: "aggregate_only" };
  });
}
