import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { findUserBySession, type AuthenticatedUser } from "../auth/session.js";
import type { AppDependencies } from "../app.js";
import { retrieveLiuyaoKnowledge } from "../knowledge/liuyao-retrieval.js";
import { retrieveLiuyaoReflectionKnowledge } from "../knowledge/liuyao-reflection-map.js";
import { generateMirrorReflection } from "../reflection/runtime.js";
import { openReflectionDraft, sealReflectionDraft } from "../reflection/token.js";
import { normalizeMirrorReflection, type ReflectionDraftPayload } from "../reflection/types.js";
import { calculateLiuyao } from "../tools/liuyao/engine.js";
import { resolveLiuyaoContext } from "../tools/liuyao/context-resolver.js";
import type { CoinToss, LiuyaoAnalysisContext } from "../tools/liuyao/types.js";
import { processReflectionEvent } from "../memory/processor.js";
import { retrievePersonalReflectionContext } from "../memory/reflection-context.js";

const coinSchema = z.union([z.literal(2), z.literal(3)]);
const tossSchema = z.tuple([coinSchema, coinSchema, coinSchema]);
const tossesSchema = z.array(tossSchema).length(6);
const topicSchema = z.enum(["self", "career", "wealth", "study", "relationship_male", "relationship_female", "health", "family", "children", "travel", "legal", "partnership"]);
const usefulGodSchema = z.enum(["parents", "siblings", "offspring", "wealth", "officials", "shi", "ying"]);
const scenarioSchema = z.enum(["job_search", "exam", "reconciliation", "investment"]);
const scenarioFocusSchema = z.enum([
  "job_interview", "job_offer", "job_start",
  "exam_performance", "exam_score", "exam_admission",
  "relationship_contact", "relationship_reconcile", "relationship_stability",
  "investment_short_term", "investment_long_term",
]);
const analysisContextSchema = z.object({
  topic: topicSchema,
  monthBranch: z.enum(["zi", "chou", "yin", "mao", "chen", "si", "wu", "wei", "shen", "you", "xu", "hai"]),
  dayStem: z.enum(["jia", "yi", "bing", "ding", "wu", "ji", "geng", "xin", "ren", "gui"]),
  dayBranch: z.enum(["zi", "chou", "yin", "mao", "chen", "si", "wu", "wei", "shen", "you", "xu", "hai"]),
  intents: z.array(z.object({ id: z.string().min(1).max(80), label: z.string().min(1).max(80), topic: topicSchema, priority: z.number().int().min(1).max(10), usefulGod: usefulGodSchema.optional(), scenario: scenarioSchema.optional(), scenarioFocus: scenarioFocusSchema.optional() })).max(3).optional(),
  tone: z.enum(["playful", "warm", "grounded", "careful"]).optional(),
  timingScale: z.enum(["day", "month"]).optional(),
  scenario: scenarioSchema.optional(),
  scenarioFocus: scenarioFocusSchema.optional(),
  calendarBoundary: z.boolean().optional(),
  usefulGod: usefulGodSchema.optional(),
  occurredAt: z.string().datetime().optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
});
const automaticContextSchema = z.object({
  question: z.string().trim().min(1).max(500).optional(),
  occurredAt: z.string().datetime().optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
});
const calculationSchema = z.object({ tosses: tossesSchema, analysisContext: analysisContextSchema.optional() }).merge(automaticContextSchema);
const reflectionSchema = z.object({
  question: z.string().trim().min(5).max(500),
  tosses: tossesSchema,
  analysisContext: analysisContextSchema.optional(),
}).merge(automaticContextSchema.omit({ question: true }));
const saveSchema = z.object({ draftToken: z.string().min(20).max(32_000) });

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

export async function registerDailyMirrorRoutes(app: FastifyInstance, dependencies: AppDependencies) {
  app.post("/api/v1/tools/liuyao/calculate", async (request, reply) => {
    const parsed = calculationSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_coin_tosses" });
    let analysisContext = parsed.data.analysisContext as LiuyaoAnalysisContext | undefined;
    try {
      analysisContext ??= parsed.data.question ? resolveLiuyaoContext({ question: parsed.data.question, occurredAt: parsed.data.occurredAt, timezone: parsed.data.timezone }) : undefined;
    } catch {
      return reply.code(400).send({ error: "invalid_divination_context" });
    }
    const hexagram = calculateLiuyao(parsed.data.tosses as CoinToss[], analysisContext);
    const knowledge = retrieveLiuyaoKnowledge(hexagram);
    return { hexagram, analysisContext, knowledge, reflectionKnowledge: retrieveLiuyaoReflectionKnowledge(hexagram, knowledge) };
  });

  app.post(
    "/api/v1/daily-mirror/reflections",
    { config: { rateLimit: { max: 12, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const user = await requireUser(request, reply, dependencies);
      if (!user) return;
      const parsed = reflectionSchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: "invalid_reflection_input" });
      if (dependencies.llm.name === "disabled") {
        return reply.code(503).send({ error: "reflection_runtime_unavailable" });
      }

      const tosses = parsed.data.tosses as CoinToss[];
      let analysisContext = parsed.data.analysisContext as LiuyaoAnalysisContext | undefined;
      try {
        analysisContext ??= resolveLiuyaoContext(parsed.data);
      } catch {
        return reply.code(400).send({ error: "invalid_divination_context" });
      }
      const hexagram = calculateLiuyao(tosses, analysisContext);
      const knowledge = retrieveLiuyaoKnowledge(hexagram);
      const reflectionKnowledge = retrieveLiuyaoReflectionKnowledge(hexagram, knowledge);
      const userContext = await retrievePersonalReflectionContext(dependencies.database, user.id);
      let generated;
      try {
        generated = await generateMirrorReflection({
          llm: dependencies.llm,
          question: parsed.data.question,
          hexagram,
          knowledge,
          reflectionKnowledge,
          userContext,
        });
      } catch (error) {
        request.log.error({ err: error }, "reflection generation failed");
        return reply.code(502).send({ error: "reflection_generation_failed" });
      }

      const now = new Date();
      const payload: ReflectionDraftPayload = {
        version: 6,
        runtimeId: randomUUID(),
        userId: user.id,
        question: parsed.data.question,
        tosses,
        analysisContext,
        hexagram,
        knowledge,
        reflectionKnowledge,
        explanationTrace: generated.explanationTrace,
        reflection: generated.reflection,
        provider: generated.provider,
        model: generated.model,
        generatedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 30 * 60 * 1_000).toISOString(),
      };

      return {
        question: payload.question,
        hexagram,
        analysisContext,
        knowledge,
        reflectionKnowledge,
        reflection: normalizeMirrorReflection(payload.reflection),
        explanationTrace: generated.explanationTrace,
        draftToken: sealReflectionDraft(payload, dependencies.config.REFLECTION_TOKEN_SECRET),
        expiresAt: payload.expiresAt,
      };
    },
  );

  app.post("/api/v1/daily-mirror/reflections/save", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies);
    if (!user) return;
    const parsed = saveSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_reflection_draft" });

    let draft: ReflectionDraftPayload;
    try {
      draft = openReflectionDraft(parsed.data.draftToken, dependencies.config.REFLECTION_TOKEN_SECRET);
    } catch {
      return reply.code(400).send({ error: "invalid_or_expired_reflection_draft" });
    }
    if (draft.userId !== user.id) return reply.code(403).send({ error: "reflection_owner_mismatch" });

    const recalculated = calculateLiuyao(draft.tosses, draft.analysisContext);
    const extendedMismatch = draft.version >= 6 && (
      JSON.stringify(recalculated.structure) !== JSON.stringify(draft.hexagram.structure) ||
      JSON.stringify(recalculated.analysis) !== JSON.stringify(draft.hexagram.analysis)
    );
    const reflectionKnowledgeMismatch = draft.version >= 6 && JSON.stringify(
      retrieveLiuyaoReflectionKnowledge(recalculated, retrieveLiuyaoKnowledge(recalculated)),
    ) !== JSON.stringify(draft.reflectionKnowledge);
    if (
      recalculated.originalHexagram.number !== draft.hexagram.originalHexagram.number ||
      recalculated.changedHexagram.number !== draft.hexagram.changedHexagram.number ||
      extendedMismatch ||
      reflectionKnowledgeMismatch
    ) {
      return reply.code(400).send({ error: "reflection_draft_mismatch" });
    }

    const eventId = randomUUID();
    const result = await dependencies.database.query<{ id: string; saved_at: Date }>(
      `INSERT INTO reflection_events (
        id, user_id, runtime_id, question, coin_tosses, hexagram_result,
        knowledge_context, reflection, explanation_trace, llm_provider, llm_model, generated_at
      ) VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11,$12)
      ON CONFLICT (runtime_id) DO UPDATE SET runtime_id = EXCLUDED.runtime_id
      RETURNING id, saved_at`,
      [eventId, user.id, draft.runtimeId, draft.question, JSON.stringify(draft.tosses), JSON.stringify(recalculated), JSON.stringify(draft.knowledge), JSON.stringify(draft.reflection), JSON.stringify(draft.explanationTrace ?? null), draft.provider, draft.model, draft.generatedAt],
    );
    let memoryProcessing: "completed" | "retry_pending" = "completed";
    try {
      await processReflectionEvent(dependencies.database, result.rows[0].id);
    } catch (error) {
      memoryProcessing = "retry_pending";
      request.log.error({ err: error }, "memory processing failed; scheduled for retrieval retry");
    }
    return reply.code(201).send({
      event: { id: result.rows[0].id, savedAt: result.rows[0].saved_at.toISOString(), memoryProcessing },
    });
  });

  app.get("/api/v1/daily-mirror/reflections", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies);
    if (!user) return;
    const result = await dependencies.database.query<{
      id: string;
      question: string;
      hexagram_result: ReflectionDraftPayload["hexagram"];
      reflection: ReflectionDraftPayload["reflection"];
      saved_at: Date;
    }>(
      `SELECT id, question, hexagram_result, reflection, saved_at
         FROM reflection_events
        WHERE user_id = $1
        ORDER BY saved_at DESC
        LIMIT 20`,
      [user.id],
    );
    return {
      events: result.rows.map((row) => ({
        id: row.id,
        question: row.question,
        hexagram: row.hexagram_result,
        reflection: normalizeMirrorReflection(row.reflection),
        savedAt: row.saved_at.toISOString(),
      })),
    };
  });

  app.get("/api/v1/daily-mirror/reflections/:id/explanation-trace", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies);
    if (!user) return;
    const parsed = z.object({ id: z.string().uuid() }).safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_reflection_id" });
    const result = await dependencies.database.query<{ explanation_trace: ReflectionDraftPayload["explanationTrace"] }>(
      `SELECT explanation_trace FROM reflection_events WHERE id = $1 AND user_id = $2`,
      [parsed.data.id, user.id],
    );
    if (!result.rows[0]) return reply.code(404).send({ error: "reflection_not_found" });
    if (!result.rows[0].explanation_trace) return reply.code(404).send({ error: "explanation_trace_unavailable" });
    return { explanationTrace: result.rows[0].explanation_trace };
  });
}
