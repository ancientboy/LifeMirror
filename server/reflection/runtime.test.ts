import assert from "node:assert/strict";
import test from "node:test";
import { retrieveLiuyaoKnowledge } from "../knowledge/liuyao-retrieval.js";
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
        text: '```json\n{"shiguangSees":"我看到你正在认真权衡新的工作方向。","hexagramMeaning":"这一卦提醒你先辨认条件是否成熟。","mirrorUnderstanding":"你的犹豫也许不是退缩，而是在寻找一个能安心验证的起点。","practicalGuidance":"列出一个关键未知，并完成一次可撤回的小实验。","reflectionQuestion":"什么条件会让你更安心？","shareableReflection":"不必一次决定整条路，先验证让下一步变得踏实的条件。"}\n```',
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
    userContext: { recentEvents: [{ title: "职业与方向", summary: "曾记录一个工作选择。", occurredAt: "2026-08-01T00:00:00.000Z" }], patterns: [] },
  });
  assert.equal(result.reflection.shiguangSees, "我看到你正在认真权衡新的工作方向。");
  assert.equal(result.reflection.practicalGuidance, "列出一个关键未知，并完成一次可撤回的小实验。");
  assert.equal(result.reflection.shareableReflection, "不必一次决定整条路，先验证让下一步变得踏实的条件。");
  assert.match(captured?.messages[0].content ?? "", /Never predict the future/);
  assert.match(captured?.messages[0].content ?? "", /You are Shiguang/);
  assert.match(captured?.messages[0].content ?? "", /Avoid report language/);
  assert.match(captured?.messages[0].content ?? "", /immutable computed facts/);
  assert.match(captured?.messages[0].content ?? "", /must not infer the missing fields|never fill the missing fields/i);
  assert.match(captured?.messages[1].content ?? "", /曾记录一个工作选择/);
  assert.match(captured?.messages[1].content ?? "", /元亨利贞/);
  assert.match(captured?.messages[1].content ?? "", /context_required/);
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
  await assert.rejects(() => generateMirrorReflection({ llm, question: "我应该如何理解这个选择？", hexagram, knowledge: retrieveLiuyaoKnowledge(hexagram) }));
});

test("reflection runtime rejects unstructured provider output", async () => {
  const hexagram = calculateLiuyao(Array(6).fill([3, 2, 2] satisfies CoinToss));
  const llm: LlmProvider = {
    name: "fixture",
    async generate() { return { text: "not-json", model: "fixture-model", provider: "fixture" }; },
  };
  await assert.rejects(() => generateMirrorReflection({ llm, question: "我应该如何理解这个选择？", hexagram, knowledge: retrieveLiuyaoKnowledge(hexagram) }));
});
