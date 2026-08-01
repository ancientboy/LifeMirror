import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { findUserBySession, type AuthenticatedUser } from "../auth/session.js";
import type { AppDependencies } from "../app.js";
import { ensureUserMemoriesProcessed, refreshUserPatterns } from "../memory/processor.js";

const memoryTypeSchema = z.enum(["event", "reflection", "pattern"]);
const routeParamsSchema = z.object({ type: memoryTypeSchema, id: z.string().uuid() });
const sourceParamsSchema = z.object({ id: z.string().uuid() });
const listQuerySchema = z.object({
  includeHidden: z.enum(["true", "false"]).optional().default("false"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});
const contextQuerySchema = z.object({
  q: z.string().trim().max(200).optional().default(""),
  limit: z.coerce.number().int().min(1).max(20).optional().default(8),
});
const eventUpdateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  topic: z.string().trim().min(1).max(80).optional(),
  triggerText: z.string().trim().min(1).max(500).optional(),
  summary: z.string().trim().min(1).max(1000).optional(),
  visibility: z.enum(["visible", "hidden"]).optional(),
}).strict();
const reflectionUpdateSchema = z.object({
  observation: z.string().trim().min(1).max(2000).optional(),
  insight: z.string().trim().min(1).max(2000).optional(),
  reflectionQuestion: z.string().trim().min(1).max(1000).optional(),
  actionSuggestion: z.string().trim().min(1).max(1000).optional(),
  concepts: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  visibility: z.enum(["visible", "hidden"]).optional(),
}).strict();
const patternUpdateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  summary: z.string().trim().min(1).max(1000).optional(),
  visibility: z.enum(["visible", "hidden"]).optional(),
}).strict();

async function requireUser(
  request: FastifyRequest,
  reply: FastifyReply,
  dependencies: AppDependencies,
): Promise<AuthenticatedUser | null> {
  const user = await findUserBySession(
    dependencies.database,
    request.cookies[dependencies.config.SESSION_COOKIE_NAME],
  );
  if (!user) reply.code(401).send({ error: "authentication_required" });
  return user;
}

async function listMemories(dependencies: AppDependencies, userId: string, includeHidden: boolean, limit: number | null) {
  const visibility = includeHidden ? "" : "AND visibility = 'visible'";
  const [events, reflections, patterns] = await Promise.all([
    dependencies.database.query(
      `SELECT id, source_event_id AS "sourceEventId", title, topic,
              trigger_text AS "triggerText", summary, occurred_at AS "occurredAt",
              visibility, user_corrected AS "userCorrected", updated_at AS "updatedAt"
         FROM event_memories WHERE user_id = $1 ${visibility}
        ORDER BY occurred_at DESC LIMIT $2`,
      [userId, limit],
    ),
    dependencies.database.query(
      `SELECT id, source_event_id AS "sourceEventId", observation, insight,
              reflection_question AS "reflectionQuestion", action_suggestion AS "actionSuggestion",
              concepts, visibility, user_corrected AS "userCorrected", updated_at AS "updatedAt"
         FROM reflection_memories WHERE user_id = $1 ${visibility}
        ORDER BY extracted_at DESC LIMIT $2`,
      [userId, limit],
    ),
    dependencies.database.query(
      `SELECT patterns.id, patterns.title, patterns.summary,
              patterns.signal_count AS "signalCount", patterns.confidence::float8 AS confidence,
              patterns.first_observed_at AS "firstObservedAt", patterns.last_observed_at AS "lastObservedAt",
              patterns.visibility, patterns.user_corrected AS "userCorrected",
              COALESCE(array_agg(evidence.source_event_id) FILTER (WHERE evidence.source_event_id IS NOT NULL), '{}') AS "sourceEventIds"
         FROM pattern_memories AS patterns
         LEFT JOIN pattern_memory_evidence AS evidence ON evidence.pattern_id = patterns.id
        WHERE patterns.user_id = $1 ${visibility.replaceAll("visibility", "patterns.visibility")}
        GROUP BY patterns.id
        ORDER BY patterns.last_observed_at DESC LIMIT $2`,
      [userId, limit],
    ),
  ]);
  return { events: events.rows, reflections: reflections.rows, patterns: patterns.rows };
}

export async function registerMemoryRoutes(app: FastifyInstance, dependencies: AppDependencies) {
  app.get("/api/v1/memories", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies);
    if (!user) return;
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_memory_query" });
    await ensureUserMemoriesProcessed(dependencies.database, user.id);
    return listMemories(dependencies, user.id, parsed.data.includeHidden === "true", parsed.data.limit);
  });

  app.get("/api/v1/memories/context", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies);
    if (!user) return;
    const parsed = contextQuerySchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_memory_query" });
    await ensureUserMemoriesProcessed(dependencies.database, user.id);
    const search = `%${parsed.data.q}%`;
    const result = await dependencies.database.query(
      `SELECT events.id, events.source_event_id AS "sourceEventId", events.title,
              events.topic, events.summary, events.occurred_at AS "occurredAt",
              reflections.insight, reflections.reflection_question AS "reflectionQuestion",
              reflections.action_suggestion AS "actionSuggestion", reflections.concepts
         FROM event_memories AS events
         JOIN reflection_memories AS reflections ON reflections.source_event_id = events.source_event_id
        WHERE events.user_id = $1
          AND events.visibility = 'visible'
          AND reflections.visibility = 'visible'
          AND ($2 = '%%' OR events.title ILIKE $2 OR events.topic ILIKE $2 OR
               events.summary ILIKE $2 OR reflections.insight ILIKE $2 OR
               array_to_string(reflections.concepts, ' ') ILIKE $2)
        ORDER BY events.occurred_at DESC
        LIMIT $3`,
      [user.id, search, parsed.data.limit],
    );
    const patterns = await dependencies.database.query(
      `SELECT id, title, summary, signal_count AS "signalCount", confidence::float8 AS confidence
         FROM pattern_memories
        WHERE user_id = $1 AND visibility = 'visible'
          AND ($2 = '%%' OR title ILIKE $2 OR summary ILIKE $2)
        ORDER BY last_observed_at DESC LIMIT $3`,
      [user.id, search, parsed.data.limit],
    );
    return { memories: result.rows, patterns: patterns.rows, usage: "personal_reflection_context_only", trainingData: false };
  });

  app.get("/api/v1/memories/summary", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies);
    if (!user) return;
    await ensureUserMemoriesProcessed(dependencies.database, user.id);
    const memories = await listMemories(dependencies, user.id, false, 5);
    const counts = await dependencies.database.query<{
      events: number;
      reflections: number;
      patterns: number;
    }>(
      `SELECT
         (SELECT count(*)::int FROM event_memories WHERE user_id = $1 AND visibility = 'visible') AS events,
         (SELECT count(*)::int FROM reflection_memories WHERE user_id = $1 AND visibility = 'visible') AS reflections,
         (SELECT count(*)::int FROM pattern_memories WHERE user_id = $1 AND visibility = 'visible') AS patterns`,
      [user.id],
    );
    return {
      counts: counts.rows[0],
      currentReflection: memories.reflections[0] ?? null,
      recentPatterns: memories.patterns,
      timeline: memories.events,
      mirrorDna: null,
    };
  });

  app.get("/api/v1/memories/export", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies);
    if (!user) return;
    await ensureUserMemoriesProcessed(dependencies.database, user.id);
    const memories = await listMemories(dependencies, user.id, true, null);
    reply.header("content-disposition", `attachment; filename=life-mirror-memory-${new Date().toISOString().slice(0, 10)}.json`);
    return {
      format: "life-mirror-memory-export",
      version: 1,
      generatedAt: new Date().toISOString(),
      ownership: "user",
      trainingData: false,
      ...memories,
    };
  });

  app.patch("/api/v1/memories/:type/:id", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies);
    if (!user) return;
    const params = routeParamsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: "invalid_memory_target" });
    const schemas = { event: eventUpdateSchema, reflection: reflectionUpdateSchema, pattern: patternUpdateSchema };
    const parsed = schemas[params.data.type].safeParse(request.body);
    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return reply.code(400).send({ error: "invalid_memory_update" });
    }

    const definitions = {
      event: { table: "event_memories", columns: { title: "title", topic: "topic", triggerText: "trigger_text", summary: "summary", visibility: "visibility" } },
      reflection: { table: "reflection_memories", columns: { observation: "observation", insight: "insight", reflectionQuestion: "reflection_question", actionSuggestion: "action_suggestion", concepts: "concepts", visibility: "visibility" } },
      pattern: { table: "pattern_memories", columns: { title: "title", summary: "summary", visibility: "visibility" } },
    } as const;
    const definition = definitions[params.data.type];
    const entries = Object.entries(parsed.data) as Array<[keyof typeof definition.columns, unknown]>;
    const sets = entries.map(([key], index) => `${definition.columns[key]} = $${index + 3}`);
    const result = await dependencies.database.query(
      `UPDATE ${definition.table}
          SET ${sets.join(", ")}, user_corrected = true, updated_at = now()
        WHERE id = $1 AND user_id = $2
        RETURNING id, visibility, user_corrected AS "userCorrected", updated_at AS "updatedAt"`,
      [params.data.id, user.id, ...entries.map(([, value]) => value)],
    );
    if (!result.rows[0]) return reply.code(404).send({ error: "memory_not_found" });
    if (params.data.type !== "pattern") await refreshUserPatterns(dependencies.database, user.id);
    return { memory: result.rows[0] };
  });

  app.delete("/api/v1/memories/:type/:id", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies);
    if (!user) return;
    const params = routeParamsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: "invalid_memory_target" });
    const table = { event: "event_memories", reflection: "reflection_memories", pattern: "pattern_memories" }[params.data.type];
    if (params.data.type === "pattern") {
      const pattern = await dependencies.database.query<{ pattern_key: string }>(
        "SELECT pattern_key FROM pattern_memories WHERE id = $1 AND user_id = $2",
        [params.data.id, user.id],
      );
      if (!pattern.rows[0]) return reply.code(404).send({ error: "memory_not_found" });
      await dependencies.database.query(
        `INSERT INTO memory_pattern_suppressions (user_id, pattern_key)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [user.id, pattern.rows[0].pattern_key],
      );
    }
    const result = await dependencies.database.query(
      `DELETE FROM ${table} WHERE id = $1 AND user_id = $2 RETURNING id`,
      [params.data.id, user.id],
    );
    if (!result.rows[0]) return reply.code(404).send({ error: "memory_not_found" });
    if (params.data.type !== "pattern") await refreshUserPatterns(dependencies.database, user.id);
    return reply.code(204).send();
  });

  app.delete("/api/v1/memories/source-events/:id", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies);
    if (!user) return;
    const params = sourceParamsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: "invalid_memory_target" });
    const result = await dependencies.database.query(
      "DELETE FROM reflection_events WHERE id = $1 AND user_id = $2 RETURNING id",
      [params.data.id, user.id],
    );
    if (!result.rows[0]) return reply.code(404).send({ error: "memory_not_found" });
    await refreshUserPatterns(dependencies.database, user.id);
    return reply.code(204).send();
  });
}
