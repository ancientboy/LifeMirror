import assert from "node:assert/strict";
import test from "node:test";
import { resolveCivilOffsetMinutes } from "../../civil-time.js";

test("resolves historical IANA daylight-saving offsets from civil birth time", () => {
  assert.equal(resolveCivilOffsetMinutes({ year: 2000, month: 1, day: 1, hour: 12, minute: 0 }, "America/New_York"), -300);
  assert.equal(resolveCivilOffsetMinutes({ year: 2000, month: 7, day: 1, hour: 12, minute: 0 }, "America/New_York"), -240);
  assert.equal(resolveCivilOffsetMinutes({ year: 2000, month: 7, day: 1, hour: 12, minute: 0 }, "Europe/London"), 60);
});
