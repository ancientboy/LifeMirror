import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { findUserBySession, type AuthenticatedUser } from "../auth/session.js";
import type { AppDependencies } from "../app.js";
import { retrieveLiuyaoKnowledge } from "../knowledge/liuyao-retrieval.js";
import { generateMirrorReflection } from "../reflection/runtime.js";
import { openReflectionDraft, sealReflectionDraft } from "../reflection/token.js";
import type { ReflectionDraftPayload } from "../reflection/types.js";
import { calculateLiuyao } from "../tools/liuyao/engine.js";
import type { CoinToss } from "../tools/liuyao/types.js";

const coinSchema = z.union([z.literal(2), z.literal(3)]);
const tossSchema = z.tuple([coinSchema, coinSchema, coinSchema]);
const tossesSchema = z.array(tossSchema).length(6);
const calculationSchema = z.object({ tosses: tossesSchema });
const reflectionSchema = z.object({
  question: z.string().trim().min(5).max(500),
  tosses: tossesSchema,
});
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
    const hexagram = calculateLiuyao(parsed.data.tosses as CoinToss[]);
    return { hexagram, knowledge: retrieveLiuyaoKnowledge(hexagram) };
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
      const hexagram = calculateLiuyao(tosses);
      const knowledge = retrieveLiuyaoKnowledge(hexagram);
      let generated;
      try {
        generated = await generateMirrorReflection({
          llm: dependencies.llm,
          question: parsed.data.question,
          hexagram,
          knowledge,
        });
      } catch (error) {
        request.log.error({ err: error }, "reflection generation failed");
        return reply.code(502).send({ error: "reflection_generation_failed" });
      }

      const now = new Date();
      const payload: ReflectionDraftPayload = {
        version: 1,
        runtimeId: randomUUID(),
        userId: user.id,
        question: parsed.data.question,
        tosses,
        hexagram,
        knowledge,
        reflection: generated.reflection,
        provider: generated.provider,
        model: generated.model,
        generatedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 30 * 60 * 1_000).toISOString(),
      };

      return {
        question: payload.question,
        hexagram,
        knowledge,
        reflection: payload.reflection,
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

    const recalculated = calculateLiuyao(draft.tosses);
    if (
      recalculated.originalHexagram.number !== draft.hexagram.originalHexagram.number ||
      recalculated.changedHexagram.number !== draft.hexagram.changedHexagram.number
    ) {
      return reply.code(400).send({ error: "reflection_draft_mismatch" });
    }

    const eventId = randomUUID();
    const result = await dependencies.database.query<{ id: string; saved_at: Date }>(
      `INSERT INTO reflection_events (
        id, user_id, runtime_id, question, coin_tosses, hexagram_result,
        knowledge_context, reflection, llm_provider, llm_model, generated_at
      ) VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9,$10,$11)
      ON CONFLICT (runtime_id) DO UPDATE SET runtime_id = EXCLUDED.runtime_id
      RETURNING id, saved_at`,
      [eventId, user.id, draft.runtimeId, draft.question, JSON.stringify(draft.tosses), JSON.stringify(recalculated), JSON.stringify(draft.knowledge), JSON.stringify(draft.reflection), draft.provider, draft.model, draft.generatedAt],
    );
    return reply.code(201).send({
      event: { id: result.rows[0].id, savedAt: result.rows[0].saved_at.toISOString() },
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
        reflection: row.reflection,
        savedAt: row.saved_at.toISOString(),
      })),
    };
  });
}
