import type { Database } from "../database/pool.js";
import { ensureUserMemoriesProcessed } from "./processor.js";

export type PersonalReflectionContext = {
  recentEvents: Array<{ title: string; summary: string; occurredAt: string }>;
  patterns: Array<{ title: string; summary: string; signalCount: number; confidence: number }>;
};

export async function retrievePersonalReflectionContext(database: Database, userId: string): Promise<PersonalReflectionContext> {
  await ensureUserMemoriesProcessed(database, userId);
  const [events, patterns] = await Promise.all([
    database.query<{ title: string; summary: string; occurred_at: Date }>(
      `SELECT title, summary, occurred_at
         FROM event_memories
        WHERE user_id = $1 AND visibility = 'visible'
        ORDER BY occurred_at DESC LIMIT 5`,
      [userId],
    ),
    database.query<{ title: string; summary: string; signal_count: number; confidence: number }>(
      `SELECT title, summary, signal_count, confidence::float8 AS confidence
         FROM pattern_memories
        WHERE user_id = $1 AND visibility = 'visible' AND signal_count >= 2
        ORDER BY last_observed_at DESC LIMIT 5`,
      [userId],
    ),
  ]);
  return {
    recentEvents: events.rows.map((event) => ({ title: event.title, summary: event.summary, occurredAt: event.occurred_at.toISOString() })),
    patterns: patterns.rows.map((pattern) => ({ title: pattern.title, summary: pattern.summary, signalCount: pattern.signal_count, confidence: pattern.confidence })),
  };
}
