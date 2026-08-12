import assert from "node:assert/strict";
import test from "node:test";
import { classifyRelationshipSafety, classifySafetyBoundary, CRISIS_RESPONSE, relationshipSafetyPrompt, safetyPrompt } from "./safety-boundary.js";

test("high-risk wording is routed deterministically before model generation", () => {
  assert.equal(classifySafetyBoundary("我不想活了"), "crisis");
  assert.equal(classifySafetyBoundary("这个药能不能停"), "health");
  assert.equal(classifySafetyBoundary("合同纠纷要不要起诉"), "legal");
  assert.equal(classifySafetyBoundary("要不要加杠杆买入"), "finance");
  assert.equal(classifySafetyBoundary("今天有点累"), "none");
  assert.match(CRISIS_RESPONSE, /急救|急诊/);
  assert.match(safetyPrompt("health"), /不得诊断/);
});

test("relationship safety risks stop ordinary reply optimization", () => {
  assert.equal(classifyRelationshipSafety("他威胁我不许离开"), "coercion");
  assert.equal(classifyRelationshipSafety("领导说拒绝就让我降职"), "work_retaliation");
  assert.equal(classifyRelationshipSafety("对方是未成年人"), "minor");
  assert.match(relationshipSafetyPrompt("coercion"), /安全|证据|可信/);
});
