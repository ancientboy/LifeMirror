import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

type ChatBubbleSide = "left" | "right" | "center" | "unknown";

const extractedSchema = z.object({
  pages: z.array(z.object({
    order: z.number().int().min(0),
    messages: z.array(z.object({
      side: z.enum(["left", "right", "center", "unknown"]),
      text: z.string().max(2_000),
      visibleTime: z.string().max(80).optional(),
      signals: z.array(z.string().max(80)).max(8).optional(),
      uncertain: z.boolean().optional(),
    })).max(80),
  })).max(3),
  missingRegions: z.array(z.string().max(160)).max(10),
  warnings: z.array(z.string().max(160)).max(10),
});

function extractJson(text: string) {
  const source = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  return JSON.parse(source.slice(source.indexOf("{"), source.lastIndexOf("}") + 1));
}

function speakerFromBubbleSide(side: ChatBubbleSide): "user" | "other" | "unknown" {
  if (side === "right") return "user";
  if (side === "left") return "other";
  return "unknown";
}

function inferredUserSideFromBubbles(sides: ChatBubbleSide[]): "right" | "unknown" {
  return sides.some((side) => side === "left" || side === "right") ? "right" : "unknown";
}

export async function registerVisionRoutes(app: FastifyInstance) {
  app.post("/api/shiguang/vision/extract", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    bodyLimit: 4 * 1024 * 1024,
  }, async (request, reply) => {
    reply.header("cache-control", "no-store");
    if (process.env.VISION_INPUT_ENABLED === "false") {
      return reply.code(503).send({ error: "vision_disabled" });
    }

    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    const images: Array<{ type: string; buffer: Buffer }> = [];
    let totalSize = 0;
    try {
      for await (const part of request.files()) {
        if (part.fieldname !== "images" || !allowed.has(part.mimetype)) {
          part.file.resume();
          return reply.code(400).send({ error: "invalid_image" });
        }
        const buffer = await part.toBuffer();
        totalSize += buffer.length;
        images.push({ type: part.mimetype, buffer });
        if (images.length > 3 || totalSize > 3_200_000) {
          return reply.code(400).send({ error: "invalid_image" });
        }
      }
    } catch {
      return reply.code(400).send({ error: "invalid_image" });
    }

    if (!images.length || images.length > 3) {
      return reply.code(400).send({ error: "invalid_image_count" });
    }

    const apiKey = process.env.VISION_API_KEY || process.env.LLM_FALLBACK_API_KEY;
    const baseUrl = (process.env.VISION_BASE_URL || process.env.LLM_FALLBACK_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
    const model = process.env.VISION_MODEL || "qwen/qwen3.6-27b";
    if (!apiKey) return reply.code(503).send({ error: "vision_not_configured" });

    const imageBlocks = images.map((image) => ({
      type: "image_url",
      image_url: { url: `data:${image.type};base64,${image.buffer.toString("base64")}` },
    }));
    const prompt = `按图片顺序提取聊天截图中肉眼可见的对话。每张输入图片必须且只能生成一页，pages 数量必须等于输入图片数量，不要重复页面。先只判断最外层聊天气泡的版面位置，不根据称呼、语气或文字含义猜说话人。位置规则固定：靠左气泡写 side="left"，靠右气泡写 side="right"，居中的时间、系统提示或通知写 side="center"，无法确定写 side="unknown"。每个最外层气泡只生成一条 message；引用、回复预览或转发卡片属于所在外层气泡，不要拆成另一位说话人的新消息。保留可见时间以及“已读、撤回、转账、表情”等画面信号；看不清的文字不要猜。不要输出 speaker 或推断人物动机。只返回 JSON：{pages:[{order,messages:[{side:"left|right|center|unknown",text,visibleTime?,signals?,uncertain?}]}],missingRegions:[],warnings:[]}。`;

    try {
      const upstream = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          model,
          temperature: 0,
          max_tokens: 2400,
          reasoning_effort: "none",
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: [{ type: "text", text: prompt }, ...imageBlocks] }],
        }),
        signal: AbortSignal.timeout(45_000),
      });
      if (upstream.status === 429) return reply.code(429).send({ error: "vision_rate_limited" });
      if (!upstream.ok) {
        request.log.warn({ statusCode: upstream.status }, "vision upstream request failed");
        return reply.code(502).send({ error: "vision_upstream_failed" });
      }
      const payload = await upstream.json() as { choices?: Array<{ message?: { content?: string } }> };
      const extracted = extractJson(payload.choices?.[0]?.message?.content ?? "") as { pages?: unknown[] };
      if (Array.isArray(extracted.pages)) extracted.pages = extracted.pages.slice(0, images.length);
      const parsed = extractedSchema.parse(extracted);
      const ids = images.map(() => randomUUID());
      const normalizedPages = parsed.pages.slice(0, images.length);
      const sides = normalizedPages.flatMap((page) => page.messages.map((message) => message.side));
      const pages = normalizedPages.map((page, index) => ({
        attachmentId: ids[index],
        order: index,
        messages: page.messages.map(({ side, ...message }) => ({ ...message, speaker: speakerFromBubbleSide(side) })),
      }));
      return reply.send({
        conversation: {
          pages,
          inferredUserSide: inferredUserSideFromBubbles(sides),
          missingRegions: parsed.missingRegions,
          warnings: parsed.warnings,
        },
        attachmentIds: ids,
      });
    } catch (error) {
      request.log.warn({ err: error }, "vision response parsing failed");
      return reply.code(502).send({ error: "vision_parse_failed" });
    }
  });
}
