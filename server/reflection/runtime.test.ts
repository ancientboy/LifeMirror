import assert from "node:assert/strict";
import test from "node:test";
import { retrieveLiuyaoKnowledge } from "../knowledge/liuyao-retrieval.js";
import type { LlmProvider } from "../llm/types.js";
import { calculateLiuyao } from "../tools/liuyao/engine.js";
import type { CoinToss } from "../tools/liuyao/types.js";
import { generateMirrorReflection } from "./runtime.js";

test("reflection runtime returns the four required fields from provider JSON", async () => {
  const hexagram = calculateLiuyao(Array(6).fill([3, 2, 2] satisfies CoinToss));
  let captured: Parameters<LlmProvider["generate"]>[0] | undefined;
  const llm: LlmProvider = {
    name: "fixture",
    async generate(request) {
      captured = request;
      return {
        text: '```json\n{"observation":"你正在权衡推进与准备。","insight":"犹豫也许在保护一个尚未被看见的需要。","reflectionQuestion":"什么条件会让你更安心？","actionSuggestion":"写下一个可逆的小实验。"}\n```',
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
  assert.equal(result.reflection.observation, "你正在权衡推进与准备。");
  assert.equal(result.reflection.actionSuggestion, "写下一个可逆的小实验。");
  assert.match(captured?.messages[0].content ?? "", /Never predict the future/);
  assert.match(captured?.messages[1].content ?? "", /曾记录一个工作选择/);
  assert.match(captured?.messages[1].content ?? "", /元亨利贞/);
});

test("reflection runtime rejects unstructured provider output", async () => {
  const hexagram = calculateLiuyao(Array(6).fill([3, 2, 2] satisfies CoinToss));
  const llm: LlmProvider = {
    name: "fixture",
    async generate() { return { text: "not-json", model: "fixture-model", provider: "fixture" }; },
  };
  await assert.rejects(() => generateMirrorReflection({ llm, question: "我应该如何理解这个选择？", hexagram, knowledge: retrieveLiuyaoKnowledge(hexagram) }));
});
