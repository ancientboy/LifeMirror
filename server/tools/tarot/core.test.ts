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
  assert.ok(TAROT_DECK.every((card) => card.provenance.sourceEdition === "The Pictorial Key to the Tarot (1910)"));
  assert.equal(new Set(TAROT_DECK.map((card) => card.provenance.sourceLocator)).size, 78);
  assert.ok(TAROT_DECK.every((card) => card.provenance.interpretationVersion === "tarot-rws-reference/1.1"));
  assert.match(TAROT_DECK.find((card) => card.id === "cups-five")?.upright ?? "", /失落/);
  assert.match(TAROT_DECK.find((card) => card.id === "swords-seven")?.reversed ?? "", /隐瞒暴露/);
  assert.notEqual(TAROT_DECK.find((card) => card.id === "wands-two")?.upright, TAROT_DECK.find((card) => card.id === "cups-two")?.upright);
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
  assert.equal(typeof relation.interaction, "string");
});

test("professional synthesis is fixed-rule based and exposes its sources", () => {
  const spread = getSpread("timeline");
  const cards = drawSpread(spread, [0, 1, 2, 0, 1, 0]);
  const reading = synthesizeTarotReading("我要不要换工作？", spread, cards);
  assert.equal(reading.cardInsights.length, 3);
  assert.match(reading.cardInsights[0].evidence, /大阿尔卡那|元素/);
  assert.ok(reading.sources.length >= 2);
  assert.match(reading.method, /固定规则库/);
  assert.match(reading.method, /Rider–Waite–Smith/);
  assert.equal(reading.structure.questionDomain, "career");
  assert.match(reading.structure.positionLogic, /形成背景/);
  assert.ok(reading.structure.dominantCard.title.length > 0);
});

test("tarot reading uses spread-specific logic instead of treating all questions alike", () => {
  const spread = getSpread("relationship");
  const cards = drawSpread(spread, [0, 1, 2, 0, 1, 0]);
  const reading = synthesizeTarotReading("这段关系该不该联系？", spread, cards);
  assert.equal(reading.structure.questionDomain, "relationship");
  assert.match(reading.structure.positionLogic, /分开看你、对方/);
  assert.match(reading.structure.positionLogic, /互动|关系/);
});
