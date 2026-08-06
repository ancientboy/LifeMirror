import assert from "node:assert/strict";
import test from "node:test";
import { calculateAstrology } from "./core.js";
import { buildAspectInsights, buildLifeDomainInsights, buildPlanetInsights } from "./interpretation.js";

test("each planet explanation is bound to its own calculated position", () => {
  const result = calculateAstrology({ year: 2000, month: 1, day: 1, hour: 12, minute: 0, utcOffsetMinutes: 0, latitude: 51.5074, longitude: -0.1278 });
  const insights = buildPlanetInsights(result.planets);
  assert.equal(insights.length, result.planets.length);
  for (const planet of result.planets) {
    const insight = insights.find((item) => item.key === planet.key);
    assert.ok(insight, `${planet.name} needs an explanation`);
    assert.match(insight.evidence, new RegExp(planet.name));
    assert.match(insight.evidence, new RegExp(planet.sign.name));
    if (planet.house) assert.match(insight.evidence, new RegExp(`第 ${planet.house} 宫`));
    assert.ok(insight.principle.length > 20, `${planet.name} needs a substantive traditional principle`);
    assert.match(insight.signReading, new RegExp(planet.sign.name));
    assert.ok(insight.synthesis.includes(planet.name), `${planet.name} synthesis must remain bound to the same planet`);
    if (planet.house) assert.match(insight.houseReading, new RegExp(`第 ${planet.house} 宫`));
  }
});

test("aspect readings retain their calculated pair and a practical reading rule", () => {
  const result = calculateAstrology({ year: 2000, month: 1, day: 1, hour: 12, minute: 0, utcOffsetMinutes: 0, latitude: 51.5074, longitude: -0.1278 });
  const insights = buildAspectInsights(result.aspects);
  assert.equal(insights.length, result.aspects.length);
  for (const aspect of result.aspects) {
    const insight = insights.find((item) => item.key === aspect.key);
    assert.ok(insight, `${aspect.key} needs an explanation`);
    assert.match(insight.evidence, new RegExp(aspect.first));
    assert.match(insight.evidence, new RegExp(aspect.second));
    assert.match(insight.evidence, new RegExp(aspect.name));
    assert.ok(insight.practice.length > 15);
  }
});

test("planet reading removes a duplicated planet prefix from legacy sign data", () => {
  const result = calculateAstrology({ year: 2000, month: 1, day: 1, hour: 12, minute: 0, utcOffsetMinutes: 0, latitude: 51.5074, longitude: -0.1278 });
  const venus = result.planets.find((planet) => planet.key === "venus")!;
  const insight = buildPlanetInsights([{ ...venus, sign: { ...venus.sign, name: `${venus.name}${venus.sign.name}` } }])[0]!;
  assert.match(insight.evidence, new RegExp(`${venus.name} ${venus.sign.name}`));
  assert.doesNotMatch(insight.evidence, new RegExp(`${venus.name}${venus.name}`));
});

test("life-domain reading is a fixed six-part synthesis of the calculated chart", () => {
  const result = calculateAstrology({ year: 2000, month: 1, day: 1, hour: 12, minute: 0, utcOffsetMinutes: 0, latitude: 51.5074, longitude: -0.1278 });
  const insights = buildLifeDomainInsights(result);
  assert.deepEqual(insights.map((item) => item.key), ["self", "emotions", "love", "career", "value", "belonging"]);
  assert.ok(insights.every((item) => item.reading.length > 80 && item.evidence.length > 0 && item.reflection.length > 15));
  assert.match(insights.find((item) => item.key === "self")!.reading, new RegExp(result.planets[0].sign.name));
  assert.match(insights.find((item) => item.key === "emotions")!.evidence.join(" "), /月亮/);
  assert.match(insights.find((item) => item.key === "love")!.evidence.join(" "), /金星/);
});

test("life-domain reading never invents houses or axes when birth time is unknown", () => {
  const result = calculateAstrology({ year: 2000, month: 1, day: 1, hour: null, minute: 0, utcOffsetMinutes: 0, latitude: 51.5074, longitude: -0.1278 });
  const text = buildLifeDomainInsights(result).flatMap((item) => [item.reading, ...item.evidence]).join(" ");
  assert.match(text, /出生时间未知|出生时间未提供/);
  assert.doesNotMatch(text, /上升.*：整宫制/);
});
