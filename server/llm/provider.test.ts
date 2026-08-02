import assert from "node:assert/strict";
import test from "node:test";
import type { AppConfig } from "../config.js";
import { createLlmProvider } from "./provider.js";
import { OpenAiCompatibleProvider } from "./providers/openai-compatible.js";

const baseConfig: AppConfig = {
  NODE_ENV: "test",
  API_HOST: "127.0.0.1",
  API_PORT: 8787,
  WEB_ORIGIN: "http://localhost:4173",
  DATABASE_URL: "postgres://test:test@localhost/test",
  SESSION_COOKIE_NAME: "test_session",
  SESSION_TTL_DAYS: 1,
  SESSION_COOKIE_SAME_SITE: "strict",
  REFLECTION_TOKEN_SECRET: "test-reflection-secret-at-least-32-characters",
  LLM_PROVIDER: "disabled",
  LLM_BASE_URL: "https://api.openai.com/v1",
};

test("disabled provider fails closed", async () => {
  const provider = createLlmProvider(baseConfig);
  assert.equal(provider.name, "disabled");
  await assert.rejects(() => provider.generate({ messages: [] }), /disabled/);
});

test("configured provider is selected behind the shared interface", () => {
  const provider = createLlmProvider({
    ...baseConfig,
    LLM_PROVIDER: "openai-compatible",
    LLM_API_KEY: "test-key",
    LLM_MODEL: "test-model",
  });
  assert.equal(provider.name, "openai-compatible");
});

test("openai-compatible provider serializes strict JSON Schema output requests", async (context) => {
  const originalFetch = globalThis.fetch;
  let requestBody: Record<string, unknown> | undefined;
  globalThis.fetch = (async (_input, init) => {
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(JSON.stringify({ model: "test-model", choices: [{ message: { content: "{}" } }] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  context.after(() => { globalThis.fetch = originalFetch; });

  const provider = new OpenAiCompatibleProvider({ apiKey: "test-key", baseUrl: "https://api.openai.com/v1", model: "test-model" });
  await provider.generate({
    messages: [{ role: "user", content: "classify" }],
    responseFormat: { name: "intent", schema: { type: "object", properties: {}, additionalProperties: false }, strict: true },
  });

  assert.deepEqual(requestBody?.response_format, {
    type: "json_schema",
    json_schema: {
      name: "intent",
      schema: { type: "object", properties: {}, additionalProperties: false },
      strict: true,
    },
  });
});
