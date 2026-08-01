import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../app.js";
import { loadConfig } from "../config.js";
import { createDatabase } from "../database/pool.js";
import type { LlmProvider } from "../llm/types.js";

test("authenticated user can generate, explicitly save and revisit a reflection event", async () => {
  const config = loadConfig({
    ...process.env,
    NODE_ENV: "test",
    LLM_PROVIDER: "disabled",
    REFLECTION_TOKEN_SECRET: "integration-reflection-secret-at-least-32-chars",
  });
  const database = createDatabase(config.DATABASE_URL);
  const llm: LlmProvider = {
    name: "integration-fixture",
    async generate() {
      return {
        text: JSON.stringify({
          observation: "你正在一个新阶段的起点观察自己的准备程度。",
          insight: "不确定并不等于不能前进，它也可能提示你需要更小的验证。",
          reflectionQuestion: "哪个未知最值得先被验证？",
          actionSuggestion: "在本周完成一个可撤回的小实验。",
        }),
        provider: "integration-fixture",
        model: "fixture-v1",
      };
    },
  };
  const app = await buildApp({ config, database, llm });
  const email = `phase-002-${Date.now()}@example.com`;

  try {
    const register = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email, password: "daily-mirror-password" },
    });
    assert.equal(register.statusCode, 201);
    const setCookie = register.headers["set-cookie"];
    const cookie = (Array.isArray(setCookie) ? setCookie[0] : setCookie)?.split(";")[0];
    assert.ok(cookie);

    const tosses = Array.from({ length: 6 }, () => [3, 2, 2]);
    const calculation = await app.inject({
      method: "POST",
      url: "/api/v1/tools/liuyao/calculate",
      payload: { tosses },
    });
    assert.equal(calculation.statusCode, 200);
    assert.equal(calculation.json().hexagram.originalHexagram.number, 1);
    assert.equal(calculation.json().knowledge.original.name, "乾");

    const generated = await app.inject({
      method: "POST",
      url: "/api/v1/daily-mirror/reflections",
      headers: { cookie },
      payload: { question: "我应该如何开始新的工作方向？", tosses },
    });
    assert.equal(generated.statusCode, 200);
    assert.ok(generated.json().draftToken);

    const beforeSave = await app.inject({
      method: "GET",
      url: "/api/v1/daily-mirror/reflections",
      headers: { cookie },
    });
    assert.equal(beforeSave.json().events.length, 0);

    const saved = await app.inject({
      method: "POST",
      url: "/api/v1/daily-mirror/reflections/save",
      headers: { cookie },
      payload: { draftToken: generated.json().draftToken },
    });
    assert.equal(saved.statusCode, 201);
    assert.ok(saved.json().event.id);

    const history = await app.inject({
      method: "GET",
      url: "/api/v1/daily-mirror/reflections",
      headers: { cookie },
    });
    assert.equal(history.statusCode, 200);
    assert.equal(history.json().events.length, 1);
    assert.equal(history.json().events[0].question, "我应该如何开始新的工作方向？");
    assert.equal(history.json().events[0].reflection.reflectionQuestion, "哪个未知最值得先被验证？");
  } finally {
    await app.close();
    await database.query("DELETE FROM identity_users WHERE email = $1", [email]);
    await database.end();
  }
});
