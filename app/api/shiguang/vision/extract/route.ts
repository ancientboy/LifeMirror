import { z } from "zod";

export const runtime = "nodejs";

const extractedSchema = z.object({
  pages: z.array(z.object({
    order: z.number().int().min(0),
    messages: z.array(z.object({ speaker: z.enum(["user", "other", "unknown"]), text: z.string().max(2_000), visibleTime: z.string().max(80).optional(), signals: z.array(z.string().max(80)).max(8).optional(), uncertain: z.boolean().optional() })).max(80),
  })).max(3),
  inferredUserSide: z.enum(["left", "right", "mixed", "unknown"]),
  missingRegions: z.array(z.string().max(160)).max(10), warnings: z.array(z.string().max(160)).max(10),
});

function extractJson(text: string) {
  const source = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  return JSON.parse(source.slice(source.indexOf("{"), source.lastIndexOf("}") + 1));
}

export async function POST(request: Request) {
  if (process.env.VISION_INPUT_ENABLED === "false") return Response.json({ error: "vision_disabled" }, { status: 503 });
  const form = await request.formData().catch(() => null);
  if (!form) return Response.json({ error: "invalid_vision_request" }, { status: 400 });
  const images = form.getAll("images").filter((item): item is File => item instanceof File);
  if (!images.length || images.length > 3) return Response.json({ error: "invalid_image_count" }, { status: 400 });
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (images.some((image) => !allowed.has(image.type) || image.size > 1_200_000) || images.reduce((sum, image) => sum + image.size, 0) > 3_200_000) return Response.json({ error: "invalid_image" }, { status: 400 });
  const apiKey = process.env.VISION_API_KEY || process.env.LLM_FALLBACK_API_KEY;
  const baseUrl = (process.env.VISION_BASE_URL || process.env.LLM_FALLBACK_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
  const model = process.env.VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
  if (!apiKey) return Response.json({ error: "vision_not_configured" }, { status: 503 });
  const imageBlocks = await Promise.all(images.map(async (image) => ({ type: "image_url", image_url: { url: `data:${image.type};base64,${Buffer.from(await image.arrayBuffer()).toString("base64")}` } })));
  const prompt = `按图片顺序提取聊天截图中肉眼可见的对话。只做转录和版面识别，不推断任何人的动机、人格或关系结论。尽量区分用户与 TA；无法判断就写 unknown。保留可见时间以及“已读、撤回、转账、表情”等画面信号；看不清的文字不要猜。只返回 JSON：{pages:[{order,messages:[{speaker,text,visibleTime?,signals?,uncertain?}]}],inferredUserSide:"left|right|mixed|unknown",missingRegions:[],warnings:[]}。`;
  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ model, temperature: 0, max_tokens: 2400, response_format: { type: "json_object" }, messages: [{ role: "user", content: [{ type: "text", text: prompt }, ...imageBlocks] }] }), signal: AbortSignal.timeout(45_000) });
    if (!upstream.ok) throw new Error("vision_upstream_failed");
    const payload = await upstream.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = extractedSchema.parse(extractJson(payload.choices?.[0]?.message?.content ?? ""));
    const ids = images.map(() => crypto.randomUUID());
    return Response.json({ conversation: { ...parsed, pages: parsed.pages.map((page, index) => ({ ...page, attachmentId: ids[index], order: index })) }, attachmentIds: ids }, { headers: { "cache-control": "no-store" } });
  } catch { return Response.json({ error: "vision_parse_failed" }, { status: 502 }); }
}
