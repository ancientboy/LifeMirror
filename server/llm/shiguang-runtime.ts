export type ShiguangPlan = {
  intent: "conversation" | "research";
  searchQuery?: string;
};

export type ShiguangSource = {
  title: string;
  url: string;
  publishedAt?: string;
  snippet?: string;
};

export type ResearchResult = { query: string; sources: ShiguangSource[] };

const planPrompt = `你是“拾光”的后台规划器。请根据完整对话判断这一轮是否必须先核对会变化的外部事实。

选择 research 的条件：用户明确想查询、核实、比较或获取可能已经变化的新闻、政策、价格、人物、地点、时间表、规则、产品或其他事实。不要因为用户谈到关系、情绪、人生选择、健康感受或象征性解读就搜索。

这不是关键词分类。必须结合整段对话、用户真正要解决的问题和事实是否有时效性判断。默认 conversation。不要因为“他是不是不喜欢我”这类关系困扰搜索网络。

只返回 JSON：{"intent":"conversation"|"research","searchQuery":"research 时才提供一句精确检索词"}。`;

function extractJson(source: string): Record<string, unknown> | null {
  const fenced = source.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? source;
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const value = JSON.parse(fenced.slice(start, end + 1));
    return value && typeof value === "object" ? value as Record<string, unknown> : null;
  } catch { return null; }
}

export function buildPlannerMessages(messages: Array<{ role: "user" | "assistant"; content: string }>) {
  return [{ role: "system" as const, content: planPrompt }, ...messages.slice(-10)];
}

/** A safe fallback deliberately does not use keyword routing. */
export function parseShiguangPlan(text: string): ShiguangPlan {
  const value = extractJson(text);
  if (value?.intent === "research" && typeof value.searchQuery === "string" && value.searchQuery.trim().length >= 2) return { intent: "research", searchQuery: value.searchQuery.trim().slice(0, 240) };
  return { intent: "conversation" };
}

export function normalizeResearchResult(query: string, payload: unknown): ResearchResult {
  const data = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const raw = Array.isArray(data.results) ? data.results : [];
  const sources = raw.slice(0, 5).flatMap((item): ShiguangSource[] => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (typeof row.url !== "string" || !/^https?:\/\//.test(row.url)) return [];
    return [{ title: typeof row.title === "string" && row.title.trim() ? row.title.trim().slice(0, 180) : new URL(row.url).hostname, url: row.url, publishedAt: typeof row.published_date === "string" ? row.published_date : undefined, snippet: typeof row.content === "string" ? row.content.replace(/\s+/g, " ").trim().slice(0, 700) : undefined }];
  });
  return { query, sources };
}

export function formatResearchContext(result: ResearchResult) {
  if (!result.sources.length) return "检索没有返回足够可靠的来源。请明确说明目前无法核实，不要补造答案。";
  return result.sources.map((source, index) => `${index + 1}. ${source.title}\nURL: ${source.url}${source.publishedAt ? `\n发布时间: ${source.publishedAt}` : ""}${source.snippet ? `\n摘要: ${source.snippet}` : ""}`).join("\n\n");
}
