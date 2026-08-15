import { createHash, randomInt, randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AppConfig } from "../config.js";
import type { Database } from "../database/pool.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { createSession, findUserBySession, revokeSession } from "../auth/session.js";
import { mergeGuestSnapshot } from "./account-data.js";

const credentialsSchema = z.object({
  email: z.string().email().max(254).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(12).max(128),
});

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  display_name?: string | null;
  provider?: string | null;
};

const emailCodeSchema = z.object({
  email: z.string().email().max(254).transform((value) => value.trim().toLowerCase()),
});
const verifyCodeSchema = emailCodeSchema.extend({
  code: z.string().regex(/^\d{6}$/),
  guestData: z.unknown().optional(),
});

function codeHash(id: string, email: string, code: string) {
  return createHash("sha256").update(`${id}|${email}|${code}`).digest("hex");
}

export async function registerAuthRoutes(
  app: FastifyInstance,
  dependencies: { config: AppConfig; database: Database },
) {
  const { config, database } = dependencies;
  const cookieOptions = {
    httpOnly: true,
    sameSite: config.SESSION_COOKIE_SAME_SITE,
    secure: config.NODE_ENV === "production",
    path: "/",
  };

  app.post("/api/v1/auth/register", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request, reply) => {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_credentials" });

    const userId = randomUUID();
    try {
      await database.query(
        `INSERT INTO identity_users (id, email, password_hash)
         VALUES ($1, $2, $3)`,
        [userId, parsed.data.email, await hashPassword(parsed.data.password)],
      );
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === "23505") {
        return reply.code(409).send({ error: "account_exists" });
      }
      throw error;
    }

    const session = await createSession(database, userId, config.SESSION_TTL_DAYS);
    reply.setCookie(config.SESSION_COOKIE_NAME, session.token, {
      ...cookieOptions,
      expires: session.expiresAt,
    });
    return reply.code(201).send({ user: { id: userId, email: parsed.data.email } });
  });

  app.post("/api/v1/auth/login", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request, reply) => {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_credentials" });

    const result = await database.query<UserRow>(
      "SELECT id, email, password_hash FROM identity_users WHERE email = $1",
      [parsed.data.email],
    );
    const user = result.rows[0];
    if (!user || !(await verifyPassword(parsed.data.password, user.password_hash))) {
      return reply.code(401).send({ error: "authentication_failed" });
    }

    const session = await createSession(database, user.id, config.SESSION_TTL_DAYS);
    reply.setCookie(config.SESSION_COOKIE_NAME, session.token, {
      ...cookieOptions,
      expires: session.expiresAt,
    });
    return { user: { id: user.id, email: user.email, displayName: user.display_name ?? null, provider: user.provider ?? "password" } };
  });

  app.post("/api/v1/auth/request-code", { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } }, async (request, reply) => {
    if (!config.RESEND_API_KEY || !config.EMAIL_FROM) return reply.code(503).send({ error: "email_service_not_configured" });
    const parsed = emailCodeSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_email" });
    const email = parsed.data.email;
    const recent = await database.query<{ created_at: Date }>("SELECT created_at FROM email_codes WHERE email = $1 ORDER BY created_at DESC LIMIT 1", [email]);
    if (recent.rows[0] && Date.now() - new Date(recent.rows[0].created_at).getTime() < 60_000) return reply.code(429).send({ error: "code_cooldown" });
    const id = randomUUID();
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const expiresAt = new Date(Date.now() + 10 * 60_000);
    await database.query("INSERT INTO email_codes (id, email, code_hash, expires_at) VALUES ($1, $2, $3, $4)", [id, email, codeHash(id, email, code), expiresAt]);
    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${config.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: config.EMAIL_FROM, to: [email], subject: "你的 LifeMirror 登录验证码", text: `你的验证码是 ${code}。10 分钟内有效，请勿转发。` }),
    });
    if (!sent.ok) {
      await database.query("DELETE FROM email_codes WHERE id = $1", [id]);
      return reply.code(502).send({ error: "email_delivery_failed" });
    }
    return { ok: true, expiresIn: 600 };
  });

  app.post("/api/v1/auth/verify-code", { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } }, async (request, reply) => {
    const parsed = verifyCodeSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_code" });
    const { email, code, guestData } = parsed.data;
    const result = await database.query<{ id: string; code_hash: string; expires_at: Date; attempts: number }>(
      "SELECT id, code_hash, expires_at, attempts FROM email_codes WHERE email = $1 AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1",
      [email],
    );
    const record = result.rows[0];
    if (!record || new Date(record.expires_at).getTime() <= Date.now()) return reply.code(401).send({ error: "code_expired" });
    if (record.attempts >= 5) return reply.code(429).send({ error: "code_attempts_exceeded" });
    if (codeHash(record.id, email, code) !== record.code_hash) {
      await database.query("UPDATE email_codes SET attempts = attempts + 1 WHERE id = $1", [record.id]);
      return reply.code(401).send({ error: "invalid_code" });
    }
    await database.query("UPDATE email_codes SET consumed_at = now() WHERE id = $1", [record.id]);
    const existing = await database.query<UserRow>("SELECT id, email, password_hash, display_name, provider FROM identity_users WHERE email = $1", [email]);
    let user = existing.rows[0];
    if (!user) {
      const id = randomUUID();
      await database.query("INSERT INTO identity_users (id, email, password_hash, provider) VALUES ($1, $2, $3, 'email')", [id, email, "!passwordless-email!"]);
      user = { id, email, password_hash: "!passwordless-email!", provider: "email" };
    }
    const data = await mergeGuestSnapshot(database, user.id, guestData);
    const session = await createSession(database, user.id, config.SESSION_TTL_DAYS);
    reply.setCookie(config.SESSION_COOKIE_NAME, session.token, { ...cookieOptions, expires: session.expiresAt });
    return { authenticated: true, created: !existing.rows[0], user: { id: user.id, email: user.email, displayName: user.display_name ?? null, provider: user.provider ?? "email" }, data };
  });

  app.post("/api/v1/auth/logout", async (request, reply) => {
    await revokeSession(database, request.cookies[config.SESSION_COOKIE_NAME]);
    reply.clearCookie(config.SESSION_COOKIE_NAME, cookieOptions);
    return reply.code(204).send();
  });

  app.get("/api/v1/auth/session", async (request, reply) => {
    const user = await findUserBySession(database, request.cookies[config.SESSION_COOKIE_NAME]);
    if (!user) return reply.code(401).send({ authenticated: false });
    return { authenticated: true, user };
  });
}
