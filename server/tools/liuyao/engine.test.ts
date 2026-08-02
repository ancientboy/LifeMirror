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

test("existing tool now deterministically assembles palace, Shi/Ying, Najia, relations, spirits and void", () => {
  const toss: CoinToss = [3, 2, 2];
  const result = calculateLiuyao([toss, toss, toss, toss, toss, toss], {
    topic: "career", monthBranch: "wei", dayStem: "jia", dayBranch: "zi",
  });

  assert.equal(result.structure.palace, "qian");
  assert.equal(result.structure.palaceElement, "metal");
  assert.equal(result.structure.shi, 6);
  assert.equal(result.structure.ying, 3);
  assert.deepEqual(result.structure.sixRelations, ["offspring", "wealth", "parents", "officials", "siblings", "parents"]);
  assert.deepEqual(result.lines.map((line) => line.branch), ["zi", "yin", "chen", "wu", "shen", "xu"]);
  assert.equal(result.lines[0].spirit, "azure_dragon");
  assert.equal(result.lines[5].void, true);
  assert.deepEqual(result.structure.voidBranches, ["xu", "hai"]);
});

test("traditional analysis selects useful god and emits traceable evidence without an LLM", () => {
  const toss: CoinToss = [3, 2, 2];
  const result = calculateLiuyao([toss, toss, toss, toss, toss, toss], {
    topic: "career", monthBranch: "wei", dayStem: "jia", dayBranch: "zi",
  });

  assert.equal(result.analysis.status, "complete");
  assert.deepEqual(result.analysis.usefulGod, { relation: "officials", line: 4, hidden: false, flyingLine: null });
  assert.equal(result.analysis.strength?.level, "resting");
  assert.ok(result.analysis.timing?.candidates.length);
  assert.ok(result.evidence.some((item) => item.rule === "month_strength" && item.line === 4));
});

test("missing calendar/topic context never invites inferred traditional analysis", () => {
  const toss: CoinToss = [3, 2, 2];
  const result = calculateLiuyao([toss, toss, toss, toss, toss, toss]);
  assert.equal(result.analysis.status, "context_required");
  assert.equal(result.analysis.usefulGod, null);
  assert.deepEqual(result.analysis.missingContext, ["topic", "monthBranch", "dayStem", "dayBranch"]);
  assert.equal(result.lines.every((line) => line.spirit === null && line.void === null), true);
});
