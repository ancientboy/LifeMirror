import type { LiuyaoResult } from "../tools/liuyao/types.js";
import { LINE_POSITION_MEANINGS, LIUYAO_KNOWLEDGE } from "./liuyao-pack.js";

export type LiuyaoKnowledgeContext = {
  source: "KNOWLEDGE-003";
  framing: string;
  original: NonNullable<ReturnType<typeof LIUYAO_KNOWLEDGE.get>>;
  changed: NonNullable<ReturnType<typeof LIUYAO_KNOWLEDGE.get>>;
  movingLineMeanings: string[];
};

export function retrieveLiuyaoKnowledge(result: LiuyaoResult): LiuyaoKnowledgeContext {
  const original = LIUYAO_KNOWLEDGE.get(result.originalHexagram.number);
  const changed = LIUYAO_KNOWLEDGE.get(result.changedHexagram.number);
  if (!original || !changed) throw new Error("Liuyao knowledge is incomplete");

  return {
    source: "KNOWLEDGE-003",
    framing: "卦象提供的是一种象征性观察视角，不是确定性预测，也不替用户做决定。",
    original,
    changed,
    movingLineMeanings: result.movingLines.map((position) => LINE_POSITION_MEANINGS[position - 1]),
  };
}
