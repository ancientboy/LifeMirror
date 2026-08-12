import { z } from "zod";
import { inferredUserSideFromBubbles, speakerFromBubbleSide } from "@/lib/relationships/vision";

export const runtime = "nodejs";

const extractedSchema = z.object({
  pages: z.array(z.object({
    order: z.number().int().min(0),
    messages: z.array(z.object({ side: z.enum(["left", "right", "center", "unknown"]), text: z.string().max(2_000), visibleTime: z.string().max(80).optional(), signals: z.array(z.string().max(80)).max(8).optional(), uncertain: z.boolean().optional() })).max(80),
  })).max(3),
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
  const model = process.env.VISION_MODEL || "qwen/qwen3.6-27b";
  if (!apiKey) return Response.json({ error: "vision_not_configured" }, { status: 503 });
  const imageBlocks = await Promise.all(images.map(async (image) => ({ type: "image_url", image_url: { url: `data:${image.type};base64,${Buffer.from(await image.arrayBuffer()).toString("base64")}` } })));
  const prompt = `按图片顺序提取聊天截图中肉眼可见的对话。先只判断最外层聊天气泡的版面位置，不根据称呼、语气或文字含义猜说话人。位置规则固定：靠左气泡写 side="left"，靠右气泡写 side="right"，居中的时间、系统提示或通知写 side="center"，无法确定写 side="unknown"。每个最外层气泡只生成一条 message；引用、回复预览或转发卡片属于所在外层气泡，不要拆成另一位说话人的新消息。保留可见时间以及“已读、撤回、转账、表情”等画面信号；看不清的文字不要猜。不要输出 speaker 或推断人物动机。只返回 JSON：{pages:[{order,messages:[{side:"left|right|center|unknown",text,visibleTime?,signals?,uncertain?}]}],missingRegions:[],warnings:[]}。`;
  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ model, temperature: 0, max_tokens: 2400, reasoning_effort: "none", response_format: { type: "json_object" }, messages: [{ role: "user", content: [{ type: "text", text: prompt }, ...imageBlocks] }] }), signal: AbortSignal.timeout(45_000) });
    if (upstream.status === 429) return Response.json({ error: "vision_rate_limited" }, { status: 429, headers: { "cache-control": "no-store" } });
    if (!upstream.ok) return Response.json({ error: "vision_upstream_failed" }, { status: 502, headers: { "cache-control": "no-store" } });
    const payload = await upstream.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = extractedSchema.parse(extractJson(payload.choices?.[0]?.message?.content ?? ""));
    const ids = images.map(() => crypto.randomUUID());
    const sides = parsed.pages.flatMap((page) => page.messages.map((message) => message.side));
    const pages = parsed.pages.map((page, index) => ({ attachmentId: ids[index], order: index, messages: page.messages.map(({ side, ...message }) => ({ ...message, speaker: speakerFromBubbleSide(side) })) }));
    return Response.json({ conversation: { pages, inferredUserSide: inferredUserSideFromBubbles(sides), missingRegions: parsed.missingRegions, warnings: parsed.warnings }, attachmentIds: ids }, { headers: { "cache-control": "no-store" } });
  } catch { return Response.json({ error: "vision_parse_failed" }, { status: 502 }); }
}
