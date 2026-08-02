import type { LiuyaoResult } from "../tools/liuyao/types.js";
import { LINE_POSITION_MEANINGS, LIUYAO_KNOWLEDGE, LIUYAO_RULE_MEANINGS } from "./liuyao-pack.js";

export type ReadingFocus = {
  hexagram: "original" | "changed";
  kind: "judgment" | "line";
  position?: number;
  label: string;
  text: string;
};

export type MovingLineKnowledge = {
  position: number;
  name: string;
  text: string;
  image: string;
  positionMeaning: string;
};

export type LiuyaoKnowledgeContext = {
  source: "KNOWLEDGE-003";
  framing: string;
  original: NonNullable<ReturnType<typeof LIUYAO_KNOWLEDGE.get>>;
  changed: NonNullable<ReturnType<typeof LIUYAO_KNOWLEDGE.get>>;
  movingLines: MovingLineKnowledge[];
  readingRule: {
    code: string;
    summary: string;
    focus: ReadingFocus[];
  };
  ruleMeanings: typeof LIUYAO_RULE_MEANINGS;
};

function lineFocus(hexagram: "original" | "changed", knowledge: NonNullable<ReturnType<typeof LIUYAO_KNOWLEDGE.get>>, position: number): ReadingFocus {
  const line = knowledge.classical.lines.find((item) => item.id === position);
  if (!line) throw new Error(`Missing line ${position} for hexagram ${knowledge.number}`);
  return { hexagram, kind: "line", position, label: `${knowledge.name}卦 · ${line.name}`, text: line.text };
}

function judgmentFocus(hexagram: "original" | "changed", knowledge: NonNullable<ReturnType<typeof LIUYAO_KNOWLEDGE.get>>): ReadingFocus {
  return { hexagram, kind: "judgment", label: `${knowledge.name}卦 · 卦辞`, text: knowledge.classical.judgment };
}

function buildReadingRule(result: LiuyaoResult, original: NonNullable<ReturnType<typeof LIUYAO_KNOWLEDGE.get>>, changed: NonNullable<ReturnType<typeof LIUYAO_KNOWLEDGE.get>>) {
  const moving = result.movingLines;
  const unchanged = [1, 2, 3, 4, 5, 6].filter((position) => !moving.includes(position));
  if (moving.length === 0) return { code: "no_moving_lines", summary: "六爻皆静，以本卦卦辞与大象为主要阅读依据。", focus: [judgmentFocus("original", original)] };
  if (moving.length === 1) return { code: "one_moving_line", summary: "一爻变，以本卦动爻爻辞为主要阅读依据。", focus: [lineFocus("original", original, moving[0])] };
  if (moving.length === 2) return { code: "two_moving_lines", summary: "二爻变，合看本卦两条动爻；上位动爻作为主要参照。", focus: [...moving].sort((a, b) => b - a).map((position) => lineFocus("original", original, position)) };
  if (moving.length === 3) return { code: "three_moving_lines", summary: "三爻变，合看本卦与变卦卦辞，以本卦说明当前结构、变卦说明变化方向。", focus: [judgmentFocus("original", original), judgmentFocus("changed", changed)] };
  if (moving.length === 4) return { code: "four_moving_lines", summary: "四爻变，参看变卦中两条不变爻；下位不变爻作为主要参照。", focus: [...unchanged].sort((a, b) => a - b).map((position) => lineFocus("changed", changed, position)) };
  if (moving.length === 5) return { code: "five_moving_lines", summary: "五爻变，以变卦中唯一不变爻的爻辞为主要参照。", focus: [lineFocus("changed", changed, unchanged[0])] };
  const useLine = original.classical.lines.find((line) => line.id === 7);
  return {
    code: "six_moving_lines",
    summary: useLine ? `六爻皆变，${original.name}卦采用${useLine.name}，并参看变卦卦辞。` : "六爻皆变，以变卦卦辞为主要参照。",
    focus: useLine
      ? [{ hexagram: "original" as const, kind: "line" as const, position: 7, label: `${original.name}卦 · ${useLine.name}`, text: useLine.text }, judgmentFocus("changed", changed)]
      : [judgmentFocus("changed", changed)],
  };
}

export function retrieveLiuyaoKnowledge(result: LiuyaoResult): LiuyaoKnowledgeContext {
  const original = LIUYAO_KNOWLEDGE.get(result.originalHexagram.number);
  const changed = LIUYAO_KNOWLEDGE.get(result.changedHexagram.number);
  if (!original || !changed) throw new Error("Liuyao knowledge is incomplete");

  return {
    source: "KNOWLEDGE-003",
    framing: "卦象提供的是一种象征性观察视角，不是确定性预测，也不替用户做决定。",
    original,
    changed,
    movingLines: result.movingLines.map((position) => {
      const line = original.classical.lines.find((item) => item.id === position);
      if (!line) throw new Error(`Missing moving line ${position} for hexagram ${original.number}`);
      return { position, name: line.name, text: line.text, image: line.image, positionMeaning: LINE_POSITION_MEANINGS[position - 1] };
    }),
    readingRule: buildReadingRule(result, original, changed),
    ruleMeanings: LIUYAO_RULE_MEANINGS,
  };
}
