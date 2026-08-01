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
    phase: "PHASE-001",
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
