import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { findUserBySession } from "../auth/session.js";
import type { AppConfig } from "../config.js";
import type { Database } from "../database/pool.js";

const snapshotSchema = z.object({
  settings: z.record(z.string(), z.unknown()).default({}),
  facts: z.array(z.unknown()).default([]),
  history: z.array(z.unknown()).default([]),
  tarot: z.array(z.unknown()).default([]),
  chats: z.array(z.unknown()).default([]),
  // Older browser snapshots stored an empty or legacy timestamp. Treat it as
  // an ordering hint rather than rejecting otherwise valid user content.
  updatedAt: z.string().nullable().optional(),
}).strict();

type Snapshot = z.infer<typeof snapshotSchema>;

function date(value: string | null | undefined) {
  const time = value ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? time : 0;
}

function collectionKey(value: unknown, index: number) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const row = value as Record<string, unknown>;
    for (const field of ["id", "uuid", "createdAt", "timestamp", "date"]) {
      if (typeof row[field] === "string" && row[field]) return `${field}:${row[field]}`;
    }
  }
  return `position:${index}:${JSON.stringify(value)}`;
}

function mergeCollection(server: unknown[], client: unknown[]) {
  const merged = new Map<string, unknown>();
  server.forEach((value, index) => merged.set(collectionKey(value, index), value));
  client.forEach((value, index) => merged.set(collectionKey(value, index), value));
  return [...merged.values()];
}

function normalize(row: { settings_json: unknown; facts_json: unknown; history_json: unknown; tarot_json: unknown; updated_at: string } | undefined): Snapshot {
  const settings = row?.settings_json && typeof row.settings_json === "object" && !Array.isArray(row.settings_json) ? row.settings_json as Record<string, unknown> : {};
  const chats = Array.isArray(settings.chatThreads) ? settings.chatThreads : [];
  return {
    settings: { ...settings, chatThreads: undefined },
    facts: Array.isArray(row?.facts_json) ? row.facts_json : [],
    history: Array.isArray(row?.history_json) ? row.history_json : [],
    tarot: Array.isArray(row?.tarot_json) ? row.tarot_json : [],
    chats,
    updatedAt: row?.updated_at ?? null,
  };
}

function toStorage(snapshot: Snapshot) {
  const settings = { ...snapshot.settings, chatThreads: snapshot.chats };
  return { settings, facts: snapshot.facts, history: snapshot.history, tarot: snapshot.tarot };
}

async function currentUser(request: FastifyRequest, reply: FastifyReply, config: AppConfig, database: Database) {
  const user = await findUserBySession(database, request.cookies[config.SESSION_COOKIE_NAME]);
  if (!user) {
    reply.code(401).send({ authenticated: false, error: "authentication_required" });
    return null;
  }
  return user;
}

async function read(database: Database, userId: string) {
  const result = await database.query<{ settings_json: unknown; facts_json: unknown; history_json: unknown; tarot_json: unknown; updated_at: string }>(
    "SELECT settings_json, facts_json, history_json, tarot_json, updated_at FROM legacy_account_data WHERE user_id = $1",
    [userId],
  );
  return normalize(result.rows[0]);
}

async function save(database: Database, userId: string, incoming: Snapshot) {
  const existing = await read(database, userId);
  const useIncomingSettings = date(incoming.updatedAt) >= date(existing.updatedAt);
  const merged: Snapshot = {
    settings: useIncomingSettings ? incoming.settings : existing.settings,
    facts: mergeCollection(existing.facts, incoming.facts),
    history: mergeCollection(existing.history, incoming.history),
    tarot: mergeCollection(existing.tarot, incoming.tarot),
    chats: mergeCollection(existing.chats, incoming.chats),
    updatedAt: new Date().toISOString(),
  };
  const stored = toStorage(merged);
  await database.query(
    `INSERT INTO legacy_account_data (user_id, settings_json, facts_json, history_json, tarot_json, updated_at)
     VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, $6)
     ON CONFLICT (user_id) DO UPDATE SET settings_json = EXCLUDED.settings_json, facts_json = EXCLUDED.facts_json,
       history_json = EXCLUDED.history_json, tarot_json = EXCLUDED.tarot_json, updated_at = EXCLUDED.updated_at`,
    [userId, JSON.stringify(stored.settings), JSON.stringify(stored.facts), JSON.stringify(stored.history), JSON.stringify(stored.tarot), merged.updatedAt],
  );
  return merged;
}

export async function mergeGuestSnapshot(database: Database, userId: string, candidate: unknown) {
  const parsed = snapshotSchema.safeParse(candidate);
  return parsed.success ? save(database, userId, parsed.data) : read(database, userId);
}

export async function registerAccountDataRoutes(app: FastifyInstance, dependencies: { config: AppConfig; database: Database }) {
  app.get("/api/v1/account/data", async (request, reply) => {
    const user = await currentUser(request, reply, dependencies.config, dependencies.database);
    return user ? { data: await read(dependencies.database, user.id) } : reply;
  });
  app.put("/api/v1/account/data", async (request, reply) => {
    const user = await currentUser(request, reply, dependencies.config, dependencies.database);
    if (!user) return reply;
    const body = request.body as { data?: unknown } | undefined;
    const parsed = snapshotSchema.safeParse(body?.data);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_account_data" });
    return { data: await save(dependencies.database, user.id, parsed.data) };
  });
}
