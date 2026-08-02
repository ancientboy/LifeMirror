import assert from "node:assert/strict";
import test from "node:test";
import type { LlmProvider } from "../../llm/types.js";
import { understandLiuyaoIntent } from "./intent-understanding.js";

test("clear questions stay on the deterministic fast path", async () => {
  let calls = 0;
  const llm: LlmProvider = {
    name: "fixture",
    async generate() { calls += 1; throw new Error("should not be called"); },
  };
  const result = await understandLiuyaoIntent({
    llm,
    question: "这次能拿到 offer 吗？",
    topicHint: "career",
  });

  assert.equal(result.status, "resolved");
  assert.equal(result.source, "deterministic");
  assert.equal(result.selection?.scenarioFocus, "job_offer");
  assert.equal(calls, 0);
});

test("ambiguous goals use schema-bound LLM output and ask for user confirmation", async () => {
  let capturedResponseFormat: unknown;
  const llm: LlmProvider = {
    name: "fixture",
    async generate(request) {
      capturedResponseFormat = request.responseFormat;
      return {
        text: JSON.stringify({
          intents: [{ label: "关系后续", topic: "self", targetRole: "other_party", scenario: "reconciliation", scenarioFocus: null }],
          confidence: 0.61,
          needsClarification: true,
          clarificationQuestion: "你最想确认的是重新联系，还是关系能否稳定？",
          clarificationOptions: [
            { label: "是否重新联系", intents: [{ label: "是否重新联系", topic: "self", targetRole: "other_party", scenario: "reconciliation", scenarioFocus: "relationship_contact" }] },
            { label: "关系能否稳定", intents: [{ label: "关系能否稳定", topic: "self", targetRole: "other_party", scenario: "reconciliation", scenarioFocus: "relationship_stability" }] },
          ],
        }),
        provider: "fixture",
        model: "fixture-model",
      };
    },
  };
  const result = await understandLiuyaoIntent({ llm, question: "看看我和她以后怎么样", topicHint: "relationship" });

  assert.equal(result.status, "confirmation_required");
  assert.equal(result.clarification?.options.length, 2);
  assert.equal(result.clarification?.options[0].selection.resolution.source, "user_confirmed");
  assert.equal(result.clarification?.options[0].selection.scenarioFocus, "relationship_contact");
  assert.deepEqual((capturedResponseFormat as { name: string; strict: boolean }).name, "liuyao_intent_resolution");
  assert.equal((capturedResponseFormat as { strict: boolean }).strict, true);
});

test("invalid model output never reaches the rule engine and falls back deterministically", async () => {
  const llm: LlmProvider = {
    name: "fixture",
    async generate() { return { text: "not-json", provider: "fixture", model: "fixture-model" }; },
  };
  const result = await understandLiuyaoIntent({ llm, question: "这家公司会不会要我", topicHint: "career" });

  assert.equal(result.status, "resolved");
  assert.equal(result.source, "fallback");
  assert.equal(result.selection?.topic, "career");
  assert.equal(result.selection?.resolution.source, "fallback");
});

test("stage ambiguity still asks the user when the LLM is unavailable", async () => {
  const llm = { name: "disabled", async generate() { throw new Error("disabled"); } } satisfies LlmProvider;
  const result = await understandLiuyaoIntent({ llm, question: "最近求职怎么样？", topicHint: "career" });

  assert.equal(result.status, "confirmation_required");
  assert.deepEqual(result.clarification?.options.map((option) => option.selection.scenarioFocus), ["job_interview", "job_offer", "job_start"]);
});
