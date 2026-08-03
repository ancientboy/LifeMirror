import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { findUserBySession, type AuthenticatedUser } from "../auth/session.js";
import type { AppDependencies } from "../app.js";
import { ensureUserMemoriesProcessed } from "../memory/processor.js";
import { decideProactiveReflection } from "../review/engine.js";
import { generateUserReview } from "../review/service.js";

const cadenceSchema = z.enum(["weekly", "monthly"]);
const reviewQuerySchema = z.object({ cadence: cadenceSchema.optional().default("weekly"), timezone: z.string().trim().min(1).max(80).optional().default("UTC") });
const preferenceSchema = z.object({ enabled: z.boolean().optional(), weeklyEnabled: z.boolean().optional(), monthlyEnabled: z.boolean().optional(), cooldownHours: z.number().int().min(24).max(744).optional() }).strict();
const deliverySchema = z.object({ cadence: cadenceSchema, periodStart: z.string().datetime(), periodEnd: z.string().datetime(), evidenceCount: z.number().int().min(0), status: z.enum(["suggested", "opened", "dismissed"]).optional().default("suggested") });

async function requireUser(request: FastifyRequest, reply: FastifyReply, dependencies: AppDependencies): Promise<AuthenticatedUser | null> {
  const user = await findUserBySession(dependencies.database, request.cookies[dependencies.config.SESSION_COOKIE_NAME]);
  if (!user) reply.code(401).send({ error: "authentication_required" });
  return user;
}

async function preferences(dependencies: AppDependencies, userId: string) {
  const result = await dependencies.database.query<{ enabled: boolean; weekly_enabled: boolean; monthly_enabled: boolean; cooldown_hours: number }>(
    `SELECT enabled, weekly_enabled, monthly_enabled, cooldown_hours FROM proactive_reflection_preferences WHERE user_id = $1`, [userId],
  );
  const row = result.rows[0];
  return row ? { enabled: row.enabled, weeklyEnabled: row.weekly_enabled, monthlyEnabled: row.monthly_enabled, cooldownHours: row.cooldown_hours } : { enabled: true, weeklyEnabled: true, monthlyEnabled: true, cooldownHours: 168 };
}

export async function registerReviewRoutes(app: FastifyInstance, dependencies: AppDependencies) {
  app.get("/api/v1/reviews", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies); if (!user) return;
    const parsed = reviewQuerySchema.safeParse(request.query); if (!parsed.success) return reply.code(400).send({ error: "invalid_review_query" });
    await ensureUserMemoriesProcessed(dependencies.database, user.id);
    const review = await generateUserReview(dependencies.database, user.id, parsed.data.cadence, new Date(), parsed.data.timezone);
    return { review, runtime: { mode: "review", stages: ["memory", "reflection", "evaluation"], evidenceIds: review.evidence.map((item) => item.id) } };
  });

  app.get("/api/v1/proactive-reflections/next", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies); if (!user) return;
    const parsed = reviewQuerySchema.safeParse(request.query); if (!parsed.success) return reply.code(400).send({ error: "invalid_review_query" });
    await ensureUserMemoriesProcessed(dependencies.database, user.id);
    const review = await generateUserReview(dependencies.database, user.id, parsed.data.cadence, new Date(), parsed.data.timezone);
    const last = await dependencies.database.query<{ created_at: Date; period_end: Date }>(`SELECT created_at, period_end FROM proactive_reflection_deliveries WHERE user_id = $1 AND cadence = $2 ORDER BY created_at DESC LIMIT 1`, [user.id, parsed.data.cadence]);
    return { decision: decideProactiveReflection({ review, preferences: await preferences(dependencies, user.id), lastSuggestedAt: last.rows[0]?.created_at, lastSuggestedPeriodEnd: last.rows[0]?.period_end }), review: review.status === "ready" ? review : undefined };
  });

  app.get("/api/v1/proactive-reflections/preferences", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies); if (!user) return;
    return { preferences: await preferences(dependencies, user.id) };
  });

  app.patch("/api/v1/proactive-reflections/preferences", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies); if (!user) return;
    const parsed = preferenceSchema.safeParse(request.body); if (!parsed.success || Object.keys(parsed.data).length === 0) return reply.code(400).send({ error: "invalid_proactive_preferences" });
    const current = { ...(await preferences(dependencies, user.id)), ...parsed.data };
    await dependencies.database.query(`INSERT INTO proactive_reflection_preferences (user_id, enabled, weekly_enabled, monthly_enabled, cooldown_hours) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (user_id) DO UPDATE SET enabled = EXCLUDED.enabled, weekly_enabled = EXCLUDED.weekly_enabled, monthly_enabled = EXCLUDED.monthly_enabled, cooldown_hours = EXCLUDED.cooldown_hours, updated_at = now()`, [user.id, current.enabled, current.weeklyEnabled, current.monthlyEnabled, current.cooldownHours]);
    return { preferences: current };
  });

  app.post("/api/v1/proactive-reflections/deliveries", async (request, reply) => {
    const user = await requireUser(request, reply, dependencies); if (!user) return;
    const parsed = deliverySchema.safeParse(request.body); if (!parsed.success) return reply.code(400).send({ error: "invalid_proactive_delivery" });
    const result = await dependencies.database.query<{ id: string }>(`INSERT INTO proactive_reflection_deliveries (id, user_id, cadence, period_start, period_end, evidence_count, status) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (user_id, cadence, period_end) DO UPDATE SET status = EXCLUDED.status, updated_at = now() RETURNING id`, [randomUUID(), user.id, parsed.data.cadence, parsed.data.periodStart, parsed.data.periodEnd, parsed.data.evidenceCount, parsed.data.status]);
    return reply.code(201).send({ delivery: { id: result.rows[0].id, status: parsed.data.status } });
  });
}
