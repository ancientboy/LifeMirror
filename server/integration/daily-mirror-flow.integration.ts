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
  const runtimeInputs: Array<Record<string, unknown>> = [];
  const llm: LlmProvider = {
    name: "integration-fixture",
    async generate(request) {
      const userMessage = request.messages.find((message) => message.role === "user");
      runtimeInputs.push(JSON.parse(userMessage?.content ?? "{}") as Record<string, unknown>);
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
    assert.equal(calculation.json().knowledge.original.classical.judgment, "元亨利贞。");
    assert.equal(calculation.json().knowledge.original.classical.lines.length, 7);
    assert.equal(calculation.json().knowledge.source, "KNOWLEDGE-003");

    const generated = await app.inject({
      method: "POST",
      url: "/api/v1/daily-mirror/reflections",
      headers: { cookie },
      payload: { question: "我应该如何开始新的工作方向？", tosses },
    });
    assert.equal(generated.statusCode, 200);
    assert.ok(generated.json().draftToken);
    assert.deepEqual((runtimeInputs[0].personalContext as { recentEvents: unknown[] }).recentEvents, []);

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

    const firstMemories = await app.inject({
      method: "GET",
      url: "/api/v1/memories",
      headers: { cookie },
    });
    assert.equal(firstMemories.statusCode, 200);
    assert.equal(firstMemories.json().events.length, 1);
    assert.equal(firstMemories.json().reflections.length, 1);
    assert.equal(firstMemories.json().patterns.length, 0);
    assert.equal(firstMemories.json().events[0].topic, "career");

    const secondGenerated = await app.inject({
      method: "POST",
      url: "/api/v1/daily-mirror/reflections",
      headers: { cookie },
      payload: { question: "新的工作方向里，我该先验证什么？", tosses },
    });
    assert.equal((runtimeInputs[1].personalContext as { recentEvents: unknown[] }).recentEvents.length, 1);
    const secondSaved = await app.inject({
      method: "POST",
      url: "/api/v1/daily-mirror/reflections/save",
      headers: { cookie },
      payload: { draftToken: secondGenerated.json().draftToken },
    });
    assert.equal(secondSaved.statusCode, 201);
    assert.equal(secondSaved.json().event.memoryProcessing, "completed");

    const memorySummary = await app.inject({
      method: "GET",
      url: "/api/v1/memories/summary",
      headers: { cookie },
    });
    assert.equal(memorySummary.statusCode, 200);
    assert.equal(memorySummary.json().counts.events, 2);
    assert.ok(memorySummary.json().counts.patterns >= 1);
    assert.equal(memorySummary.json().mirrorDna, null);

    const context = await app.inject({
      method: "GET",
      url: "/api/v1/memories/context?q=工作",
      headers: { cookie },
    });
    assert.equal(context.statusCode, 200);
    assert.equal(context.json().memories.length, 2);
    assert.equal(context.json().trainingData, false);

    const memories = await app.inject({ method: "GET", url: "/api/v1/memories", headers: { cookie } });
    const eventMemoryId = memories.json().events[0].id;
    const corrected = await app.inject({
      method: "PATCH",
      url: `/api/v1/memories/event/${eventMemoryId}`,
      headers: { cookie },
      payload: { title: "我确认的职业探索", visibility: "hidden" },
    });
    assert.equal(corrected.statusCode, 200);
    assert.equal(corrected.json().memory.userCorrected, true);

    const visibleAfterCorrection = await app.inject({ method: "GET", url: "/api/v1/memories", headers: { cookie } });
    assert.equal(visibleAfterCorrection.json().events.length, 1);
    const allAfterCorrection = await app.inject({ method: "GET", url: "/api/v1/memories?includeHidden=true", headers: { cookie } });
    assert.equal(allAfterCorrection.json().events.length, 2);

    const exported = await app.inject({ method: "GET", url: "/api/v1/memories/export", headers: { cookie } });
    assert.equal(exported.statusCode, 200);
    assert.equal(exported.json().ownership, "user");
    assert.equal(exported.json().trainingData, false);

    const deleted = await app.inject({
      method: "DELETE",
      url: `/api/v1/memories/source-events/${secondSaved.json().event.id}`,
      headers: { cookie },
    });
    assert.equal(deleted.statusCode, 204);
  } finally {
    await app.close();
    await database.query("DELETE FROM identity_users WHERE email = $1", [email]);
    await database.end();
  }
});
