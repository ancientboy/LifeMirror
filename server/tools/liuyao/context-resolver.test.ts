import assert from "node:assert/strict";
import test from "node:test";
import { classifyLiuyaoIntents, createIntentSelection, resolveLiuyaoContext, sexagenaryDay, solarTermMonthBranch } from "./context-resolver.js";

test("calendar context deterministically resolves a known Jia-Zi day", () => {
  assert.deepEqual(sexagenaryDay(new Date("2019-01-27T12:00:00.000Z"), "UTC"), {
    dayStem: "jia",
    dayBranch: "zi",
  });
  assert.equal(solarTermMonthBranch(new Date("2019-01-27T12:00:00.000Z"), "UTC"), "chou");
});

test("a casual game question keeps meetup and winnings as separate intents", () => {
  const intents = classifyLiuyaoIntents("今晚约朋友打牌能赢钱吗？");
  assert.deepEqual(intents.map((intent) => intent.topic), ["travel", "wealth"]);
  const context = resolveLiuyaoContext({
    question: "今晚约朋友打牌能赢钱吗？",
    occurredAt: "2026-08-02T23:00:00.000Z",
    timezone: "America/Los_Angeles",
  });
  assert.equal(context.topic, "travel");
  assert.equal(context.tone, "playful");
  assert.equal(context.intents?.length, 2);
  assert.equal(context.occurredAt, "2026-08-02T23:00:00.000Z");
  assert.equal(context.timezone, "America/Los_Angeles");
  assert.equal(context.timingScale, "day");
});

test("timing scale follows the question horizon instead of forcing every reading into branch days", () => {
  const shortTerm = resolveLiuyaoContext({ question: "这周末适合出门吗？", occurredAt: "2026-08-02T12:00:00.000Z", timezone: "UTC" });
  const longTerm = resolveLiuyaoContext({ question: "今年什么时候适合换工作？", occurredAt: "2026-08-02T12:00:00.000Z", timezone: "UTC" });

  assert.equal(shortTerm.timingScale, "day");
  assert.equal(longTerm.timingScale, "month");
});

test("relationship classification does not guess a gendered useful god without a target", () => {
  assert.equal(classifyLiuyaoIntents("这段关系还有必要继续吗？")[0].topic, "self");
  assert.equal(classifyLiuyaoIntents("我和男友还会复合吗？")[0].topic, "relationship_female");
  assert.equal(classifyLiuyaoIntents("我和女友还会复合吗？")[0].topic, "relationship_male");
});

test("topic-specific useful-god routing uses self for health and the other side for partnership", () => {
  assert.equal(classifyLiuyaoIntents("这次身体检查结果怎么样？")[0].usefulGod, "shi");
  assert.equal(classifyLiuyaoIntents("这个合作伙伴值得继续合作吗？")[0].usefulGod, "ying");
});

test("question scenarios route to auditable specialist rules without leaking across intents", () => {
  const job = classifyLiuyaoIntents("面试新工作，工资会更高吗？");
  const exam = classifyLiuyaoIntents("这次考试成绩能过线吗？");
  const genericReconciliation = classifyLiuyaoIntents("和前任还能复合吗？")[0];
  const genderedReconciliation = classifyLiuyaoIntents("我和男友还能复合吗？")[0];
  const investment = resolveLiuyaoContext({ question: "这只基金适合投资吗？", occurredAt: "2026-08-02T12:00:00.000Z", timezone: "UTC" });

  assert.equal(job.find((intent) => intent.topic === "career")?.scenario, "job_search");
  assert.equal(job.find((intent) => intent.topic === "wealth")?.scenario, undefined);
  assert.equal(exam[0].scenario, "exam");
  assert.equal(genericReconciliation.scenario, "reconciliation");
  assert.equal(genericReconciliation.usefulGod, "ying");
  assert.equal(genderedReconciliation.scenario, "reconciliation");
  assert.equal(genderedReconciliation.usefulGod, undefined);
  assert.equal(investment.scenario, "investment");
  assert.equal(investment.tone, "careful");
  assert.equal(classifyLiuyaoIntents("这次能拿到 offer 吗？")[0].scenario, "job_search");
  assert.equal(resolveLiuyaoContext({ question: "和前任还能复合吗？", occurredAt: "2026-08-02T12:00:00.000Z", timezone: "UTC" }).tone, "warm");
});

test("scenario focus separates stages that share the same broad topic", () => {
  const questions = [
    ["这次面试发挥怎么样？", "job_interview"],
    ["这次能拿到 offer 吗？", "job_offer"],
    ["入职后的试用期能顺利吗？", "job_start"],
    ["这次考试发挥如何？", "exam_performance"],
    ["考试成绩能及格吗？", "exam_score"],
    ["这次能被录取吗？", "exam_admission"],
    ["前任还会不会联系？", "relationship_contact"],
    ["前任还能复合吗？", "relationship_reconcile"],
    ["这段关系能长期稳定吗？", "relationship_stability"],
    ["这只股票适合短线买入吗？", "investment_short_term"],
    ["这只基金适合长期持有吗？", "investment_long_term"],
  ] as const;

  for (const [question, focus] of questions) {
    const intent = classifyLiuyaoIntents(question)[0];
    assert.equal(intent.scenarioFocus, focus, question);
    assert.ok(intent.label.length > 0);
  }
});

test("historical Python category aliases keep their intended useful-god families", () => {
  assert.equal(classifyLiuyaoIntents("这份合同能不能签？")[0].usefulGod, undefined);
  assert.equal(classifyLiuyaoIntents("这份合同能不能签？")[0].topic, "family");
  assert.equal(classifyLiuyaoIntents("我的宠物能顺利恢复吗？")[0].topic, "children");
  assert.equal(classifyLiuyaoIntents("这个同事竞争会不会影响我？")[0].usefulGod, "siblings");
  assert.equal(classifyLiuyaoIntents("这次出行平安吗？")[0].topic, "travel");
});

test("a confirmed semantic selection is preserved while calendar context is resolved later", () => {
  const selection = createIntentSelection({
    question: "看看以后怎么样",
    topicHint: "relationship",
    intents: [{ id: "self-1", label: "关系能否稳定", topic: "self", priority: 1, usefulGod: "ying", scenario: "reconciliation", scenarioFocus: "relationship_stability" }],
    source: "user_confirmed",
    confidence: 1,
  });
  const context = resolveLiuyaoContext({
    question: "看看以后怎么样",
    intentSelection: selection,
    occurredAt: "2019-01-27T12:00:00.000Z",
    timezone: "UTC",
  });

  assert.equal(context.scenarioFocus, "relationship_stability");
  assert.equal(context.intentResolution?.source, "user_confirmed");
  assert.equal(context.dayStem, "jia");
  assert.equal(context.dayBranch, "zi");
});
