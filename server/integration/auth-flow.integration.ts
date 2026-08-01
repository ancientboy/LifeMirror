import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../app.js";
import { loadConfig } from "../config.js";
import { createDatabase } from "../database/pool.js";
import { createLlmProvider } from "../llm/provider.js";

test("register, session and logout use server-side session state", async () => {
  const config = loadConfig({
    ...process.env,
    NODE_ENV: "test",
    LLM_PROVIDER: "disabled",
  });
  const database = createDatabase(config.DATABASE_URL);
  const app = await buildApp({ config, database, llm: createLlmProvider(config) });
  const email = `phase-001-${Date.now()}@example.com`;

  try {
    const register = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email, password: "foundation-password" },
    });
    assert.equal(register.statusCode, 201);

    const setCookie = register.headers["set-cookie"];
    const cookie = (Array.isArray(setCookie) ? setCookie[0] : setCookie)?.split(";")[0];
    assert.ok(cookie);
    assert.equal(cookie.includes("foundation-password"), false);

    const session = await app.inject({
      method: "GET",
      url: "/api/v1/auth/session",
      headers: { cookie },
    });
    assert.equal(session.statusCode, 200);
    assert.equal(session.json().authenticated, true);
    assert.equal(session.json().user.email, email);

    const logout = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      headers: { cookie },
    });
    assert.equal(logout.statusCode, 204);

    const expiredSession = await app.inject({
      method: "GET",
      url: "/api/v1/auth/session",
      headers: { cookie },
    });
    assert.equal(expiredSession.statusCode, 401);
  } finally {
    await app.close();
    await database.query("DELETE FROM identity_users WHERE email = $1", [email]);
    await database.end();
  }
});
