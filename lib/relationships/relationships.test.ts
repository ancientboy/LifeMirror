import assert from "node:assert/strict";
import test from "node:test";
import { relationshipPolicyFor } from "./policy.js";
import { relationshipAnswerSchema } from "./response-schema.js";
import { classifyRelationship } from "./taxonomy.js";

test("the same relationship taxonomy routes romance, work, friendship and family", () => {
  assert.deepEqual(classifyRelationship("暧昧对象问我周末有没有空，怎么回").role, "dating");
  assert.deepEqual(classifyRelationship("领导临时把责任推给我，怎么沟通").powerPosition, "user_lower_power");
  assert.deepEqual(classifyRelationship("朋友最近一直不回我").domain, "friendship");
  assert.deepEqual(classifyRelationship("想跟妈妈设一个边界").domain, "family");
});

test("an unknown person triggers one clarification only when role changes the reply", () => {
  assert.equal(classifyRelationship("这句话是什么意思，我怎么回").missingCriticalField, "role");
  assert.equal(classifyRelationship("今天心情不太好").missingCriticalField, undefined);
});

test("strategy policy respects power and long-term relationship boundaries", () => {
  const manager = relationshipPolicyFor(classifyRelationship("领导让我私下背锅"));
  assert.match(manager.replyStyle, /事实|风险/);
  assert.ok(manager.avoid.some((item) => item.includes("对抗")));
  const family = relationshipPolicyFor(classifyRelationship("家人反复越过我的边界"));
  assert.ok(family.priorities.some((item) => item.includes("依赖")));
});

test("relationship answer contract keeps judgment, uncertainty, reply and next signal", () => {
  assert.equal(relationshipAnswerSchema.safeParse({ judgment: { summary: "目前更像是信息没有对齐。", facts: ["对方只回复了时间"], hypotheses: ["可能尚未理解问题"], uncertainty: ["不能确认对方的动机"] }, replyOptions: [{ id: "natural", tone: "natural", text: "我想确认一下你的意思。", why: "先降低误解" }], recommendedReplyId: "natural", nextSignals: ["看对方是否给出具体解释"] }).success, true);
  assert.equal(relationshipAnswerSchema.safeParse({ judgment: "只有判断" }).success, false);
});
