import { relationshipPromptContext } from "./policy";
import type { RelationshipCase, RelationshipClassification, RelationshipPerson } from "./types";

export function buildRelationshipContext(input: { classification: RelationshipClassification; person?: RelationshipPerson; activeCase?: RelationshipCase; recentCases?: RelationshipCase[] }) {
  const person = input.person ? `当前人物：${input.person.displayName}（${input.person.relationshipLabel || input.person.role}）` : "当前未关联具体人物。";
  const active = input.activeCase ? `上次未完成：${input.activeCase.summary || "有一件事正在等待现实回应"}` : "没有明确未完成事件。";
  const recent = (input.recentCases ?? []).slice(0, 3).map((item) => `- ${item.summary || item.goal}：${item.status}`).join("\n") || "暂无同一人物近期案例。";
  return `${relationshipPromptContext(input.classification)}\n${person}\n${active}\n同一人物近期现实记录：\n${recent}`;
}

