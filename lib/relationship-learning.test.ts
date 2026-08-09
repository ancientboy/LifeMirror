import assert from "node:assert/strict";
import test from "node:test";
import { buildRelationshipArchive, buildRelationshipCalibration, calculateRelationshipLoopMetrics } from "./relationship-learning";

test("relationship calibration learns only from user-reported completed actions", () => {
  const calibration = buildRelationshipCalibration("person-1", [
    { personId: "person-1", status: "reported", actionTaken: true, outcome: "smooth" },
    { personId: "person-1", status: "reported", actionTaken: false, outcome: "rough" },
    { personId: "person-2", status: "reported", actionTaken: true, outcome: "rough" },
  ]);
  assert.equal(calibration.completedActions, 1);
  assert.equal(calibration.outcomeCounts.smooth, 1);
  assert.equal(calibration.outcomeCounts.rough, 0);
  assert.match(calibration.nextPractice ?? "", /不是对 TA 的定论/);
});

test("effect-loop metrics separate a real action from a reported outcome", () => {
  const metrics = calculateRelationshipLoopMetrics([
    { personId: "person-1", status: "awaiting_action" },
    { personId: "person-1", status: "reported", actionTaken: true, outcome: "mixed" },
    { personId: "person-2", status: "reported", actionTaken: false },
  ]);
  assert.deepEqual(metrics, {
    rehearsalsStarted: 3,
    awaitingFeedback: 1,
    feedbackReported: 2,
    actionsTaken: 1,
    actionRate: 1 / 3,
    feedbackCompletionRate: 2 / 3,
    repeatPracticePeople: 1,
  });
});

test("relationship archive shows only confirmed interactions and a visible next adjustment", () => {
  const archive = buildRelationshipArchive("person-1", [
    { id: "waiting", personId: "person-1", status: "awaiting_action", situation: "要不要开口" },
    { id: "no-action", personId: "person-1", status: "reported", actionTaken: false, outcome: "rough", situation: "没有去聊" },
    { id: "confirmed", personId: "person-1", status: "reported", actionTaken: true, outcome: "mixed", situation: "沟通频率", reflection: "对方解释了，但我还是有点委屈", reportedAt: "2026-08-09T12:00:00.000Z" },
  ]);
  assert.equal(archive.awaitingFeedback, 1);
  assert.equal(archive.verifiedInteractions.length, 1);
  assert.equal(archive.verifiedInteractions[0].id, "confirmed");
  assert.match(archive.visibleAdjustment, /下一次|下次/);
  assert.doesNotMatch(archive.summary, /人格|内心/);
});
