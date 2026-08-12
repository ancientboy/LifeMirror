import { z } from "zod";
import { filterRelationshipReplies } from "@/lib/relationships/reply";
import type { RelationshipReplyOption } from "@/lib/relationships/types";

export const runtime = "nodejs";

const messageSchema = z.object({ speaker: z.enum(["user", "other", "unknown"]), text: z.string().trim().min(1).max(1_000), visibleTime: z.string().max(80).optional() });
const requestSchema = z.object({
  userNote: z.string().max(2_000).default(""),
  analysis: z.string().max(4_000).default(""),
  context: z.string().max(10_000).default(""),
  messages: z.array(messageSchema).max(80),
});
const responseSchema = z.object({
  options: z.array(z.object({ id: z.string().max(40), tone: z.enum(["natural", "warm", "direct", "boundary"]), text: z.string().trim().min(1).max(180), why: z.string().max(300) })).min(1).max(4),
  recommendedReplyId: z.string().max(40).optional(),
});

function contentText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.map((item) => item && typeof item === "object" && typeof (item as { text?: unknown }).text === "string" ? (item as { text: string }).text : "").join("");
}

function extractJson(text: string) {
  const source = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  return JSON.parse(source.slice(source.indexOf("{"), source.lastIndexOf("}") + 1));
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (!parsed.data.userNote.trim() && !parsed.data.messages.length)) return Response.json({ error: "invalid_relationship_reply_request" }, { status: 400 });
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  const baseUrl = (process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
  if (!apiKey || !model) return Response.json({ error: "shiguang_model_unavailable" }, { status: 503 });
  const transcript = parsed.data.messages.map((message) => `${message.speaker === "user" ? "用户" : message.speaker === "other" ? "TA" : "画面提示／待确认"}：${message.text}`).join("\n");
  const system = `你是关系聊天回复生成器。只生成用户接下来可以发给 TA 的新消息，不做关系分析，也不解释截图。\n规则：\n- 用户是右侧气泡，TA 是左侧气泡；不得交换说话人。\n- 不得照抄或改写成 TA 已经发过的句子。\n- 不得出现“这句是谁说的、你问的吗、我以为、截图、识别、左边、右边”等内部核对话术。\n- 第三人称名字、数字或昵称只按原句语法理解；不要擅自把第三人当成聊天参与者。\n- 回复必须能直接发给 TA，承接最后一轮语境，简短自然，不操控、不逼问。\n- 给 1～3 个确实不同的选择。只返回 JSON：{options:[{id,tone:"natural|warm|direct|boundary",text,why}],recommendedReplyId}。\n\n<person_memory>\n${parsed.data.context || "无"}\n</person_memory>\n<current_analysis>\n${parsed.data.analysis || "无"}\n</current_analysis>\n<user_note>\n${parsed.data.userNote || "无"}\n</user_note>\n<visible_transcript>\n${transcript}\n</visible_transcript>`;
  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ model, temperature: .55, max_tokens: 650, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: "生成接下来可发送的回复。" }] }), signal: AbortSignal.timeout(45_000) });
    if (!upstream.ok) throw new Error("model_unavailable");
    const payload = await upstream.json() as { choices?: Array<{ message?: { content?: unknown } }> };
    const value = responseSchema.parse(extractJson(contentText(payload.choices?.[0]?.message?.content)));
    const options = filterRelationshipReplies(value.options as RelationshipReplyOption[], parsed.data.messages);
    if (!options.length) return Response.json({ options: [] }, { headers: { "cache-control": "no-store" } });
    const recommendedReplyId = options.some((option) => option.id === value.recommendedReplyId) ? value.recommendedReplyId : options[0].id;
    return Response.json({ options, recommendedReplyId }, { headers: { "cache-control": "no-store" } });
  } catch { return Response.json({ error: "relationship_reply_failed" }, { status: 502 }); }
}
