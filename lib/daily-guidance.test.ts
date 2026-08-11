import assert from "node:assert/strict";
import test from "node:test";
import { buildDailyGuidanceContext, sanitizeDailyGuidance, type DailyBirthProfile, type DailyGuidance } from "./daily-guidance.js";

const profile = (overrides: Partial<DailyBirthProfile> = {}): DailyBirthProfile => ({
  year: 1990, month: 1, day: 1, hour: 12, minute: 0, unknownTime: false,
  place: "杭州", utcOffsetMinutes: 480, longitude: "120.1551", latitude: "30.2741",
  dayBoundary: "midnight", luckGender: null, useTrueSolarTime: false,
  ...overrides,
});

const fallback: DailyGuidance = {
  theme: "把注意力放回下一步。", reason: "先确认现实，再扩大判断。", action: "完成一个小动作。", sources: ["近期状态"],
};

test("daily fortune includes only calculated natal and daily facts", () => {
  const context = buildDailyGuidanceContext(profile(), []);
  assert.equal(context.mode, "personal_daily_fortune");
  assert.deepEqual(context.evidence.map((item) => item.label), ["本命底图", "今日行运"]);
  const facts = JSON.stringify(context.modelContext);
  assert.match(facts, /"natal"/);
  assert.match(facts, /"today"/);
  assert.match(facts, /transitContacts/);
  assert.match(facts, /relationToNatal/);
});

test("missing or unusable birth data never claims a personal fortune", () => {
  for (const value of [null, profile({ latitude: "", longitude: "" })]) {
    const context = buildDailyGuidanceContext(value, []);
    assert.equal(context.mode, "daily_state_note");
    assert.deepEqual(context.evidence.map((item) => item.label), ["近期状态"]);
    const facts = JSON.stringify(context.modelContext);
    assert.doesNotMatch(facts, /"natal"|"today"|transitContacts|relationToNatal/);
  }
});

test("different users produce different calculated daily fact packages", () => {
  const first = buildDailyGuidanceContext(profile(), []);
  const second = buildDailyGuidanceContext(profile({ year: 2001, month: 9, day: 15, hour: 4, place: "纽约", utcOffsetMinutes: -240, longitude: "-74.006", latitude: "40.7128" }), []);
  assert.equal(first.mode, "personal_daily_fortune");
  assert.equal(second.mode, "personal_daily_fortune");
  assert.notDeepEqual(first.modelContext, second.modelContext);
  assert.notEqual(JSON.stringify(first.evidence), JSON.stringify(second.evidence));
});

test("model source labels are constrained to the evidence actually supplied", () => {
  const context = buildDailyGuidanceContext(profile(), []);
  const result = sanitizeDailyGuidance({
    theme: "今天先收回注意力。", reason: "先验证最重要的现实线索。", action: "把下一步写下来。",
    sources: ["本命底图", "近期镜像", "不存在的来源"],
  }, fallback, context.evidence);
  assert.deepEqual(result.sources, ["本命底图"]);
});

test("a provisional runtime observation can guide Daily without becoming an explicit fact", () => {
  const context = buildDailyGuidanceContext(null, [], [], [], {
    observations: [{ title: "工作与承担", summary: "近期多次谈到工作与承担。", evidenceCount: 2 }],
  });
  assert.equal(context.mode, "daily_state_note");
  assert.match(JSON.stringify(context.modelContext), /activeObservation/);
  assert.equal(context.evidence[0]?.detail, "最近反复出现：工作与承担");
  assert.deepEqual((context.modelContext as { authorizedFacts?: unknown[] }).authorizedFacts, []);
});
