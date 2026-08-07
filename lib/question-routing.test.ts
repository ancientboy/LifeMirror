import assert from "node:assert/strict";
import test from "node:test";
import { recommendMirrorForQuestion } from "./question-routing.js";

test("routes a concrete changing decision to Liuyao", () => {
  const result = recommendMirrorForQuestion("这次面试我该不该接受 offer？");
  assert.equal(result.href, "/app/liuyao/");
  assert.equal(result.seed, "这次面试我该不该接受 offer？");
});

test("routes relationship uncertainty to Tarot", () => {
  assert.equal(recommendMirrorForQuestion("我不知道该怎么和对方开口").href, "/app/tarot/");
});

test("routes stable self-understanding to a natal chart", () => {
  assert.equal(recommendMirrorForQuestion("我想了解自己的长期职业方向").href, "/app/chart/");
});

test("keeps ambiguous questions in conversation", () => {
  assert.equal(recommendMirrorForQuestion("我最近有点乱").href, "/app/home/");
});
