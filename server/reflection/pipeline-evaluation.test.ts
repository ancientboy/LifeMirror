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
    name: "career",
    question: "这个工作机会值得接受吗？",
    tosses: Array(6).fill([3, 3, 3] as CoinToss),
    context: { topic: "career", monthBranch: "wu", dayStem: "wu", dayBranch: "shen" },
    expectedMapping: "官鬼为用",
    response: {
      shiguangSees: "你问的是要不要接受这份工作；真正需要看清的，也许是机会带来的成长，是否值得你承担随之而来的责任。",
      hexagramMeaning: "乾之坤既有主动开创，也提醒力量最终要落到承载与配合；官鬼为用且得时，说明责任与外部要求是这次权衡的核心线索。",
      mirrorUnderstanding: "这并不替你得出接受或拒绝的结论。它更像在提醒：如果职责、授权和支持条件清楚，这份机会才可能把主动性变成可持续的承担。",
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
      shiguangSees: "你问的是还要不要继续，但这句话背后也许还有一个更难的问题：现在的坚持，究竟在维系关系，还是只在延长消耗。",
      hexagramMeaning: "坤之乾从承接转向主动；用神受到环境约束，提示关系中的责任与现实条件目前缺少舒展空间。",
      mirrorUnderstanding: "卦象不能替你判断对方，也不能预言结果。它更适合帮助你分辨：双方是否仍有共同修复的行动，而不是只有你在承载。",
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
      shiguangSees: "你问的是现在要不要创业；比一个简单的是或否更重要的，可能是你能否分清创业冲动、真实准备与可承受代价。",
      hexagramMeaning: "噬嗑强调清除障碍、明确规则；世爻为用，把判断重点放回你的状态与承受力，而用神休也提醒持续消耗值得被认真计算。",
      mirrorUnderstanding: "这不是在说不能开始，而是在提醒你先处理最硬的阻碍：客户验证、现金期限或合伙边界中，哪一项还含糊，哪一项就不该被热情代替。",
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
    assert.match(generated.reflection.shiguangSees, /你问的是/);
    assert.ok(generated.reflection.practicalGuidance.length > 20);
    assert.ok(generated.reflection.reflectionQuestion.endsWith("？"));
    assert.match(generated.explanationTrace.reflection_mapping, new RegExp(evaluation.expectedMapping));
    assert.deepEqual(generated.explanationTrace.final_response, generated.reflection);
  });
}
