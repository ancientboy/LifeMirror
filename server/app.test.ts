import assert from "node:assert/strict";
import test from "node:test";
import type { AppConfig } from "./config.js";
import type { Database } from "./database/pool.js";
import type { LlmProvider } from "./llm/types.js";
import { buildApp } from "./app.js";

const config: AppConfig = {
  NODE_ENV: "test",
  API_HOST: "127.0.0.1",
  API_PORT: 8787,
  WEB_ORIGIN: "http://localhost:4173",
  DATABASE_URL: "postgres://unused",
  SESSION_COOKIE_NAME: "test_session",
  SESSION_TTL_DAYS: 1,
  SESSION_COOKIE_SAME_SITE: "strict",
  REFLECTION_TOKEN_SECRET: "test-reflection-secret-at-least-32-characters",
  LLM_PROVIDER: "disabled",
  LLM_BASE_URL: "https://api.openai.com/v1",
};

test("liveness endpoint does not depend on external services", async () => {
  const database = {} as Database;
  const llm = { name: "disabled", generate: async () => { throw new Error("disabled"); } } as LlmProvider;
  const app = await buildApp({ config, database, llm });

  const response = await app.inject({ method: "GET", url: "/health/live" });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    status: "ok",
    service: "life-mirror-api",
    phase: "PHASE-002",
  });

  await app.close();
});

test("requests from untrusted origins are rejected", async () => {
  const app = await buildApp({
    config,
    database: {} as Database,
    llm: { name: "disabled" } as LlmProvider,
  });

  const response = await app.inject({
    method: "GET",
    url: "/health/live",
    headers: { origin: "https://malicious.example" },
  });
  assert.equal(response.statusCode, 403);

  await app.close();
});

test("intent resolution is confirmed before its semantic target enters calculation", async () => {
  const llm: LlmProvider = {
    name: "fixture",
    async generate() {
      return {
        text: JSON.stringify({
          intents: [{ label: "关系后续", topic: "self", targetRole: "other_party", scenario: "reconciliation", scenarioFocus: null }],
          confidence: 0.6,
          needsClarification: true,
          clarificationQuestion: "你主要想问重新联系，还是关系稳定？",
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
  const app = await buildApp({ config, database: {} as Database, llm });

  const resolved = await app.inject({
    method: "POST",
    url: "/api/v1/tools/liuyao/resolve-intent",
    payload: { question: "看看我和她以后怎么样", topicHint: "relationship" },
  });
  assert.equal(resolved.statusCode, 200);
  assert.equal(resolved.json().status, "confirmation_required");
  const selection = resolved.json().clarification.options[1].selection;

  const calculated = await app.inject({
    method: "POST",
    url: "/api/v1/tools/liuyao/calculate",
    payload: {
      question: "看看我和她以后怎么样",
      intentSelection: selection,
      occurredAt: "2019-01-27T12:00:00.000Z",
      timezone: "UTC",
      tosses: Array.from({ length: 6 }, () => [3, 2, 2]),
    },
  });
  assert.equal(calculated.statusCode, 200);
  assert.equal(calculated.json().analysisContext.scenarioFocus, "relationship_stability");
  assert.equal(calculated.json().analysisContext.intentResolution.source, "user_confirmed");
  assert.equal(calculated.json().analysisContext.dayStem, "jia");

  await app.close();
});
