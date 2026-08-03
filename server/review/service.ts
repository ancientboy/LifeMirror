import type { Database } from "../database/pool.js";
import { buildMirrorReview } from "./engine.js";
import type { ReviewCadence, ReviewMemory, ReviewPattern } from "./types.js";

export async function generateUserReview(database: Database, userId: string, cadence: ReviewCadence, now = new Date(), timezone = "UTC") {
  const days = cadence === "weekly" ? 7 : 30;
  const [memoryResult, patternResult] = await Promise.all([
    database.query<{
      source_event_id: string; occurred_at: Date; title: string; topic: string; summary: string;
      insight: string; reflection_question: string; action_suggestion: string; concepts: string[];
    }>(
      `SELECT events.source_event_id, events.occurred_at, events.title, events.topic, events.summary,
              reflections.insight, reflections.reflection_question, reflections.action_suggestion, reflections.concepts
         FROM event_memories AS events
         JOIN reflection_memories AS reflections ON reflections.source_event_id = events.source_event_id
        WHERE events.user_id = $1 AND events.visibility = 'visible' AND reflections.visibility = 'visible'
          AND events.occurred_at >= $2
        ORDER BY events.occurred_at ASC`,
      [userId, new Date(now.getTime() - days * 24 * 60 * 60 * 1_000)],
    ),
    database.query<{
      id: string; title: string; summary: string; signal_count: number; confidence: number; source_event_ids: string[];
    }>(
      `SELECT patterns.id, patterns.title, patterns.summary, patterns.signal_count,
              patterns.confidence::float8 AS confidence,
              COALESCE(array_agg(evidence.source_event_id) FILTER (WHERE evidence.source_event_id IS NOT NULL), '{}') AS source_event_ids
         FROM pattern_memories AS patterns
         LEFT JOIN pattern_memory_evidence AS evidence ON evidence.pattern_id = patterns.id
        WHERE patterns.user_id = $1 AND patterns.visibility = 'visible'
        GROUP BY patterns.id`,
      [userId],
    ),
  ]);
  const memories: ReviewMemory[] = memoryResult.rows.map((row) => ({
    sourceEventId: row.source_event_id, occurredAt: row.occurred_at, title: row.title, topic: row.topic,
    summary: row.summary, insight: row.insight, reflectionQuestion: row.reflection_question,
    actionSuggestion: row.action_suggestion, concepts: row.concepts,
  }));
  const patterns: ReviewPattern[] = patternResult.rows.map((row) => ({
    id: row.id, title: row.title, summary: row.summary, signalCount: row.signal_count,
    confidence: row.confidence, sourceEventIds: row.source_event_ids,
  }));
  return buildMirrorReview({ cadence, memories, patterns, now, timezone });
}
