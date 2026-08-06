import assert from "node:assert/strict";
import test from "node:test";
import { calculateAstrology } from "./core.js";
import { buildAspectInsights, buildPlanetInsights } from "./interpretation.js";

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
