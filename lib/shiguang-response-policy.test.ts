import assert from "node:assert/strict";
import test from "node:test";
import { localShiguangReply, SHIGUANG_POSITIONING, SHIGUANG_RESPONSE_CONTRACT, shiguangResponseQualityIssues } from "./shiguang-response-policy.js";

const situations = ["关系没有回应", "工作选择", "和朋友争执", "准备开口", "等待结果", "计划改变", "家人误会", "项目受阻", "情绪反复", "不知道要不要继续"];
const tones = ["我很难过", "我有点生气", "我拿不准", "我其实害怕", "我不想解释", "我觉得累", "我有点期待", "我怕做错", "我想先等等", "我需要一个判断"];

test("100 个常见情境的本地兜底均给出判断和一个可撤回动作", () => {
  const scenarios = situations.flatMap((situation) => tones.map((tone) => `${tone}，${situation}。`));
  assert.equal(scenarios.length, 100);
  for (const prompt of scenarios) {
    const reply = localShiguangReply(prompt);
    assert.deepEqual(shiguangResponseQualityIssues(reply), []);
    assert.match(reply, /判断是/u);
    assert.match(reply, /先只做一件可撤回的小事/u);
    assert.doesNotMatch(reply, /我听见你|这件事我接住了|你怎么看|决定权在你/u);
  }
});

test("定位和模型契约包含判断、现实动作与回访闭环", () => {
  assert.equal(SHIGUANG_POSITIONING, "会记得后来发生了什么的 AI 朋友");
  assert.match(SHIGUANG_RESPONSE_CONTRACT, /暂时判断/u);
  assert.match(SHIGUANG_RESPONSE_CONTRACT, /可撤回/u);
  assert.match(SHIGUANG_RESPONSE_CONTRACT, /以后回访/u);
});

test("质量检查会拒绝咨询师模板和把分析退回用户", () => {
  assert.ok(shiguangResponseQualityIssues("这件事我接住了。你怎么看？").includes("templated_opening"));
  assert.ok(shiguangResponseQualityIssues("这件事我接住了。你怎么看？").includes("analysis_returned_to_user"));
});
