import assert from "node:assert/strict";
import test from "node:test";
import { calculateAstrology } from "./core.js";

const base = { year: 2000, month: 1, day: 1, hour: 12, minute: 0, utcOffsetMinutes: 0, latitude: 51.5074, longitude: -0.1278 };

test("calculates a reproducible tropical chart with ten planets", () => {
  const result = calculateAstrology(base);
  assert.equal(result.planets.length, 10);
  assert.equal(result.planets[0].name, "太阳");
  assert.equal(result.planets[0].sign.name, "摩羯座");
  assert.equal(result.angles.length, 2);
  assert.equal(result.houseCusps?.length, 12);
});

test("whole sign houses advance from the ascendant sign", () => {
  const result = calculateAstrology(base);
  const ascIndex = result.angles[0].sign.index;
  for (const planet of result.planets) assert.equal(planet.house, ((planet.sign.index - ascIndex + 12) % 12) + 1);
});

test("unknown time removes axes and houses instead of guessing", () => {
  const result = calculateAstrology({ ...base, hour: null });
  assert.equal(result.angles.length, 0);
  assert.equal(result.houseCusps, null);
  assert.ok(result.planets.every((planet) => planet.house === null));
  assert.match(result.warnings.join(" "), /不生成上升点/);
});

test("rejects impossible civil dates and coordinates", () => {
  assert.throws(() => calculateAstrology({ ...base, year: 2025, month: 2, day: 29 }), /有效的公历/);
  assert.throws(() => calculateAstrology({ ...base, latitude: 91 }), /经纬度/);
});

test("aspects are sorted by tightest orb", () => {
  const result = calculateAstrology(base);
  assert.ok(result.aspects.length > 0);
  assert.ok(result.aspects.every((aspect, index) => index === 0 || result.aspects[index - 1].orb <= aspect.orb));
});
