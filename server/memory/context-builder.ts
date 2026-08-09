import type { Database } from "../database/pool.js";

export type PersonalContextMode = "chat" | "daily_guidance" | "review" | "relationship" | "rehearsal";
export type PersonalContext = {
  explicitFacts: Array<{ id: string; text: string; kind: string; updatedAt: string }>;
  relevantHistory: Array<{ id: string; sourceKind: string; title: string; summary: string; occurredAt: string; openLoopStatus: string; personId: string | null }>;
  relevantPatterns: Array<{ id: string; title: string; summary: string; confidence: number; signalCount: number }>;
  openLoops: Array<{ id: string; title: string; summary: string; personId: string | null; occurredAt: string }>;
  people: Array<{ id: string; displayName: string; relationshipType: string | null; userDescription: string | null; communicationNotes: string | null }>;
  provenance: { mode: PersonalContextMode; excluded: string[]; ranking: string[] };
};

function terms(value: string) {
  return new Set(value.toLowerCase().replace(/[\s，。！？；：、】【,.!?;:'"“”‘’（）()]/g, "").match(/.{2}/g) ?? []);
}

export function relevanceScore(query: string, candidate: string, occurredAt: Date, isOpenLoop: boolean) {
  const queryTerms = terms(query);
  const candidateTerms = terms(candidate);
  const overlap = queryTerms.size ? [...queryTerms].filter((term) => candidateTerms.has(term)).length / queryTerms.size : 0;
  const ageDays = Math.max(0, (Date.now() - occurredAt.getTime()) / 86_400_000);
  return overlap * 8 + Math.max(0, 2 - ageDays / 45) + (isOpenLoop ? 3 : 0);
}

export async function buildPersonalContext(database: Database, userId: string, input: { mode: PersonalContextMode; query?: string; personId?: string; limit?: number }): Promise<PersonalContext> {
  const limit = Math.min(Math.max(input.limit ?? 6, 1), 12);
  const query = input.query?.trim() ?? "";
  const [facts, history, patterns, people] = await Promise.all([
    database.query<{ id: string; fact_text: string; fact_kind: string; updated_at: Date }>(
      `SELECT id, fact_text, fact_kind, updated_at FROM user_explicit_facts WHERE user_id = $1 AND visibility = 'visible' ORDER BY updated_at DESC LIMIT $2`, [userId, limit],
    ),
    database.query<{ id: string; source_kind: string; title: string; summary: string; occurred_at: Date; open_loop_status: string; person_id: string | null }>(
      `SELECT id, source_kind, title, summary, occurred_at, open_loop_status, person_id FROM user_history_records WHERE user_id = $1 AND deleted_at IS NULL AND ($2::uuid IS NULL OR person_id = $2) ORDER BY occurred_at DESC LIMIT 40`, [userId, input.personId ?? null],
    ),
    database.query<{ id: string; title: string; summary: string; confidence: number; signal_count: number }>(
      `SELECT id, title, summary, confidence::float8 AS confidence, signal_count FROM pattern_memories WHERE user_id = $1 AND visibility = 'visible' ORDER BY last_observed_at DESC LIMIT $2`, [userId, limit],
    ),
    database.query<{ id: string; display_name: string; relationship_type: string | null; user_description: string | null; communication_notes: string | null }>(
      `SELECT id, display_name, relationship_type, user_description, communication_notes FROM relationship_people WHERE owner_user_id = $1 AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT $2`, [userId, limit],
    ),
  ]);
  const ranked = history.rows.map((row) => ({ row, score: relevanceScore(query, `${row.title} ${row.summary}`, row.occurred_at, row.open_loop_status === "open") }))
    .sort((a, b) => b.score - a.score || b.row.occurred_at.getTime() - a.row.occurred_at.getTime()).slice(0, limit);
  const selected = ranked.map(({ row }) => ({ id: row.id, sourceKind: row.source_kind, title: row.title, summary: row.summary, occurredAt: row.occurred_at.toISOString(), openLoopStatus: row.open_loop_status, personId: row.person_id }));
  return {
    explicitFacts: facts.rows.map((row) => ({ id: row.id, text: row.fact_text, kind: row.fact_kind, updatedAt: row.updated_at.toISOString() })),
    relevantHistory: selected,
    relevantPatterns: patterns.rows.map((row) => ({ id: row.id, title: row.title, summary: row.summary, confidence: row.confidence, signalCount: row.signal_count })),
    openLoops: selected.filter((item) => item.openLoopStatus === "open").map(({ id, title, summary, personId, occurredAt }) => ({ id, title, summary, personId, occurredAt })),
    people: people.rows.map((row) => ({ id: row.id, displayName: row.display_name, relationshipType: row.relationship_type, userDescription: row.user_description, communicationNotes: row.communication_notes })),
    provenance: { mode: input.mode, excluded: ["symbolic_tool_result_as_user_fact", "hidden_or_deleted_memory", "unconfirmed_other_person_claim"], ranking: ["query_relevance", "open_loop_priority", "recency"] },
  };
}
