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
  response: Record<string, unknown>;
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
      evidenceCards: [{ title: "子孙为用", technical: "子孙为用且得时", plain: "这卦更支持放松和开心。", effect: "positive" }, { title: "六爻皆动", technical: "六爻发动", plain: "安排容易临时变化。", effect: "mixed" }],
      closing: { type: "follow_up", text: "真去了回来跟我说说玩得怎么样。" },
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
      evidenceCards: [{ title: "官鬼为用", technical: "官鬼为用", plain: "职位和责任是判断核心。", effect: "positive" }, { title: "现实承接", technical: "用神得时", plain: "当前有一定条件接住机会。", effect: "positive" }],
      closing: { type: "observation", text: "把职责和权限问清楚，再答应会更稳。" },
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
      evidenceCards: [{ title: "官鬼为用", technical: "官鬼为用", plain: "关系中的对方与承诺是核心。", effect: "mixed" }, { title: "用神受限", technical: "用神囚且旬空", plain: "现实修复条件偏弱。", effect: "negative" }],
      closing: { type: "observation", text: "先看对方有没有实际行动。" },
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
      practicalGuidance: "先用四周看看客户是否愿意付费，并提前写清现金底线和退出条件。",
      evidenceCards: [{ title: "世爻为用", technical: "世爻为用", plain: "你的承受力是判断核心。", effect: "mixed" }, { title: "用神休", technical: "用神休", plain: "推进会持续消耗资源。", effect: "negative" }],
      closing: { type: "observation", text: "先看客户和现金有没有真实回应。" },
      reflectionQuestion: "如果四周后没有付费验证，你愿意停止、调整，还是会因为已经投入而继续？",
      shareableReflection: "创业的第一步不是押上全部，而是把最关键的未知变成可验证的事实。",
    },
  },
  {
    name: "casual-game-multi-intent",
    question: "今晚约朋友打牌能不能赢钱？",
    tosses: Array(6).fill([3, 3, 3] as CoinToss),
    context: { topic: "travel", monthBranch: "wei", dayStem: "wu", dayBranch: "shen", tone: "playful", intents: [{ id: "travel-1", label: "邀约与放松", topic: "travel", priority: 1 }, { id: "wealth-2", label: "收入与得财", topic: "wealth", priority: 2 }] },
    expectedMapping: "子孙为用",
    response: {
      traditionalJudgment: "先说结果：朋友可以约，赢钱别抱太大期待。娱乐这边更顺，财这边有分夺和回头受制。",
      reasoningExplanation: "邀约以子孙为用，卦里有放松和行动条件；求财另看妻财，兄弟分财与变后受制让赢钱这件事明显打折。",
      shiguangInterpretation: "去玩没问题，今天更像赢气氛，不像稳稳收钱；别因为一两把上头，把开心局打成翻本局。",
      practicalGuidance: "先定一个输得起的上限，到线就收手；把重点放在见朋友，不追损失。",
      evidenceCards: [{ title: "邀约", technical: "子孙为用", plain: "放松聚会这条线较顺。", effect: "positive" }, { title: "分财", technical: "兄弟爻参与分财", plain: "赢钱旁边有竞争和消耗。", effect: "negative" }],
      closing: { type: "banter", text: "去吧，赢了别膨胀，输了也别续杯。" },
      shareableReflection: "今晚适合赢到开心，不适合拿开心去追输赢。",
    },
  },
  {
    name: "exam-performance",
    question: "这次考试发挥如何？",
    tosses: Array(6).fill([3, 2, 2] as CoinToss),
    context: { topic: "study", scenario: "exam", scenarioFocus: "exam_performance", monthBranch: "zi", dayStem: "jia", dayBranch: "zi" },
    expectedMapping: "父母为用",
    response: {
      traditionalJudgment: "先说结论：发挥偏稳，但不是毫无压力。准备和答题承接得住，临场别被时间节奏带乱。",
      reasoningExplanation: "考试发挥以父母爻为主，父母用神有现实支撑；世爻状态和官鬼压力同时出现，所以结论是能发挥、但要管住节奏。",
      shiguangInterpretation: "你不是没准备，真正容易丢分的是被一道题拖住以后开始乱。稳住前半程，后面会好很多。",
      practicalGuidance: "先拿稳会做的题，给卡题设硬性时间；这比临场再逼自己兴奋更有用。",
      evidenceCards: [{ title: "父母为用", technical: "父母爻主准备与答卷", plain: "准备是这次发挥的底。", effect: "positive" }, { title: "评价压力", technical: "官鬼为评价条件", plain: "压力会影响临场节奏。", effect: "mixed" }],
      closing: { type: "observation", text: "稳住节奏，比临时多塞一页知识更值。" },
      shareableReflection: "会做的先做稳，发挥就不会被一时紧张带走。",
    },
  },
  {
    name: "former-contact",
    question: "前任还会不会联系？",
    tosses: Array(6).fill([2, 3, 3] as CoinToss),
    context: { topic: "self", usefulGod: "ying", scenario: "reconciliation", scenarioFocus: "relationship_contact", monthBranch: "zi", dayStem: "jia", dayBranch: "zi", tone: "warm" },
    expectedMapping: "应爻为用",
    response: {
      traditionalJudgment: "先说结论：目前看不到很强的主动联系信号。双方仍有旧关系背景，但应爻未给出足够动作。",
      reasoningExplanation: "联系问题明确取应爻看对方回应；应爻安静，结构线索只能说明旧题仍在，不能把它直接说成近期会来消息。",
      shiguangInterpretation: "有过的关系当然不会一下清零，但想起你和真的联系你是两件事，这一卦更支持先看行动。",
      practicalGuidance: "别用社交平台的细小动静替代明确消息；如果要主动，也先想清楚自己接受哪种回应。",
      evidenceCards: [{ title: "应爻为用", technical: "应爻代表对方回应", plain: "联系要看对方有没有实际动作。", effect: "mixed" }, { title: "应爻安静", technical: "联系信号未发动", plain: "暂时没有足够主动迹象。", effect: "negative" }],
      closing: { type: "observation", text: "先看消息有没有真的来，不替沉默写剧情。" },
      shareableReflection: "想起不等于联系，真正的回应要落在行动里。",
    },
  },
  {
    name: "health-boundary",
    question: "身体不舒服是不是大问题？",
    tosses: Array(6).fill([2, 3, 3] as CoinToss),
    context: { topic: "health", usefulGod: "shi", monthBranch: "zi", dayStem: "jia", dayBranch: "zi", tone: "careful" },
    expectedMapping: "世爻为用",
    response: {
      traditionalJudgment: "先说结论：卦象不能判断是不是大问题。它只提示身体压力因素需要重视，轻重必须交给症状、检查和医生。",
      reasoningExplanation: "健康占以世爻看本人，另看官鬼病象和子孙缓解因素；这些是传统风险线索，不提供病名、严重程度或排除诊断。",
      shiguangInterpretation: "这次别拿一句吉凶给自己吃定心丸，也别先吓自己；把身体发出的信号认真交给现实检查。",
      practicalGuidance: "若症状持续、加重或出现明显危险信号，及时就医；记录起始时间、变化和伴随症状。",
      evidenceCards: [{ title: "世爻为用", technical: "健康以世爻看本人", plain: "重点是你当前身体状态。", effect: "mixed" }, { title: "医疗边界", technical: "病象不能替代检查", plain: "轻重必须由现实医疗证据判断。", effect: "mixed" }],
      closing: { type: "observation", text: "先照顾身体，别让卦替检查下结论。" },
      shareableReflection: "身体的不适值得被检查，而不是被一句吉凶盖过去。",
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
    assert.match(generated.reflection.traditionalJudgment, /^先说(结论|结果)：(偏向可行|有条件可行|建议暂缓|仅按卦象象意|朋友可以约|发挥偏稳|目前看不到|卦象不能)/);
    assert.doesNotMatch(generated.reflection.traditionalJudgment, /真正.*问题|不是.*答案|更重要/);
    assert.ok(generated.reflection.reasoningExplanation.length > 20);
    assert.ok(generated.reflection.practicalGuidance.length > 20);
    assert.ok(generated.reflection.evidenceCards.length >= 2);
    if (generated.reflection.reflectionQuestion) assert.ok(generated.reflection.reflectionQuestion.endsWith("？"));
    assert.doesNotMatch(JSON.stringify(generated.reflection), /真正的问题|内在需要|低风险可撤回实验/);
    if (evaluation.name === "entertainment" || evaluation.name === "casual-game-multi-intent") {
      assert.equal(generated.reflection.reflectionQuestion, undefined);
      assert.ok(generated.reflection.closing?.type === "follow_up" || generated.reflection.closing?.type === "banter");
    }
    if (evaluation.name === "casual-game-multi-intent") assert.match(generated.reflection.traditionalJudgment, /朋友可以约.*赢钱别抱太大期待/);
    if (evaluation.name === "health-boundary") assert.match(generated.reflection.practicalGuidance, /就医|检查/);
    assert.match(generated.explanationTrace.reflection_mapping, new RegExp(evaluation.expectedMapping));
    assert.deepEqual(generated.explanationTrace.final_response, generated.reflection);
  });
}
