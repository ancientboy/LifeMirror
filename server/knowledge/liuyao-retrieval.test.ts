import assert from "node:assert/strict";
import test from "node:test";
import { calculateLiuyao } from "../tools/liuyao/engine.js";
import type { CoinToss } from "../tools/liuyao/types.js";
import { LIUYAO_KNOWLEDGE } from "./liuyao-pack.js";
import { retrieveLiuyaoKnowledge } from "./liuyao-retrieval.js";

test("knowledge pack covers all 64 hexagrams", () => {
  assert.equal(LIUYAO_KNOWLEDGE.size, 64);
  for (let number = 1; number <= 64; number += 1) assert.ok(LIUYAO_KNOWLEDGE.has(number));
});

test("retrieval keeps traditional meaning and reflection framing separate", () => {
  const oldYang: CoinToss = [3, 3, 3];
  const result = retrieveLiuyaoKnowledge(calculateLiuyao(Array(6).fill(oldYang)));

  assert.equal(result.source, "KNOWLEDGE-003");
  assert.equal(result.original.name, "乾");
  assert.equal(result.changed.name, "坤");
  assert.equal(result.movingLineMeanings.length, 6);
  assert.match(result.framing, /不是确定性预测/);
});
