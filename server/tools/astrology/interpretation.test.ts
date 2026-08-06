import assert from "node:assert/strict";
import test from "node:test";
import { calculateAstrology } from "./core.js";
import { buildPlanetInsights } from "./interpretation.js";

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
  }
});
