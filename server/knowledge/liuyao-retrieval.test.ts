import assert from "node:assert/strict";
import test from "node:test";
import { calculateLiuyao } from "../tools/liuyao/engine.js";
import type { CoinToss } from "../tools/liuyao/types.js";
import { LIUYAO_KNOWLEDGE } from "./liuyao-pack.js";
import { ZHOUYI_CLASSICS } from "./zhouyi-classics.js";
import { retrieveLiuyaoKnowledge } from "./liuyao-retrieval.js";
import { retrieveLiuyaoReflectionKnowledge } from "./liuyao-reflection-map.js";

test("knowledge pack covers all 64 hexagrams", () => {
  assert.equal(LIUYAO_KNOWLEDGE.size, 64);
  assert.equal(ZHOUYI_CLASSICS.size, 64);
  for (let number = 1; number <= 64; number += 1) assert.ok(LIUYAO_KNOWLEDGE.has(number));
  let lineCount = 0;
  for (const knowledge of LIUYAO_KNOWLEDGE.values()) {
    assert.ok(knowledge.classical.judgment.length > 0);
    assert.ok(knowledge.classical.image.length > 0);
    assert.ok(knowledge.classical.lines.length >= 6);
    assert.ok(knowledge.classical.lines.every((line) => line.text.length > 0 && line.image.length > 0));
    lineCount += knowledge.classical.lines.length;
  }
  assert.equal(lineCount, 386);
});

test("reflection knowledge maps computed 官鬼旺 to human reflection without calculating", () => {
  const oldYang: CoinToss = [3, 3, 3];
  const hexagram = calculateLiuyao(Array(6).fill(oldYang), {
    topic: "career",
    monthBranch: "wu",
    dayStem: "wu",
    dayBranch: "shen",
  });
  const knowledge = retrieveLiuyaoKnowledge(hexagram);
  const reflectionKnowledge = retrieveLiuyaoReflectionKnowledge(hexagram, knowledge);
  assert.equal(reflectionKnowledge.source, "KNOWLEDGE-004");
  assert.match(reflectionKnowledge.boundary, /不计算卦象/);
  const officials = reflectionKnowledge.mappings.find((item) => item.id === "useful-god-officials");
  assert.equal(officials?.traditionalConcept, "官鬼为用");
  assert.match(officials?.humanMeaning ?? "", /责任、压力/);
  assert.ok((officials?.basis.length ?? 0) > 0);
  assert.ok(reflectionKnowledge.mappings.some((item) => item.id.startsWith("strength-")));
});

test("retrieval keeps traditional meaning and reflection framing separate", () => {
  const oldYang: CoinToss = [3, 3, 3];
  const result = retrieveLiuyaoKnowledge(calculateLiuyao(Array(6).fill(oldYang)));

  assert.equal(result.source, "KNOWLEDGE-003");
  assert.equal(result.original.name, "乾");
  assert.equal(result.changed.name, "坤");
  assert.equal(result.movingLines.length, 6);
  assert.equal(result.original.classical.judgment, "元亨利贞。");
  assert.equal(result.original.classical.lines[0].text, "潜龙，勿用。");
  assert.equal(result.readingRule.code, "six_moving_lines");
  assert.equal(result.original.symbolic.meaning, "主动创造与持续行动");
  assert.match(result.framing, /不是确定性预测/);
  assert.equal(result.ruleMeanings.usefulGod.label, "用神");
  assert.match(result.ruleMeanings.timing.boundary, /不承诺/);
});

test("moving-line retrieval returns the exact line text and image from KNOWLEDGE-003", () => {
  const oldYang: CoinToss = [3, 3, 3];
  const youngYang: CoinToss = [3, 2, 2];
  const knowledge = retrieveLiuyaoKnowledge(calculateLiuyao([oldYang, youngYang, youngYang, youngYang, youngYang, youngYang]));
  assert.equal(knowledge.movingLines.length, 1);
  assert.equal(knowledge.movingLines[0].name, "初九");
  assert.equal(knowledge.movingLines[0].text, "潜龙，勿用。");
  assert.match(knowledge.movingLines[0].image, /阳在下也/);
  assert.equal(knowledge.readingRule.focus[0].text, "潜龙，勿用。");
});
