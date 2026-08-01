import { randomUUID } from "node:crypto";
import type { Database } from "../database/pool.js";
import { extractMemory } from "./extractor.js";
import { MEMORY_PROCESSING_VERSION, type MemorySourceEvent } from "./types.js";

type PatternSignal = {
  key: string;
  title: string;
  sourceIds: Set<string>;
  dates: Date[];
};

const topicTitles: Record<string, string> = {
  career: "持续关注职业与方向",
  relationship: "持续关注关系与连接",
  decision: "持续探索选择与决定",
  growth: "持续关注成长与改变",
  emotion: "持续照见感受与内在",
  general: "重复出现的当下探索",
};

async function rebuildPatterns(database: Database, userId: string): Promise<void> {
  const result = await database.query<{
    source_event_id: string;
    topic: string;
    concepts: string[];
    occurred_at: Date;
  }>(
    `SELECT events.source_event_id, events.topic, reflections.concepts, events.occurred_at
       FROM event_memories AS events
       JOIN reflection_memories AS reflections
         ON reflections.source_event_id = events.source_event_id
      WHERE events.user_id = $1
        AND events.visibility = 'visible'
        AND reflections.visibility = 'visible'`,
    [userId],
  );

  const signals = new Map<string, PatternSignal>();
  const addSignal = (key: string, title: string, sourceId: string, date: Date) => {
    const signal = signals.get(key) ?? { key, title, sourceIds: new Set<string>(), dates: [] };
    if (!signal.sourceIds.has(sourceId)) signal.dates.push(date);
    signal.sourceIds.add(sourceId);
    signals.set(key, signal);
  };

  for (const row of result.rows) {
    addSignal(`topic:${row.topic}`, topicTitles[row.topic] ?? `持续探索${row.topic}`, row.source_event_id, row.occurred_at);
    for (const concept of row.concepts.filter((item) => item !== row.topic)) {
      addSignal(`concept:${concept}`, `反复出现的主题：${concept}`, row.source_event_id, row.occurred_at);
    }
  }

  const suppressedResult = await database.query<{ pattern_key: string }>(
    "SELECT pattern_key FROM memory_pattern_suppressions WHERE user_id = $1",
    [userId],
  );
  const suppressed = new Set(suppressedResult.rows.map((row) => row.pattern_key));
  const active = [...signals.values()].filter((signal) => signal.sourceIds.size >= 2 && !suppressed.has(signal.key));
  const activeKeys = active.map((signal) => signal.key);
  await database.query(
    `DELETE FROM pattern_memories
      WHERE user_id = $1
        AND user_corrected = false
        AND NOT (pattern_key = ANY($2::text[]))`,
    [userId, activeKeys],
  );

  for (const signal of active) {
    const sortedDates = [...signal.dates].sort((left, right) => left.getTime() - right.getTime());
    const confidence = Math.min(0.85, 0.35 + signal.sourceIds.size * 0.12);
    const pattern = await database.query<{ id: string }>(
      `INSERT INTO pattern_memories (
         id, user_id, pattern_key, title, summary, signal_count, confidence,
         first_observed_at, last_observed_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (user_id, pattern_key) DO UPDATE SET
         title = CASE WHEN pattern_memories.user_corrected THEN pattern_memories.title ELSE EXCLUDED.title END,
         summary = CASE WHEN pattern_memories.user_corrected THEN pattern_memories.summary ELSE EXCLUDED.summary END,
         signal_count = EXCLUDED.signal_count,
         confidence = EXCLUDED.confidence,
         first_observed_at = EXCLUDED.first_observed_at,
         last_observed_at = EXCLUDED.last_observed_at,
         updated_at = now()
       RETURNING id`,
      [
        randomUUID(), userId, signal.key, signal.title,
        `这是基于 ${signal.sourceIds.size} 次独立镜像形成的早期观察，不是固定的人格标签。`,
        signal.sourceIds.size, confidence, sortedDates[0], sortedDates.at(-1),
      ],
    );
    await database.query("DELETE FROM pattern_memory_evidence WHERE pattern_id = $1", [pattern.rows[0].id]);
    for (const sourceId of signal.sourceIds) {
      await database.query(
        `INSERT INTO pattern_memory_evidence (pattern_id, source_event_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [pattern.rows[0].id, sourceId],
      );
    }
  }
}

export async function processReflectionEvent(database: Database, sourceEventId: string): Promise<void> {
  const sourceResult = await database.query<MemorySourceEvent>(
    `SELECT id, user_id, question, hexagram_result, knowledge_context, reflection, saved_at
       FROM reflection_events WHERE id = $1`,
    [sourceEventId],
  );
  const source = sourceResult.rows[0];
  if (!source) return;
  const extracted = extractMemory(source);

  try {
    await database.query(
      `INSERT INTO event_memories (
         id, user_id, source_event_id, title, topic, trigger_text, summary, occurred_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (source_event_id) DO UPDATE SET
         title = CASE WHEN event_memories.user_corrected THEN event_memories.title ELSE EXCLUDED.title END,
         topic = CASE WHEN event_memories.user_corrected THEN event_memories.topic ELSE EXCLUDED.topic END,
         trigger_text = CASE WHEN event_memories.user_corrected THEN event_memories.trigger_text ELSE EXCLUDED.trigger_text END,
         summary = CASE WHEN event_memories.user_corrected THEN event_memories.summary ELSE EXCLUDED.summary END,
         updated_at = now()`,
      [randomUUID(), source.user_id, source.id, extracted.event.title, extracted.event.topic, extracted.event.triggerText, extracted.event.summary, source.saved_at],
    );
    await database.query(
      `INSERT INTO reflection_memories (
         id, user_id, source_event_id, observation, insight, reflection_question,
         action_suggestion, concepts
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (source_event_id) DO UPDATE SET
         observation = CASE WHEN reflection_memories.user_corrected THEN reflection_memories.observation ELSE EXCLUDED.observation END,
         insight = CASE WHEN reflection_memories.user_corrected THEN reflection_memories.insight ELSE EXCLUDED.insight END,
         reflection_question = CASE WHEN reflection_memories.user_corrected THEN reflection_memories.reflection_question ELSE EXCLUDED.reflection_question END,
         action_suggestion = CASE WHEN reflection_memories.user_corrected THEN reflection_memories.action_suggestion ELSE EXCLUDED.action_suggestion END,
         concepts = CASE WHEN reflection_memories.user_corrected THEN reflection_memories.concepts ELSE EXCLUDED.concepts END,
         updated_at = now()`,
      [randomUUID(), source.user_id, source.id, extracted.reflection.observation, extracted.reflection.insight, extracted.reflection.reflectionQuestion, extracted.reflection.actionSuggestion, extracted.reflection.concepts],
    );
    await rebuildPatterns(database, source.user_id);
    await database.query(
      `INSERT INTO memory_processing_runs (source_event_id, user_id, processing_version, status)
       VALUES ($1,$2,$3,'completed')
       ON CONFLICT (source_event_id) DO UPDATE SET
         processing_version = EXCLUDED.processing_version, status = 'completed',
         error_code = NULL, processed_at = now()`,
      [source.id, source.user_id, MEMORY_PROCESSING_VERSION],
    );
  } catch (error) {
    await database.query(
      `INSERT INTO memory_processing_runs (source_event_id, user_id, processing_version, status, error_code)
       VALUES ($1,$2,$3,'failed','processing_failed')
       ON CONFLICT (source_event_id) DO UPDATE SET
         processing_version = EXCLUDED.processing_version, status = 'failed',
         error_code = EXCLUDED.error_code, processed_at = now()`,
      [source.id, source.user_id, MEMORY_PROCESSING_VERSION],
    );
    throw error;
  }
}

export async function ensureUserMemoriesProcessed(database: Database, userId: string): Promise<void> {
  const pending = await database.query<{ id: string }>(
    `SELECT events.id
       FROM reflection_events AS events
       LEFT JOIN memory_processing_runs AS runs ON runs.source_event_id = events.id
      WHERE events.user_id = $1
        AND (runs.source_event_id IS NULL OR runs.processing_version < $2 OR runs.status = 'failed')
      ORDER BY events.saved_at ASC
      LIMIT 100`,
    [userId, MEMORY_PROCESSING_VERSION],
  );
  for (const row of pending.rows) await processReflectionEvent(database, row.id);
}

export async function refreshUserPatterns(database: Database, userId: string): Promise<void> {
  await rebuildPatterns(database, userId);
}
