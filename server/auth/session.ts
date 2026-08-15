import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { Database } from "../database/pool.js";

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName?: string | null;
  provider?: string | null;
};

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(database: Database, userId: string, ttlDays: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1_000);

  await database.query(
    `INSERT INTO auth_sessions (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [randomUUID(), userId, hashSessionToken(token), expiresAt],
  );

  return { token, expiresAt };
}

export async function findUserBySession(
  database: Database,
  token: string | undefined,
): Promise<AuthenticatedUser | null> {
  if (!token) return null;

  const result = await database.query<AuthenticatedUser>(
    `UPDATE auth_sessions AS sessions
       SET last_seen_at = now()
      FROM identity_users AS users
     WHERE sessions.token_hash = $1
       AND sessions.expires_at > now()
       AND users.id = sessions.user_id
     RETURNING users.id, users.email, users.display_name AS "displayName", users.provider`,
    [hashSessionToken(token)],
  );

  return result.rows[0] ?? null;
}

export async function revokeSession(database: Database, token: string | undefined): Promise<void> {
  if (!token) return;
  await database.query("DELETE FROM auth_sessions WHERE token_hash = $1", [hashSessionToken(token)]);
}
