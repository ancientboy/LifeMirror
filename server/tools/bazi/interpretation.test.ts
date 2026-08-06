diff --git a/server/tools/bazi/interpretation.test.ts b/server/tools/bazi/interpretation.test.ts
new file mode 100644
index 0000000..fa508c9
--- /dev/null
+++ b/server/tools/bazi/interpretation.test.ts
@@ -0,0 +1,22 @@
+import assert from "node:assert/strict";
+import test from "node:test";
+import { calculateBazi } from "./engine.js";
+import { buildBaziLifeDomainInsights } from "./interpretation.js";
+
+const base = { utcOffsetMinutes: 480, dayBoundary: "midnight" as const, useTrueSolarTime: false };
+
+test("life-domain reading is a fixed six-part synthesis of the calculated Four Pillars", () => {
+  const result = calculateBazi({ ...base, year: 1990, month: 1, day: 1, hour: 12, minute: 0, luckGender: "male" });
+  const insights = buildBaziLifeDomainInsights(result);
+  assert.deepEqual(insights.map((item) => item.key), ["self", "emotions", "relationships", "career", "value", "belonging"]);
+  assert.ok(insights.every((item) => item.reading.length > 80 && item.evidence.length >= 3 && item.reflection.length > 15));
+  assert.match(insights.find((item) => item.key === "self")!.evidence.join(" "), new RegExp(result.pillars[2]!.ganZhi));
+  assert.match(insights.find((item) => item.key === "career")!.evidence.join(" "), new RegExp(result.pillars[1]!.ganZhi));
+});
+
+test("life-domain reading does not invent time-pillar or luck-cycle conclusions", () => {
+  const result = calculateBazi({ ...base, year: 1990, month: 1, day: 1, hour: null, minute: 0, luckGender: "female" });
+  const text = buildBaziLifeDomainInsights(result).flatMap((item) => [item.reading, ...item.evidence]).join(" ");
+  assert.match(text, /出生时间未知|未提供|未生成/);
+  assert.doesNotMatch(text, /时柱：[^未][^知]/);
+});
