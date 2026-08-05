import assert from "node:assert/strict";
import test from "node:test";
import { retrieveLiuyaoKnowledge } from "../knowledge/liuyao-retrieval.js";
import { createIntentSelection, resolveLiuyaoContext } from "../tools/liuyao/context-resolver.js";
import { calculateLiuyao } from "../tools/liuyao/engine.js";
import type { CoinToss } from "../tools/liuyao/types.js";
import { assertLiuyaoPresentationIntegrity, buildLiuyaoPresentation, cleanLiuyaoText } from "./liuyao-presentation.js";

test("presentation includes every moving line and only cleaned evidence", () => {
  const tosses: CoinToss[] = [
    [2, 2, 2], [3, 3, 3], [2, 3, 2], [3, 2, 2], [3, 2, 3], [2, 2, 2],
  ];
  const selection = createIntentSelection({ question: "我今天适合理发吗？", topicHint: "travel" });
  const context = resolveLiuyaoContext({ question: "我今天适合理发吗？", occurredAt: "2026-08-05T08:00:00.000Z", timezone: "Asia/Shanghai", intentSelection: selection });
  const result = calculateLiuyao(tosses, context);
  const knowledge = retrieveLiuyaoKnowledge(result);
  const presentation = buildLiuyaoPresentation({ question: "我今天适合理发吗？", result, knowledge, analysisContext: context });

  assert.deepEqual(presentation.movingLines.map((line) => line.position), result.movingLines);
  assert.match(presentation.questionTarget.join("；"), /日常改变与外在调整/);
  assert.doesNotMatch(JSON.stringify(presentation.evidence), /\bsame\b|month_strength|分为-1/i);
  assert.doesNotThrow(() => assertLiuyaoPresentationIntegrity(result, knowledge));
});

test("presentation integrity rejects an incomplete moving-line knowledge layer", () => {
  const result = calculateLiuyao(Array(6).fill([2, 2, 2] satisfies CoinToss));
  const knowledge = retrieveLiuyaoKnowledge(result);
  const incomplete = { ...knowledge, movingLines: knowledge.movingLines.slice(1) };
  assert.throws(() => assertLiuyaoPresentationIntegrity(result, incomplete), /moving_line_integrity_failed/);
});

test("technical enum and score fragments are translated before presentation", () => {
  assert.equal(cleanLiuyaoText("日辰关系为 same"), "日辰关系为 同类比和");
  assert.equal(cleanLiuyaoText("月令旺衰分为-1"), "月令旺衰偏弱");
});
