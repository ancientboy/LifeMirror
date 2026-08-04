import { cp, mkdir, rm, writeFile } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/server", { recursive: true });
await mkdir("dist/client", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await cp("out", "dist/client", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");

const worker = `
function indexPath(pathname) {
  if (pathname.endsWith("/")) return pathname + "index.html";
  if (!pathname.split("/").pop()?.includes(".")) return pathname + "/index.html";
  return pathname;
}

async function shiguang(request, env) {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!env.LLM_API_KEY || !env.LLM_MODEL) return Response.json({ error: "llm_not_configured" }, { status: 503 });
  let input;
  try { input = await request.json(); } catch { return Response.json({ error: "invalid_chat_input" }, { status: 400 }); }
  if (!input || !["east", "west"].includes(input.theme) || typeof input.context !== "string" || input.context.length > 12000 || !Array.isArray(input.messages) || input.messages.length < 1 || input.messages.length > 16) {
    return Response.json({ error: "invalid_chat_input" }, { status: 400 });
  }
  const messages = input.messages.filter((item) => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string" && item.content.length <= 2000);
  if (messages.length !== input.messages.length) return Response.json({ error: "invalid_chat_input" }, { status: 400 });
  const baseUrl = String(env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\\/$/, "");
  const upstream = await fetch(baseUrl + "/chat/completions", {
    method: "POST",
    headers: { authorization: "Bearer " + env.LLM_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      model: env.LLM_MODEL, stream: true, temperature: 0.65,
      messages: [{ role: "system", content: "你是 LifeMirror 的拾光，一位温柔、安静、真诚、有洞察的长期陪伴者。你不是客服、算命先生或心理报告生成器。请像熟悉用户处境的真人一样自然接话：先回应这一次用户实际说的内容与情绪，不复述整句，不用‘我听见你’作为固定开头；再根据需要追问、澄清或给一个小而可撤回的建议。只有当前结果上下文确实相关时才引用盘面证据，并明确区分事实、象征解释与待验证假设。不要每一轮都总结、推荐工具或强行用问题收尾；允许简短回应、承接上一轮和自然停顿。禁止宿命论、确定性预测、空泛鸡汤，以及医疗、法律、财务替代建议。文化表达：" + (input.theme === "east" ? "克制自然的东方语感" : "温暖清晰的西方象征语感") + "。本次上下文：" + input.context }, ...messages],
    }),
  });
  if (!upstream.ok || !upstream.body) return Response.json({ error: "llm_upstream_failed" }, { status: 502 });
  const decoder = new TextDecoder(), encoder = new TextEncoder();
  const stream = new ReadableStream({ async start(controller) {
    const reader = upstream.body.getReader(); let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\\n"); buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
          try { const text = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content; if (typeof text === "string") controller.enqueue(encoder.encode(text)); } catch {}
        }
      }
    } finally { controller.close(); }
  }});
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    if (requestUrl.pathname === "/api/shiguang") return shiguang(request, env);
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;

    const url = requestUrl;
    url.pathname = indexPath(url.pathname);
    return env.ASSETS.fetch(new Request(url, request));
  },
};
`;

await writeFile("dist/server/index.js", worker.trimStart());
