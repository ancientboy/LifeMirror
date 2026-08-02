import assert from "node:assert/strict";
import test from "node:test";
import { retrieveLiuyaoKnowledge } from "../knowledge/liuyao-retrieval.js";
import { retrieveLiuyaoReflectionKnowledge } from "../knowledge/liuyao-reflection-map.js";
import type { LlmProvider } from "../llm/types.js";
import { calculateLiuyao } from "../tools/liuyao/engine.js";
import type { CoinToss, LiuyaoAnalysisContext } from "../tools/liuyao/types.js";
import { generateMirrorReflection } from "./runtime.js";

const cases: Array<{
  name: string;
  question: string;
  tosses: CoinToss[];
  context: LiuyaoAnalysisContext;
  expectedMapping: string;
  response: Record<string, string>;
}> = [
  {
    name: "entertainment",
    question: "今天适合出去玩吗？",
    tosses: Array(6).fill([3, 3, 3] as CoinToss),
    context: { topic: "travel", monthBranch: "zi", dayStem: "jia", dayBranch: "zi" },
    expectedMapping: "子孙为用",
    response: {
      traditionalJudgment: "先说结果：偏向可行。今天适合出去玩，更像轻松交流局，不必把行程排得太满。",
      reasoningExplanation: "乾之坤由主动转向承载；子孙为用且用神旺，初爻又临青龙，传统因素更支持放松、娱乐与交流，但六爻皆动也提示节奏容易变化。",
      shiguangInterpretation: "翻成人话就是：可以去，而且大概率玩得开；只是别给自己安排太多必须完成的项目，随性一点反而更舒服。",
      practicalGuidance: "如果是朋友聚会或短途活动，可以去；少排一个耗体力的环节，并给返程留出余量。",
      reflectionQuestion: "顺便问一句，你今天更想要热闹，还是更想真正放松一下？",
      shareableReflection: "今天适合出门，少一点任务感，会多一点真正的开心。",
    },
  },
  {
    name: "career",
    question: "这个工作机会值得接受吗？",
    tosses: Array(6).fill([3, 3, 3] as CoinToss),
    context: { topic: "career", monthBranch: "wu", dayStem: "wu", dayBranch: "shen" },
    expectedMapping: "官鬼为用",
    response: {
      traditionalJudgment: "先说结论：偏向可行。这个工作机会可以接受，但前提是职责、权限和支持资源能够匹配。",
      reasoningExplanation: "乾之坤有主动开创后转入承载之象；官鬼为用且用神旺，传统规则把责任、职位与外部要求列为核心，并显示当前条件有一定承接力。",
      shiguangInterpretation: "拾光的理解是，这份机会值得认真接住，但真正决定它能否长久的，不只是职位本身，而是你是否拥有完成责任所需的授权与支持。",
      practicalGuidance: "在答复前确认前三个月的目标、决策权限和可调用资源；再写下你不愿长期承担的一项代价。",
      reflectionQuestion: "如果职位名称不变，但实际责任增加一倍，你仍愿意接受它吗？",
      shareableReflection: "值得接受的机会，不只让你向前，也让责任落在可承受的位置。",
    },
  },
  {
    name: "relationship",
    question: "这段关系还有必要继续吗？",
    tosses: Array(6).fill([2, 2, 2] as CoinToss),
    context: { topic: "relationship_female", monthBranch: "wei", dayStem: "ji", dayBranch: "you" },
    expectedMapping: "用神囚",
    response: {
      traditionalJudgment: "先说结论：建议暂缓继续投入。就当前卦象看，这段关系的修复条件偏弱，继续需要对方出现明确行动。",
      reasoningExplanation: "坤之乾由承接转向主动；官鬼为用，但用神囚且旬空，传统规则显示关系所依赖的现实条件受限，现阶段不宜只凭期待追加投入。",
      shiguangInterpretation: "拾光并不是要你立刻结束，而是想提醒你：先看双方有没有共同修复的行动，再决定这段关系是否值得继续承载。",
      practicalGuidance: "约定一次不争输赢的对话，各自说清一项愿意改变的行为，并为它设一个短期观察窗口。",
      reflectionQuestion: "如果对方未来三个月仍保持现在的行动方式，你愿意继续这段关系吗？",
      shareableReflection: "关系能否继续，不只看舍不得，也看彼此是否仍愿意一起改变。",
    },
  },
  {
    name: "decision",
    question: "我现在应该创业吗？",
    tosses: [[3,2,2],[2,3,3],[3,3,2],[2,2,3],[3,2,3],[2,3,2]],
    context: { topic: "self", monthBranch: "shen", dayStem: "geng", dayBranch: "xu" },
    expectedMapping: "世爻为用",
    response: {
      traditionalJudgment: "先说结论：有条件可行。现在可以开始创业验证，但不适合立刻重投入或彻底押上全部。",
      reasoningExplanation: "噬嗑静卦强调先清障、立规则；世爻为用而用神休，传统规则把重点放在你当前的承受力，并提示资源持续消耗是主要限制。",
      shiguangInterpretation: "拾光的理解是，你的创业念头可以被认真对待，只是它更需要一个能撤回的小起点，让客户、现金期限和合伙边界先接受现实检验。",
      practicalGuidance: "先做一个四周可撤回实验：访谈目标客户、获得明确付费信号，并写出最坏情况下的退出条件。",
      reflectionQuestion: "如果四周后没有付费验证，你愿意停止、调整，还是会因为已经投入而继续？",
      shareableReflection: "创业的第一步不是押上全部，而是把最关键的未知变成可验证的事实。",
    },
  },
];

for (const evaluation of cases) {
  test(`real-question pipeline evaluation: ${evaluation.name}`, async () => {
    const hexagram = calculateLiuyao(evaluation.tosses, evaluation.context);
    const knowledge = retrieveLiuyaoKnowledge(hexagram);
    const reflectionKnowledge = retrieveLiuyaoReflectionKnowledge(hexagram, knowledge);
    let captured = "";
    const llm: LlmProvider = {
      name: "evaluation-fixture",
      async generate(request) {
        captured = request.messages[1].content;
        return { text: JSON.stringify(evaluation.response), provider: "evaluation-fixture", model: "reviewed-example" };
      },
    };
    const generated = await generateMirrorReflection({ llm, question: evaluation.question, hexagram, knowledge, reflectionKnowledge });
    assert.equal(hexagram.analysis.status, "complete");
    assert.ok(reflectionKnowledge.mappings.some((item) => item.traditionalConcept === evaluation.expectedMapping));
    assert.match(captured, new RegExp(evaluation.expectedMapping));
    assert.match(generated.reflection.traditionalJudgment, /^先说(结论|结果)：(偏向可行|有条件可行|建议暂缓|仅按卦象象意)/);
    assert.doesNotMatch(generated.reflection.traditionalJudgment, /真正.*问题|不是.*答案|更重要/);
    assert.ok(generated.reflection.reasoningExplanation.length > 20);
    assert.ok(generated.reflection.practicalGuidance.length > 20);
    assert.ok(generated.reflection.reflectionQuestion.endsWith("？"));
    assert.match(generated.explanationTrace.reflection_mapping, new RegExp(evaluation.expectedMapping));
    assert.deepEqual(generated.explanationTrace.final_response, generated.reflection);
  });
}
