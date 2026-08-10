import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import type { AppDependencies } from "../app.js";
import { findUserBySession } from "../auth/session.js";
import { calculateBazi } from "../tools/bazi/engine.js";
import { calculateAstrology } from "../tools/astrology/core.js";

const paramsSchema = z.object({ personId: z.string().uuid() });
const birthSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  place: z.string().trim().max(120).optional(),
  utcOffsetMinutes: z.number().int().min(-840).max(840),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isMinor: z.boolean().optional().default(false),
}).strict();

function parsedDate(input: string) {
  const [year, month, day] = input.split("-").map(Number);
  const valid = new Date(Date.UTC(year, month - 1, day));
  if (valid.getUTCFullYear() !== year || valid.getUTCMonth() !== month - 1 || valid.getUTCDate() !== day) throw new Error("invalid_birth_date");
  return { year, month, day };
}

/** Deterministic key prevents repeated page visits from creating timeline records. */
function profileKey(input: z.infer<typeof birthSchema>) {
  return `${input.date}|${input.time ?? "unknown"}|${input.utcOffsetMinutes}|${input.latitude.toFixed(4)}|${input.longitude.toFixed(4)}`;
}

export async function registerPersonMirrorRoutes(app: FastifyInstance, dependencies: AppDependencies) {
  app.post("/api/v1/people/:personId/stable-reference", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await findUserBySession(dependencies.database, request.cookies[dependencies.config.SESSION_COOKIE_NAME]);
    if (!user) return reply.code(401).send({ error: "authentication_required" });
    const params = paramsSchema.safeParse(request.params); const parsed = birthSchema.safeParse(request.body);
    if (!params.success || !parsed.success) return reply.code(400).send({ error: "invalid_person_birth_profile" });
    const person = await dependencies.database.query<{ id: string }>("SELECT id FROM relationship_people WHERE id = $1 AND owner_user_id = $2 AND deleted_at IS NULL", [params.data.personId, user.id]);
    if (!person.rows[0]) return reply.code(404).send({ error: "person_not_found" });
    let date: { year: number; month: number; day: number };
    try { date = parsedDate(parsed.data.date); } catch { return reply.code(400).send({ error: "invalid_person_birth_profile" }); }
    const [hour, minute] = parsed.data.time ? parsed.data.time.split(":").map(Number) : [null, 0];
    const key = profileKey(parsed.data);
    const bazi = calculateBazi({ ...date, hour, minute, utcOffsetMinutes: parsed.data.utcOffsetMinutes, longitude: parsed.data.longitude, dayBoundary: "midnight", useTrueSolarTime: false, luckGender: null });
    const astrology = calculateAstrology({ ...date, hour, minute, utcOffsetMinutes: parsed.data.utcOffsetMinutes, latitude: parsed.data.latitude, longitude: parsed.data.longitude });
    const birthProfile = { ...parsed.data, profileKey: key, timeKnown: hour !== null };
    await dependencies.database.query("UPDATE relationship_people SET birth_profile = $1::jsonb, is_minor = $2, updated_at = now() WHERE id = $3 AND owner_user_id = $4", [JSON.stringify(birthProfile), parsed.data.isMinor, params.data.personId, user.id]);
    const records = [
      { kind: "bazi", title: "TA 的八字底图", summary: `仅作待现实验证的象征参考：${bazi.pillars.filter(Boolean).map((pillar) => pillar?.ganZhi).join(" · ")}`, payload: { profileKey: key, timeKnown: hour !== null, result: bazi } },
      { kind: "astrology", title: "TA 的星盘底图", summary: `仅作待现实验证的象征参考：${astrology.headline}`, payload: { profileKey: key, timeKnown: hour !== null, result: astrology } },
    ];
    for (const record of records) await dependencies.database.query(
      `INSERT INTO user_history_records (id, user_id, source_kind, source_record_key, title, summary, payload, occurred_at, stable_reference, person_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,now(),true,$8)
       ON CONFLICT (user_id, source_kind, source_record_key) DO UPDATE SET title = EXCLUDED.title, summary = EXCLUDED.summary, payload = EXCLUDED.payload, person_id = EXCLUDED.person_id, deleted_at = NULL, updated_at = now()`,
      [randomUUID(), user.id, record.kind, `person:${params.data.personId}:${record.kind}:${key}`, record.title, record.summary, JSON.stringify(record.payload), params.data.personId],
    );
    return { profileKey: key, bazi: { pillars: bazi.pillars.filter(Boolean).length, timeKnown: hour !== null }, astrology: { timeKnown: astrology.timeKnown, hasAngles: astrology.angles.length > 0 } };
  });
}
