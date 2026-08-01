import assert from "node:assert/strict";
import test from "node:test";
import type { AppConfig } from "../config.js";
import { createLlmProvider } from "./provider.js";

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
