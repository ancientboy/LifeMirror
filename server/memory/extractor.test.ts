import assert from "node:assert/strict";
import test from "node:test";
import { classifyMemoryTopic, extractMemory } from "./extractor.js";
import type { MemorySourceEvent } from "./types.js";

test("classifies recurring life domains without an LLM", () => {
  assert.equal(classifyMemoryTopic("我正在考虑换工作和创业").key, "career");
  assert.equal(classifyMemoryTopic("这段关系让我感到犹豫").key, "relationship");
  assert.equal(classifyMemoryTopic("没有关键词").key, "general");
});

test("extracts Event and Reflection Memory while preserving the source", () => {
  const source = {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "22222222-2222-4222-8222-222222222222",
    question: "我应该如何开始新的工作方向？",
    hexagram_result: {
      originalHexagram: { name: "乾" },
      changedHexagram: { name: "坤" },
    },
    knowledge_context: {
      original: { symbolicConcepts: ["创造", "行动"] },
      changed: { symbolicConcepts: ["承载", "行动"] },
    },
    reflection: {
      observation: "你正在观察新的起点。",
      insight: "先做一个小验证。",
      reflectionQuestion: "什么最值得验证？",
      actionSuggestion: "完成一次访谈。",
    },
    saved_at: new Date("2026-08-01T00:00:00Z"),
  } as MemorySourceEvent;

  const memory = extractMemory(source);
  assert.equal(memory.event.topic, "career");
  assert.equal(memory.event.triggerText, source.question);
  assert.deepEqual(memory.reflection.concepts, ["career", "创造", "行动", "承载"]);
  assert.equal(memory.reflection.insight, source.reflection.insight);
});
