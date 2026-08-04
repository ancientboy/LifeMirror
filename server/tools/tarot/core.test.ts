import assert from "node:assert/strict";
import test from "node:test";
import {
  TAROT_DECK,
  analyzeRelations,
  cardMeaning,
  drawSpread,
  drawThree,
  getSpread,
  synthesizeTarotReading,
} from "./core.js";

test("professional deck contains 22 major and 56 unique minor arcana", () => {
  assert.equal(TAROT_DECK.length, 78);
  assert.equal(TAROT_DECK.filter((card) => card.arcana === "major").length, 22);
  assert.equal(TAROT_DECK.filter((card) => card.arcana === "minor").length, 56);
  assert.equal(new Set(TAROT_DECK.map((card) => card.id)).size, 78);
});

test("all supported spreads draw the requested number of unique cards", () => {
  for (const id of ["single", "timeline", "relationship", "decision"] as const) {
    const spread = getSpread(id);
    const entropy = Array.from({ length: spread.positions.length * 2 }, (_, index) => index + 3);
    const cards = drawSpread(spread, entropy);
    assert.equal(cards.length, spread.positions.length);
    assert.equal(new Set(cards.map((card) => card.id)).size, cards.length);
    assert.deepEqual(cards.map((card) => card.position), spread.positions.map((position) => position.id));
  }
});

test("draw is deterministic, unique, and resolves orientations from supplied entropy", () => {
  const cards = drawThree([0, 0, 0, 0, 1, 0]);
  assert.deepEqual(
    cards.map((card) => card.id),
    ["major-0", "major-1", "major-2"],
  );
  assert.deepEqual(
    cards.map((card) => card.orientation),
    ["upright", "reversed", "upright"],
  );
  assert.equal(new Set(cards.map((card) => card.id)).size, 3);
  assert.match(cardMeaning(cards[1]), /忽略直觉|分心/);
});

test("relation analysis exposes emphasis and counter-signals without predicting outcomes", () => {
  const cards = drawThree([0, 0, 0, 1, 1, 0]);
  const relation = analyzeRelations(cards);
  assert.equal(relation.majorCount, 3);
  assert.equal(relation.reversedCount, 2);
  assert.match(relation.headline, /价值选择/);
  assert.match(relation.counterSignal, /内在节奏/);
});

test("professional synthesis separates evidence, interpretation, Shiguang reflection and action", () => {
  const spread = getSpread("timeline");
  const cards = drawSpread(spread, [0, 1, 2, 0, 1, 0]);
  const reading = synthesizeTarotReading("我要不要换工作？", spread, cards);
  assert.equal(reading.cardInsights.length, 3);
  assert.match(reading.cardInsights[0].evidence, /大阿尔卡那|元素/);
  assert.match(reading.shiguang, /拾光/);
  assert.match(reading.action, /24 小时/);
  assert.ok(reading.reflectionQuestion.endsWith("？"));
});
