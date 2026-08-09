import assert from "node:assert/strict";
import test from "node:test";
import { buildRelationshipCalibration, calculateRelationshipLoopMetrics } from "./relationship-learning";

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
