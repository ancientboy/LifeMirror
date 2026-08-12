import assert from "node:assert/strict";
import test from "node:test";
import { dailyEvidenceFingerprint, isNewHomeExperience, type HomeSnapshot } from "./home-experience.js";

function empty(overrides: Partial<HomeSnapshot> = {}): HomeSnapshot {
  return { settings: {}, facts: [], history: [], tarot: [], chats: [], ...overrides };
}

test("only a genuinely empty mirror receives first-use onboarding", () => {
  assert.equal(isNewHomeExperience(empty()), true);
  assert.equal(isNewHomeExperience(empty({ settings: { birthProfile: { version: 1 } } })), false);
  assert.equal(isNewHomeExperience(empty({ history: [{ id: "mirror-1" }] })), false);
  assert.equal(isNewHomeExperience(empty({ chats: [{ messages: [{ role: "assistant", text: "我在" }, { role: "user", text: "有件事" }] }] })), false);
});

test("an empty assistant-only thread does not turn a new account into a returning user", () => {
  assert.equal(isNewHomeExperience(empty({ chats: [{ messages: [{ role: "assistant", text: "我在" }] }] })), true);
  assert.equal(isNewHomeExperience(empty({ settings: { dailyLoop: [{ date: "2026-08-12", action: "走一步" }] } })), true);
});

test("an unchecked daily suggestion cannot trigger another guidance generation", () => {
  const before = empty();
  const after = empty({ settings: { dailyLoop: [{ date: "2026-08-12", action: "走一步" }] } });
  assert.equal(dailyEvidenceFingerprint(before), dailyEvidenceFingerprint(after));
});

test("profile and confirmed daily feedback do trigger a fresh guidance context", () => {
  const before = empty();
  const profile = empty({ settings: { birthProfile: { version: 1, updatedAt: "2026-08-12" } } });
  const checkin = empty({ settings: { dailyLoop: [{ date: "2026-08-12", action: "走一步", status: "done" }] } });
  assert.notEqual(dailyEvidenceFingerprint(before), dailyEvidenceFingerprint(profile));
  assert.notEqual(dailyEvidenceFingerprint(before), dailyEvidenceFingerprint(checkin));
});
