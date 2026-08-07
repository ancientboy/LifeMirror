import assert from "node:assert/strict";
import test from "node:test";
import { isCompleteMirrorResult, mirrorResultQualityError } from "./mirror-result-quality.js";

const valid = {
  headline: "先别急着答应，这件事还需要核对条件。",
  interpretation: "盘面里的助力已经出现，但阻力也集中在沟通与节奏上，适合先把事实说清。",
  action: "今天只确认一个关键条件，再决定要不要继续推进。",
  reflectionQuestion: "哪一个事实一旦确认，会让你的决定不再只是猜测？",
  shareCards: {
    warm: "我先把心里的急，换成一条可确认的事实。",
    roast: "别只让我猜，你愿不愿意把这件事说清？",
    witty: "也生成你的镜像，看看我们卡住的地方像不像。",
  },
};

test("accepts a complete, distinct mirror result", () => {
  assert.equal(isCompleteMirrorResult(valid), true);
  assert.equal(mirrorResultQualityError(valid), null);
});

test("rejects internal fallback language instead of presenting it as Shiguang", () => {
  assert.equal(mirrorResultQualityError({ ...valid, action: "基础规则解读：先等一等。" }), "internal_action");
});

test("rejects near-duplicate share cards", () => {
  const duplicate = { ...valid, shareCards: { ...valid.shareCards, roast: "我先把心里的急，换成一条可确认的事实，我们都别猜。" } };
  assert.equal(mirrorResultQualityError(duplicate), "duplicate_share_cards");
});

test("rejects share copy written for the wrong social scene", () => {
  const wrongScene = { ...valid, shareCards: { ...valid.shareCards, witty: "这次先照顾好自己的节奏，不急着给答案。" } };
  assert.equal(mirrorResultQualityError(wrongScene), "wrong_scene_witty");
});
