import assert from "node:assert/strict";
import test from "node:test";
import { relationshipPolicyFor } from "./policy.js";
import { relationshipAnswerSchema } from "./response-schema.js";
import { buildRelationshipContext } from "./context-builder.js";
import { filterRelationshipReplies, shouldGenerateRelationshipReply } from "./reply.js";
import { classifyRelationship } from "./taxonomy.js";
import { inferredUserSideFromBubbles, mergeExtractedConversation, speakerFromBubbleSide } from "./vision.js";

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

test("vision assigns chat ownership from bubble position instead of message semantics", () => {
  assert.equal(speakerFromBubbleSide("left"), "other");
  assert.equal(speakerFromBubbleSide("right"), "user");
  assert.equal(speakerFromBubbleSide("center"), "unknown");
  assert.equal(inferredUserSideFromBubbles(["left", "center"]), "right");
  assert.equal(inferredUserSideFromBubbles(["center", "unknown"]), "unknown");
});

test("overlapping screenshots become one ordered conversation without deleting later legitimate repeats", () => {
  const merged = mergeExtractedConversation({ inferredUserSide: "right", missingRegions: [], warnings: [], pages: [
    { attachmentId: "a", order: 0, messages: [{ speaker: "other", text: "在干嘛" }, { speaker: "user", text: "看看你" }, { speaker: "other", text: "刚开一把" }] },
    { attachmentId: "b", order: 1, messages: [{ speaker: "user", text: "看看你" }, { speaker: "other", text: "刚开一把" }, { speaker: "other", text: "你最近怎么玩这个了" }, { speaker: "user", text: "看看你" }] },
  ] });
  assert.deepEqual(merged.map((item) => item.text), ["在干嘛", "看看你", "刚开一把", "你最近怎么玩这个了", "看看你"]);
});

test("reply generation is optional and unsafe incoming/meta replies are rejected", () => {
  const messages = [{ speaker: "other" as const, text: "你最近怎么开始玩这个了？" }, { speaker: "user" as const, text: "我玩啥？" }, { speaker: "user" as const, text: "57 在上我的号" }];
  assert.equal(shouldGenerateRelationshipReply({ userNote: "好像没以前热情了", goal: "interpret_signal", messages }), false);
  assert.equal(shouldGenerateRelationshipReply({ userNote: "我应该怎么回", goal: "draft_reply", messages }), true);
  const options = filterRelationshipReplies([
    { id: "copied", tone: "natural", text: "你最近怎么开始玩这个了？", why: "错误" },
    { id: "meta", tone: "natural", text: "这句是你问的吗？我以为是57跟你聊的。", why: "错误" },
    { id: "third-party", tone: "natural", text: "57 挺厉害的，怎么玩这么好。", why: "错误" },
    { id: "valid", tone: "warm", text: "那你先玩，打完再给我看看你。", why: "自然承接" },
  ], messages);
  assert.deepEqual(options.map((item) => item.id), ["valid"]);
});

test("person memory labels extracted evidence, prior hypotheses and reality feedback separately", () => {
  const classification = classifyRelationship("他最近不太热情");
  const context = buildRelationshipContext({ classification, memory: {
    recentCases: [],
    extractedMessages: [{ speaker: "other", text: "刚开一把", createdAt: "2026-08-12" }],
    priorAnalyses: [{ summary: "当时推测可能在忙", createdAt: "2026-08-12" }],
    realityFeedback: [{ outcome: "positive", acted: true, note: "后来主动解释了", createdAt: "2026-08-13" }],
  } });
  assert.match(context, /画面证据，可被用户纠正/);
  assert.match(context, /仅是当时假设，不是事实/);
  assert.match(context, /现实反馈（优先用于校准判断）/);
});

test("relationship analysis receives the same owner-authored person notes used by rehearsal", () => {
  const classification = classifyRelationship("我想知道他为什么这样回复");
  const context = buildRelationshipContext({
    classification,
    person: {
      id: "person-1", displayName: "小林", relationshipLabel: "暧昧中", domain: "romance", role: "dating", stage: "developing", powerPosition: "roughly_equal", confirmedByUser: true,
      userDescription: "面对冲突时会先回避，过一会儿再解释", communicationNotes: "不喜欢被连续追问", createdAt: "2026-08-12", updatedAt: "2026-08-13",
    },
  });
  assert.match(context, /用户对该人物的私密观察：面对冲突时会先回避/);
  assert.match(context, /沟通时需留意：不喜欢被连续追问/);
});
