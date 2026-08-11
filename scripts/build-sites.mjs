Warning: truncated output (original token count: 23175)
Total output lines: 1184

import { cp, mkdir, rm, writeFile } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/server", { recursive: true });
await mkdir("dist/client", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await cp("out", "dist/client", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
await cp(".openai/drizzle", "dist/.openai/drizzle", { recursive: true });

const worker = String.raw`
const SESSION_COOKIE = "life_mirror_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const CODE_TTL_MS = 10 * 60 * 1000;

function indexPath(pathname) {
  if (pathname.endsWith("/")) return pathname + "index.html";
  if (!pathname.split("/").pop()?.includes(".")) return pathname + "/index.html";
  return pathname;
}

function json(value, status = 200, headers = {}) {
  return Response.json(value, { status, headers: { "cache-control": "no-store", ...headers } });
}

function validEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

async function body(request) {
  try { return await request.json(); } catch { return null; }
}

function contentText(value) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.map((item) => {
    if (typeof item === "string") return item;
    if (!item || typeof item !== "object") return "";
    if (typeof item.text === "string") return item.text;
    if (typeof item.output_text === "string") return item.output_text;
    return contentText(item.content);
  }).join("");
}

function modelText(payload) {
  if (!payload || typeof payload !== "object") return "";
  const choice = payload.choices?.[0];
  const candidates = [
    choice?.delta?.content,
    choice?.delta?.text,
    choice?.message?.content,
    choice?.text,
    payload.delta,
    payload.output_text,
    payload.response?.output_text,
    payloa…22175 tokens truncated…udgment, reasoningExplanation, shiguangInterpretation, practicalGuidance, evidenceCards, 可选 closing, 可选 reflectionQuestion, shareableReflection, shareCards。closing 若有，type 只能是 banter/follow_up/observation/reflection，另含 text。",
    deep ? "这是深度分析：明确主要信号、最强反向信号和条件边界。" : "这是清晰解读：简洁、具体、自然，不写学术报告。",
  ].join("\n");
  try {
    const generated = await completeWithFallback(env, {
        temperature: 0.58,
        max_tokens: 1900,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: "<traditional_context>\n" + encodedContext + "\n</traditional_context>" },
        ],
      }, { timeoutMs: 45_000 });
    const reflection = sanitizeReflection(extractJson(generated.text), context);
    if (!reflection) return json({ error: "invalid_liuyao_reflection" }, 502);
    return json({ reflection, generationMode: "ai", modelSource: generated.provider });
  } catch {
    return json({ error: "liuyao_reflection_failed" }, 502);
  }
}

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    if (requestUrl.pathname === "/api/shiguang") return shiguang(request, env);
    if (requestUrl.pathname === "/api/v1/liuyao/reflection") return liuyaoReflection(request, env);
    if (requestUrl.pathname.startsWith("/api/v1/auth/") || requestUrl.pathname.startsWith("/api/v1/account/")) return authApi(request, env, requestUrl.pathname);
    if (requestUrl.pathname.startsWith("/api/v1/social/")) return socialApi(request, env, requestUrl.pathname);
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;
    requestUrl.pathname = indexPath(requestUrl.pathname);
    return env.ASSETS.fetch(new Request(requestUrl, request));
  },
};
`;

await writeFile("dist/server/index.js", worker.trimStart());