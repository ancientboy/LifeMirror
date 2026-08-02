import assert from "node:assert/strict";
import test from "node:test";
import { retrieveLiuyaoKnowledge } from "../knowledge/liuyao-retrieval.js";
import { retrieveLiuyaoReflectionKnowledge } from "../knowledge/liuyao-reflection-map.js";
import type { LlmProvider } from "../llm/types.js";
import { calculateLiuyao } from "../tools/liuyao/engine.js";
import type { CoinToss } from "../tools/liuyao/types.js";
import { generateMirrorReflection } from "./runtime.js";

test("reflection runtime returns the Shiguang persona structure from provider JSON", async () => {
  const hexagram = calculateLiuyao(Array(6).fill([3, 2, 2] satisfies CoinToss));
  let captured: Parameters<LlmProvider["generate"]>[0] | undefined;
  const llm: LlmProvider = {
    name: "fixture",
    async generate(request) {
      captured = request;
      return {
        text: '```json\n{"traditionalJudgment":"先说结论：仅按卦象象意，这个方向可以尝试，但应先确认条件。","reasoningExplanation":"乾卦强调主动开始，本次无完整历法上下文，不补算旺衰。","shiguangInterpretation":"可以往前走，但先把最影响结果的条件问清楚。","practicalGuidance":"先确认一项关键条件，再决定投入多少。","evidenceCards":[{"title":"乾卦","technical":"乾卦主动开创","plain":"这股力更想往前走。","effect":"positive"},{"title":"上下文不足","technical":"未计算用神旺衰","plain":"细节还不能说满。","effect":"mixed"}],"closing":{"type":"observation","text":"先看现实有没有回应，再走下一步。"},"shareableReflection":"不必一次决定整条路，先看清让下一步变踏实的条件。"}\n```',
        model: "fixture-model",
        provider: "fixture",
      };
    },
  };

  const result = await generateMirrorReflection({
    llm,
    question: "我是否应该开始新的工作方向？",
    hexagram,
    knowledge: retrieveLiuyaoKnowledge(hexagram),
    reflectionKnowledge: retrieveLiuyaoReflectionKnowledge(hexagram, retrieveLiuyaoKnowledge(hexagram)),
    userContext: { recentEvents: [{ title: "职业与方向", summary: "曾记录一个工作选择。", occurredAt: "2026-08-01T00:00:00.000Z" }], patterns: [] },
  });
  assert.match(result.reflection.traditionalJudgment, /可以尝试/);
  assert.equal(result.reflection.practicalGuidance, "先确认一项关键条件，再决定投入多少。");
  assert.equal(result.reflection.evidenceCards.length, 2);
  assert.match(captured?.messages[0].content ?? "", /Never predict the future/);
  assert.match(captured?.messages[0].content ?? "", /You are Shiguang/);
  assert.match(captured?.messages[0].content ?? "", /Avoid academic reports/);
  assert.match(captured?.messages[0].content ?? "", /playful may tease lightly/);
  assert.match(captured?.messages[0].content ?? "", /Do not force every reading into reflection/);
  assert.match(captured?.messages[1].content ?? "", /judgment/);
  assert.match(captured?.messages[0].content ?? "", /immutable computed facts/);
  assert.match(captured?.messages[0].content ?? "", /The user came for an answer/);
  assert.match(captured?.messages[0].content ?? "", /structural or focus evidence only/);
  assert.match(captured?.messages[0].content ?? "", /interview with offer/);
  assert.match(captured?.messages[0].content ?? "", /evidenceBalance is conflicted/);
  assert.match(captured?.messages[0].content ?? "", /scoped by intentId/);
  assert.match(captured?.messages[0].content ?? "", /health, legal or investment/);
  assert.match(captured?.messages[0].content ?? "", /Do not evade the question/);
  assert.match(captured?.messages[0].content ?? "", /must not infer the missing fields|never fill the missing fields/i);
  assert.match(captured?.messages[1].content ?? "", /曾记录一个工作选择/);
  assert.match(captured?.messages[1].content ?? "", /元亨利贞/);
  assert.match(captured?.messages[1].content ?? "", /context_required/);
  assert.match(captured?.messages[1].content ?? "", /reflectionKnowledge/);
  assert.match(result.explanationTrace.traditional_basis, /乾卦/);
  assert.deepEqual(result.explanationTrace.final_response, result.reflection);
});

test("reflection runtime rejects the legacy analytical report shape", async () => {
  const hexagram = calculateLiuyao(Array(6).fill([3, 2, 2] satisfies CoinToss));
  const llm: LlmProvider = {
    name: "fixture",
    async generate() {
      return {
        text: '{"observation":"分析","insight":"报告","reflectionQuestion":"为什么？","actionSuggestion":"行动"}',
        model: "fixture-model",
        provider: "fixture",
      };
    },
  };
  const knowledge = retrieveLiuyaoKnowledge(hexagram);
  await assert.rejects(() => generateMirrorReflection({ llm, question: "我应该如何理解这个选择？", hexagram, knowledge, reflectionKnowledge: retrieveLiuyaoReflectionKnowledge(hexagram, knowledge) }));
});

test("reflection runtime rejects unstructured provider output", async () => {
  const hexagram = calculateLiuyao(Array(6).fill([3, 2, 2] satisfies CoinToss));
  const llm: LlmProvider = {
    name: "fixture",
    async generate() { return { text: "not-json", model: "fixture-model", provider: "fixture" }; },
  };
  const knowledge = retrieveLiuyaoKnowledge(hexagram);
  await assert.rejects(() => generateMirrorReflection({ llm, question: "我应该如何理解这个选择？", hexagram, knowledge, reflectionKnowledge: retrieveLiuyaoReflectionKnowledge(hexagram, knowledge) }));
});
