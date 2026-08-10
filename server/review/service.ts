import type { Database } from "../database/pool.js";
import { buildMirrorReview } from "./engine.js";
import type { ReviewCadence, ReviewMemory, ReviewPattern } from "./types.js";

export async function generateUserReview(database: Database, userId: string, cadence: ReviewCadence, now = new Date(), timezone = "UTC") {
  const days = cadence === "weekly" ? 7 : 30;
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1_000);
  const [memoryResult, contextResult, patternResult] = await Promise.all([
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
      [userId, since],
    ),
    database.query<{
      id: string; source_kind: string; title: string; summary: string; occurred_at: Date;
      important: boolean; open_loop_status: string;
    }>(
      `SELECT id, source_kind, title, summary, occurred_at, important, open_loop_status
         FROM user_history_records
        WHERE user_id = $1 AND deleted_at IS NULL AND occurred_at >= $2
        ORDER BY occurred_at ASC`,
      [userId, since],
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
  // Review is not a 六爻-only feature: every user-authorized mirror or chat
  // record can become evidence. Symbolic output remains a record, not a fact.
  for (const row of contextResult.rows) {
    const sourceEventId = `history:${row.id}`;
    if (memories.some((item) => item.sourceEventId === sourceEventId)) continue;
    memories.push({
      sourceEventId,
      occurredAt: row.occurred_at,
      title: row.title,
      topic: row.source_kind,
      summary: row.summary,
      insight: row.important ? "用户标记为重要。" : "",
      reflectionQuestion: row.open_loop_status === "open" ? "这件事后来有什么新的现实进展？" : "",
      actionSuggestion: row.open_loop_status === "open" ? "先记录一个已经发生的变化。" : "",
      concepts: [row.source_kind],
    });
  }
  const patterns: ReviewPattern[] = patternResult.rows.map((row) => ({
    id: row.id, title: row.title, summary: row.summary, signalCount: row.signal_count,
    confidence: row.confidence, sourceEventIds: row.source_event_ids,
  }));
  return buildMirrorReview({ cadence, memories, patterns, now, timezone });
}
