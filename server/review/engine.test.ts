import assert from "node:assert/strict";
import test from "node:test";
import { buildMirrorReview, decideProactiveReflection } from "./engine.js";
import type { ReviewMemory } from "./types.js";

const now = new Date("2026-08-03T12:00:00.000Z");
function memory(id: string, daysAgo: number, topic: string): ReviewMemory {
  return { sourceEventId: id, occurredAt: new Date(now.getTime() - daysAgo * 86_400_000), title: `${topic}-${id}`, topic, summary: "summary", insight: "insight", reflectionQuestion: `question-${id}`, actionSuggestion: `action-${id}`, concepts: [topic] };
}

test("weekly review only uses evidence inside its period and traces every theme", () => {
  const review = buildMirrorReview({ cadence: "weekly", now, memories: [memory("a", 1, "career"), memory("b", 3, "career"), memory("old", 9, "emotion")] });
  assert.equal(review.status, "ready");
  assert.equal(review.trust.evidenceCount, 2);
  assert.deepEqual(review.themes[0], { name: "career", signalCount: 2, evidenceIds: ["memory:b", "memory:a"] });
  assert.ok(review.summary.includes("阶段性线索"));
});

test("review refuses to infer trends from a single memory", () => {
  const review = buildMirrorReview({ cadence: "monthly", now, memories: [memory("a", 2, "growth")] });
  assert.equal(review.status, "insufficient_evidence");
  assert.equal(review.reflectionQuestions.length, 0);
  assert.equal(review.gentleSuggestions.length, 0);
  assert.equal(review.trust.limitations.length, 1);
});

test("proactive reflection honors opt-out, cadence and cooldown", () => {
  const review = buildMirrorReview({ cadence: "weekly", now, memories: [memory("a", 1, "career"), memory("b", 2, "growth")] });
  const preferences = { enabled: true, weeklyEnabled: true, monthlyEnabled: true, cooldownHours: 168 };
  assert.equal(decideProactiveReflection({ review, preferences: { ...preferences, enabled: false }, now }).reason, "disabled");
  assert.equal(decideProactiveReflection({ review, preferences: { ...preferences, weeklyEnabled: false }, now }).reason, "cadence_disabled");
  assert.equal(decideProactiveReflection({ review, preferences, now, lastSuggestedAt: new Date(now.getTime() - 24 * 3_600_000) }).reason, "cooldown");
  assert.equal(decideProactiveReflection({ review, preferences, now }).shouldSuggest, true);
});
