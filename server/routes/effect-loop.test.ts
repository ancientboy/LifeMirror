import assert from "node:assert/strict";
import test from "node:test";
import { effectLoopDeleteSchema, effectLoopEventSchema, summarizeEffectLoopMetrics } from "./effect-loop.js";

const loopId = "11111111-1111-4111-8111-111111111111";
const relationshipKey = "22222222-2222-4222-8222-222222222222";

test("effect-loop events accept only opaque lifecycle identifiers", () => {
  assert.equal(effectLoopEventSchema.safeParse({ loopId, relationshipKey, eventType: "rehearsal_started" }).success, true);
  assert.equal(effectLoopEventSchema.safeParse({ loopId, relationshipKey, eventType: "rehearsal_started", reflection: "对方说了什么" }).success, false);
  assert.equal(effectLoopEventSchema.safeParse({ loopId, relationshipKey, eventType: "outcome" }).success, false);
});

test("effect-loop deletion needs a scoped private identifier", () => {
  assert.equal(effectLoopDeleteSchema.safeParse({}).success, false);
  assert.equal(effectLoopDeleteSchema.safeParse({ relationshipKey }).success, true);
});

test("effect-loop metrics stay aggregate and calculate rates defensively", () => {
  assert.deepEqual(summarizeEffectLoopMetrics([
    { event_type: "rehearsal_started", total: 4 },
    { event_type: "action_taken", total: "2" },
    { event_type: "feedback_reported", total: 3 },
  ]), {
    rehearsalsStarted: 4,
    followupsSeen: 0,
    actionsTaken: 2,
    feedbackReported: 3,
    actionRate: 0.5,
    feedbackCompletionRate: 0.75,
  });
});
