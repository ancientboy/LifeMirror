import assert from "node:assert/strict";
import test from "node:test";
import { calculateBazi, relateBaziDay } from "./engine.js";

const base = { utcOffsetMinutes: 480, dayBoundary: "midnight" as const, useTrueSolarTime: false };

test("matches a published library fixture for all four pillars", () => {
  const result = calculateBazi({ ...base, year: 2005, month: 12, day: 23, hour: 8, minute: 37 });
  assert.deepEqual(result.pillars.map((item) => item?.ganZhi), ["乙酉", "戊子", "辛巳", "壬辰"]);
  assert.equal(result.pillars[2]?.stemTenGod, "日主");
});

test("changes the day pillar at late Zi when the selected school requires it", () => {
  const civil = calculateBazi({ ...base, year: 1988, month: 2, day: 15, hour: 23, minute: 30 });
  const lateZi = calculateBazi({ ...base, dayBoundary: "late-zi", year: 1988, month: 2, day: 15, hour: 23, minute: 30 });
  assert.equal(civil.pillars[2]?.ganZhi, "庚子");
  assert.equal(lateZi.pillars[2]?.ganZhi, "辛丑");
});

test("omits the time pillar when birth time is unknown", () => {
  const result = calculateBazi({ ...base, year: 1990, month: 1, day: 1, hour: null, minute: 0 });
  assert.equal(result.pillars[3], null);
  assert.match(result.warnings.join(" "), /时柱/);
});

test("validates impossible Gregorian dates", () => {
  assert.throws(() => calculateBazi({ ...base, year: 2025, month: 2, day: 29, hour: 12, minute: 0 }), /valid Gregorian/);
});

test("true solar correction is deterministic and disclosed", () => {
  const result = calculateBazi({ ...base, year: 2000, month: 1, day: 1, hour: 12, minute: 0, longitude: 121.47, useTrueSolarTime: true });
  assert.equal(typeof result.trueSolarAdjustmentMinutes, "number");
  assert.match(result.warnings.join(" "), /均时差/);
});

test("adds reproducible five-element, branch relation and luck-cycle layers", () => {
  const result = calculateBazi({ ...base, year: 1990, month: 1, day: 1, hour: 12, minute: 0, luckGender: "male" });
  const total = Object.values(result.fiveElementProfile.scores).reduce((sum, value) => sum + value, 0);
  assert.ok(Math.abs(total - 100) < 0.2);
  assert.match(result.fiveElementProfile.method, /初步旺衰/);
  assert.ok(result.luck);
  assert.equal(result.luck?.cycles.length, 8);
  assert.ok(result.luck?.annual.length);
  assert.ok(result.tenGodProfile.dominant.length);
  assert.equal(result.seasonalProfile.monthBranch, result.pillars[1]?.branch);
  assert.match(result.seasonalProfile.method, /月支主气/);
  assert.ok(result.luck?.cycles.every((cycle) => cycle.stemTenGod && cycle.branchTenGod));
  assert.ok(result.luck?.annual.every((annual) => Array.isArray(annual.branchRelations)));
});

test("does not fabricate luck-cycle start time when birth time is unknown", () => {
  const result = calculateBazi({ ...base, year: 1990, month: 1, day: 1, hour: null, minute: 0, luckGender: "female" });
  assert.equal(result.luck, null);
  assert.match(result.rules.join(" "), /出生时间未知/);
});

test("reports daily stem and branch structure without turning it into a verdict", () => {
  const natal = calculateBazi({ ...base, year: 2005, month: 12, day: 23, hour: 8, minute: 37 });
  const day = calculateBazi({ ...base, year: 2026, month: 8, day: 6, hour: 12, minute: 0 });
  const relation = relateBaziDay(natal, day);
  assert.equal(relation.dayPillar, day.pillars[2]?.ganZhi);
  assert.ok(relation.dayTenGod.length > 0);
  assert.match(relation.method, /不将单日关系直接断为吉凶/);
});
