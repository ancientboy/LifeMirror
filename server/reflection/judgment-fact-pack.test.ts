import assert from "node:assert/strict";
import test from "node:test";
import { buildJudgmentFactPack, hasOnlyKnownFactIds, isJudgmentFactPack } from "./judgment.js";

test("judgment fact packs preserve only computed fact lines and a clear boundary", () => {
  const pack = buildJudgmentFactPack("tarot", "现状：权杖二正位\n阻力：圣杯五逆位\n行动：星币侍从正位");
  assert.equal(pack.kind, "tarot");
  assert.equal(pack.facts.length, 3);
  assert.equal(pack.facts[0]?.id, "fact_1");
  assert.equal(isJudgmentFactPack(pack), true);
  assert.match(pack.boundary, /牌面/u);
});

test("an LLM result cannot cite fact ids that were not in this reading", () => {
  const pack = buildJudgmentFactPack("astrology", "太阳位于狮子座\n月亮位于金牛座");
  assert.equal(hasOnlyKnownFactIds(["fact_1"], pack), true);
  assert.equal(hasOnlyKnownFactIds(["fact_9"], pack), false);
  assert.equal(hasOnlyKnownFactIds([], pack), false);
});
