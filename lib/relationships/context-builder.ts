import { relationshipPromptContext } from "./policy.js";
import type { RelationshipCase, RelationshipClassification, RelationshipMemoryContext, RelationshipPerson } from "./types.js";

export function buildRelationshipContext(input: { classification: RelationshipClassification; person?: RelationshipPerson; activeCase?: RelationshipCase; recentCases?: RelationshipCase[]; memory?: RelationshipMemoryContext }) {
  const person = input.person ? `当前人物：${input.person.displayName}（${input.person.relationshipLabel || input.person.role}）` : "当前未关联具体人物。";
  const active = input.activeCase ? `上次未完成：${input.activeCase.summary || "有一件事正在等待现实回应"}` : "没有明确未完成事件。";
  const recent = (input.memory?.recentCases ?? input.recentCases ?? []).slice(0, 5).map((item) => `- ${item.summary || item.goal}：${item.status}`).join("\n") || "暂无同一人物近期案例。";
  const messages = (input.memory?.extractedMessages ?? []).slice(-24).map((item) => `- ${item.speaker === "user" ? "用户" : item.speaker === "other" ? "TA" : "画面提示／待确认"}：${item.text}`).join("\n") || "暂无已保存的截图对话文字。";
  const analyses = (input.memory?.priorAnalyses ?? []).slice(0, 3).map((item) => `- ${item.summary}`).join("\n") || "暂无过往分析。";
  const feedback = (input.memory?.realityFeedback ?? []).slice(0, 5).map((item) => `- ${item.outcome}（${item.acted ? "采用过建议" : "未采用建议"}）${item.note ? `：${item.note}` : ""}`).join("\n") || "暂无现实结果反馈。";
  return `${relationshipPromptContext(input.classification)}\n${person}\n${active}\n同一人物近期案例：\n${recent}\n同一人物已提取对话（画面证据，可被用户纠正）：\n${messages}\n过往分析（仅是当时假设，不是事实）：\n${analyses}\n后来发生的现实反馈（优先用于校准判断）：\n${feedback}`;
}
