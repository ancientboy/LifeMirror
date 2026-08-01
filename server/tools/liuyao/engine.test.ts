import assert from "node:assert/strict";
import test from "node:test";
import { calculateLiuyao } from "./engine.js";
import type { CoinToss } from "./types.js";

test("six old-yang lines deterministically change Qian into Kun", () => {
  const toss: CoinToss = [3, 3, 3];
  const result = calculateLiuyao([toss, toss, toss, toss, toss, toss]);

  assert.equal(result.originalHexagram.number, 1);
  assert.equal(result.originalHexagram.name, "乾");
  assert.equal(result.changedHexagram.number, 2);
  assert.equal(result.changedHexagram.name, "坤");
  assert.deepEqual(result.movingLines, [1, 2, 3, 4, 5, 6]);
  assert.equal(result.lines.every((line) => line.value === 9 && line.moving), true);
});

test("line order is bottom-up and maps lower Zhen under upper Kan to Zhun", () => {
  const yang: CoinToss = [3, 2, 2];
  const yin: CoinToss = [2, 3, 3];
  const result = calculateLiuyao([yang, yin, yin, yin, yang, yin]);

  assert.equal(result.originalHexagram.number, 3);
  assert.equal(result.originalHexagram.name, "屯");
  assert.equal(result.originalHexagram.lowerTrigram.name, "震");
  assert.equal(result.originalHexagram.upperTrigram.name, "坎");
  assert.deepEqual(result.movingLines, []);
});

test("calculation rejects anything other than six valid three-coin tosses", () => {
  assert.throws(() => calculateLiuyao([]), /six coin tosses/);
  assert.throws(
    () => calculateLiuyao(Array.from({ length: 6 }, () => [2, 2, 4] as unknown as CoinToss)),
    /three coin values/,
  );
});

test("all 64 yin-yang structures map to 64 unique King Wen hexagrams", () => {
  const identities = new Set<number>();
  for (let mask = 0; mask < 64; mask += 1) {
    const tosses = Array.from({ length: 6 }, (_, position) =>
      ((mask >> position) & 1 ? [3, 2, 2] : [2, 3, 3]) as CoinToss,
    );
    identities.add(calculateLiuyao(tosses).originalHexagram.number);
  }
  assert.equal(identities.size, 64);
});
