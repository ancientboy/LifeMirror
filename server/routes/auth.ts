import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AppConfig } from "../config.js";
import type { Database } from "../database/pool.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { createSession, findUserBySession, revokeSession } from "../auth/session.js";

const credentialsSchema = z.object({
  email: z.string().email().max(254).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(12).max(128),
});

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
};

export async function registerAuthRoutes(
  app: FastifyInstance,
  dependencies: { config: AppConfig; database: Database },
) {
  const { config, database } = dependencies;
  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict" as const,
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
    return { user: { id: user.id, email: user.email } };
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
