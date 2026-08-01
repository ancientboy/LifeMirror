import assert from "node:assert/strict";
import test from "node:test";
import { calculateLiuyao } from "../tools/liuyao/engine.js";
import type { CoinToss } from "../tools/liuyao/types.js";
import { LIUYAO_KNOWLEDGE } from "./liuyao-pack.js";
import { ZHOUYI_CLASSICS } from "./zhouyi-classics.js";
import { retrieveLiuyaoKnowledge } from "./liuyao-retrieval.js";

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
