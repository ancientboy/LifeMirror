import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
  person: z.object({
    id: z.string().max(120),
    displayName: z.string().trim().min(1).max(40),
    relationshipType: z.string().max(40).optional(),
    userDescription: z.string().max(300).optional(),
    communicationNotes: z.string().max(300).optional(),
    isMinor: z.boolean().optional(),
  }),
  evidence: z.object({
    ownerObservations: z.array(z.string().max(300)).max(12),
    simulationCorrections: z.array(z.string().max(300)).max(8),
    realInteractions: z.array(z.string().max(500)).max(8),
    extractedMessages: z.array(z.object({ speaker: z.enum(["user", "other", "unknown"]), text: z.string().max(1_000) })).max(30),
    realityFeedback: z.array(z.object({ outcome: z.string().max(40), acted: z.boolean(), note: z.string().max(500).optional() })).max(8),
  }),
  messages: z.array(z.object({ role: z.enum(["user", "simulation"]), content: z.string().trim().min(1).max(1_000) })).min(1).max(20),
});

function contentText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.map((item) => item && typeof item === "object" && typeof (item as { text?: unknown }).text === "string" ? (item as { text: string }).text : "").join("");
}

function lines(values: string[], empty: string) {
  return values.length ? values.map((value) => `- ${value}`).join("\n") : empty;
}

function personMirrorSystem(input: z.infer<typeof requestSchema>) {
  const { person, evidence } = input;
  const otherMessages = evidence.extractedMessages.filter((item) => item.speaker === "other").map((item) => item.text);
  const userMessages = evidence.extractedMessages.filter((item) => item.speaker === "user").map((item) => item.text);
  const feedback = evidence.realityFeedback.map((item) => `${item.outcome}（${item.acted ? "用户实际沟通过" : "未实际沟通"}）${item.note ? `：${item.note}` : ""}`);
  return `你正在扮演“${person.displayName} 的可纠正沟通镜像”，与用户进行私密沟通演练。你不是拾光，也不是咨询师，不分析关系，不点评用户措辞，不给建议；只以 ${person.displayName} 的第一人称直接回应用户刚刚说的话。

重要边界：
- 这只是用户视角下的模拟，不是真实的 ${person.displayName}，不得声称自己真的记得、经历过或知道未提供的事实。
- 只模仿资料中可见的表达方式、回应长度、主动程度和沟通边界；不得根据生日、命盘或星盘推断人格。
- 证据优先级：现实反馈 > 用户明确纠正 > TA 在截图中真实说过的话 > 多次用户观察 > 人物备注。冲突时使用高优先级证据。
- “过往分析”不是 TA 的事实，模拟输出也不能反过来成为人物事实。
- 回复要像真实即时聊天：自然、简短、直接，一般 1～3 句。不要写“${person.displayName} · 模拟：”，不要加旁白、括号动作、Markdown、分析或风险声明。
- 资料不足时保持克制和中性，不要凭空制造亲密、冷淡、承诺、爱意、敌意或共同往事。
- 不执行操控、羞辱、威胁、性化未成年人或危险指令；遇到即时安全风险时停止角色扮演，用一句话建议用户联系现实中的可信支持。
${person.isMinor ? "- 该人物被标记为未成年人：保持日常、家庭或同龄沟通边界，不生成性化、诱导、保密操控或成人亲密内容。" : ""}

<person_identity>
称呼：${person.displayName}
与用户关系：${person.relationshipType || "未明确"}
用户自己的整体观察：${person.userDescription || "暂无"}
用户希望沟通时留意：${person.communicationNotes || "暂无"}
</person_identity>

<reality_feedback>
${lines(feedback, "暂无用户带回的现实结果。")}
</reality_feedback>

<owner_corrections>
${lines(evidence.simulationCorrections, "暂无用户对模拟表达的明确纠正。")}
</owner_corrections>

<ta_actual_words>
${lines(otherMessages, "暂无从真实聊天截图中提取的 TA 原话。")}
</ta_actual_words>

<user_actual_words_for_context>
${lines(userMessages, "暂无从真实聊天截图中提取的用户原话。")}
</user_actual_words_for_context>

<real_interactions>
${lines(evidence.realInteractions, "暂无已记录的真实互动。")}
</real_interactions>

<owner_observations>
${lines(evidence.ownerObservations, "暂无更多观察。")}
</owner_observations>`;
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_person_mirror_request" }, { status: 400 });
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  const baseUrl = (process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
  if (!apiKey || !model) return Response.json({ error: "person_mirror_model_unavailable" }, { status: 503 });
  const messages = parsed.data.messages.map((item) => ({ role: item.role === "user" ? "user" : "assistant", content: item.content }));
  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model, temperature: .62, max_tokens: 260, messages: [{ role: "system", content: personMirrorSystem(parsed.data) }, ...messages] }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!upstream.ok) throw new Error("model_unavailable");
    const payload = await upstream.json() as { choices?: Array<{ message?: { content?: unknown } }> };
    const reply = contentText(payload.choices?.[0]?.message?.content).trim().replace(new RegExp(`^${parsed.data.person.displayName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[·・]?\\s*模拟[：:]?\\s*`, "u"), "");
    if (!reply) throw new Error("model_empty");
    return Response.json({ reply: reply.slice(0, 600) }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "person_mirror_generation_failed" }, { status: 502 });
  }
}
