import assert from "node:assert/strict";
import test from "node:test";
import type { ReflectionDraftPayload } from "./types.js";
import { openReflectionDraft, sealReflectionDraft } from "./token.js";

const secret = "test-reflection-secret-at-least-32-characters";
const payload = {
  version: 1,
  runtimeId: "00000000-0000-4000-8000-000000000001",
  userId: "00000000-0000-4000-8000-000000000002",
  question: "我应该怎样看待这个选择？",
  tosses: Array(6).fill([2, 2, 2]),
  hexagram: {},
  knowledge: {},
  reflection: {},
  provider: "fixture",
  model: "fixture",
  generatedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
} as unknown as ReflectionDraftPayload;

test("reflection drafts round-trip and reject tampering", () => {
  const token = sealReflectionDraft(payload, secret);
  assert.equal(openReflectionDraft(token, secret).runtimeId, payload.runtimeId);
  assert.throws(() => openReflectionDraft(`${token}x`, secret), /invalid_reflection_token/);
});

test("Shiguang v2 reflection drafts round-trip", () => {
  const token = sealReflectionDraft({ ...payload, version: 2 }, secret);
  assert.equal(openReflectionDraft(token, secret).version, 2);
});

test("Liuyao v3 drafts bind deterministic traditional-analysis context", () => {
  const analysisContext = { topic: "career", monthBranch: "wei", dayStem: "jia", dayBranch: "zi" } as const;
  const token = sealReflectionDraft({ ...payload, version: 3, analysisContext }, secret);
  assert.deepEqual(openReflectionDraft(token, secret).analysisContext, analysisContext);
});

test("Reflection v4 drafts bind mapping and explanation trace", () => {
  const reflectionKnowledge = { source: "KNOWLEDGE-004", boundary: "test", mappings: [] } as const;
  const explanationTrace = { traditional_basis: "卦辞", liuyao_factors: ["rule"], reflection_mapping: "mapping", final_response: {} };
  const token = sealReflectionDraft({ ...payload, version: 4, reflectionKnowledge, explanationTrace } as unknown as ReflectionDraftPayload, secret);
  const opened = openReflectionDraft(token, secret);
  assert.equal(opened.reflectionKnowledge?.source, "KNOWLEDGE-004");
  assert.equal(opened.explanationTrace?.reflection_mapping, "mapping");
});

test("expired reflection drafts cannot be saved", () => {
  const expired = { ...payload, expiresAt: new Date(Date.now() - 1_000).toISOString() };
  assert.throws(() => openReflectionDraft(sealReflectionDraft(expired, secret), secret), /expired_reflection_token/);
});
