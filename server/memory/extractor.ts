import type { ExtractedMemory, MemorySourceEvent } from "./types.js";

const topics = [
  { key: "career", title: "职业与方向", words: ["工作", "职业", "事业", "创业", "方向", "career", "business"] },
  { key: "relationship", title: "关系与连接", words: ["关系", "伴侣", "朋友", "家人", "感情", "relationship", "family"] },
  { key: "decision", title: "选择与决定", words: ["选择", "决定", "应该", "是否", "抉择", "decision", "choose"] },
  { key: "growth", title: "成长与改变", words: ["成长", "改变", "开始", "突破", "习惯", "growth", "change"] },
  { key: "emotion", title: "感受与内在", words: ["感受", "焦虑", "压力", "害怕", "情绪", "emotion", "stress"] },
] as const;

export function classifyMemoryTopic(text: string): { key: string; title: string } {
  const normalized = text.toLowerCase();
  const scored = topics
    .map((topic) => ({ ...topic, score: topic.words.filter((word) => normalized.includes(word)).length }))
    .sort((left, right) => right.score - left.score);
  return scored[0].score > 0 ? scored[0] : { key: "general", title: "当下的探索" };
}

export function extractMemory(source: MemorySourceEvent): ExtractedMemory {
  const topic = classifyMemoryTopic([
    source.question,
    source.reflection.observation,
    source.reflection.insight,
  ].join(" "));
  const concepts = Array.from(new Set([
    topic.key,
    ...source.knowledge_context.original.symbolicConcepts,
    ...source.knowledge_context.changed.symbolicConcepts,
  ].map((value) => value.trim()).filter(Boolean))).slice(0, 12);

  return {
    event: {
      title: topic.title,
      topic: topic.key,
      triggerText: source.question,
      summary: `围绕“${source.question}”完成了一次 Daily Mirror，并从${source.hexagram_result.originalHexagram.name}卦观察到${source.hexagram_result.changedHexagram.name}卦的变化。`,
    },
    reflection: {
      ...source.reflection,
      concepts,
    },
  };
}
