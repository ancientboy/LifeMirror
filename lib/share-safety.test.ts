import assert from "node:assert/strict";
import test from "node:test";
import { safePublicShareMeta, safePublicShareText } from "./share-safety.js";

test("public share text keeps a normal one-line mirror", () => {
  assert.equal(safePublicShareText("慢一点不是退后，是让自己回到节奏里。", "paper"), "慢一点不是退后，是让自己回到节奏里。");
});

test("public share text replaces contact and birth details", () => {
  assert.equal(safePublicShareText("1995-06-02 出生的我今天想慢一点", "paper"), "此刻先把自己听清，也是一种向前。");
  assert.equal(safePublicShareText("联系我：13800138000", "night"), "我们不急着猜，愿意说清就有下一步。");
});

test("public share metadata never carries a location or birth profile", () => {
  assert.equal(safePublicShareMeta("出生地点：上海；经度 121.4737, 31.2304", "paper"), "一段来自拾光的镜像");
  assert.equal(safePublicShareMeta("我的塔罗镜像", "paper"), "我的塔罗镜像");
});
