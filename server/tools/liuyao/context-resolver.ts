import type {
  EarthlyBranch,
  HeavenlyStem,
  LiuyaoAnalysisContext,
  LiuyaoIntent,
  LiuyaoIntentSelection,
  LiuyaoScenario,
  LiuyaoScenarioFocus,
  LiuyaoTone,
  LiuyaoTimingScale,
  LiuyaoTopic,
  LiuyaoTopicHint,
} from "./types.js";

const STEMS: HeavenlyStem[] = ["jia", "yi", "bing", "ding", "wu", "ji", "geng", "xin", "ren", "gui"];
const BRANCHES: EarthlyBranch[] = ["zi", "chou", "yin", "mao", "chen", "si", "wu", "wei", "shen", "you", "xu", "hai"];

type TopicRule = { topic: LiuyaoTopic; label: string; pattern: RegExp; usefulGod?: LiuyaoIntent["usefulGod"] };

const SCENARIO_RULES: Array<{ scenario: LiuyaoScenario; pattern: RegExp }> = [
  { scenario: "job_search", pattern: /求职|找工作|应聘|面试|录用|入职|offer/i },
  { scenario: "exam", pattern: /考试|考研|高考|公考|成绩|录取|答辩/ },
  { scenario: "reconciliation", pattern: /复合|前任|挽回|重新在一起|重归于好|关系.*(?:稳定|继续|长久)|还要不要继续/ },
  { scenario: "investment", pattern: /投资|股票|基金|期货|加密|虚拟币|买入|卖出|仓位/ },
];

const SCENARIO_TOPICS: Record<LiuyaoScenario, readonly LiuyaoTopic[]> = {
  job_search: ["career"],
  exam: ["study"],
  reconciliation: ["self", "relationship_male", "relationship_female"],
  investment: ["wealth"],
};

function scenarioFocusForQuestion(question: string, scenario: LiuyaoScenario): LiuyaoScenarioFocus | undefined {
  if (scenario === "job_search") {
    if (/入职|试用期|到岗|上班/.test(question)) return "job_start";
    if (/录用|offer|合同|通知|能不能拿到|会不会拿到/i.test(question)) return "job_offer";
    return "job_interview";
  }
  if (scenario === "exam") {
    if (/录取|上岸|入围|过线|能不能进|能否进/.test(question)) return "exam_admission";
    if (/成绩|分数|多少分|排名|通过|及格/.test(question)) return "exam_score";
    return "exam_performance";
  }
  if (scenario === "reconciliation") {
    if (/联系|消息|回复|找我|主动/.test(question)) return "relationship_contact";
    if (/稳定|长久|继续|以后|未来|会不会散/.test(question)) return "relationship_stability";
    return "relationship_reconcile";
  }
  if (scenario === "investment") {
    if (/长期|长线|几年|一年|半年|定投|持有/.test(question)) return "investment_long_term";
    return "investment_short_term";
  }
  return undefined;
}

function hasExplicitScenarioFocus(question: string, scenario: LiuyaoScenario) {
  if (scenario === "job_search") return /面试|笔试|录用|offer|合同|通知|入职|试用期|到岗|上班/i.test(question);
  if (scenario === "exam") return /发挥|答题|考场|状态|成绩|分数|排名|通过|及格|录取|上岸|入围|过线/.test(question);
  if (scenario === "reconciliation") return /联系|消息|回复|找我|主动|复合|挽回|重新在一起|重归于好|稳定|长久|继续|以后|未来|会不会散/.test(question);
  return /短线|短期|几天|本周|买入|卖出|交易|长期|长线|几年|一年|半年|定投|持有/.test(question);
}

const FOCUS_LABELS: Partial<Record<LiuyaoScenarioFocus, string>> = {
  job_interview: "面试表现与推进",
  job_offer: "录用与 offer 落地",
  job_start: "入职与试用期落地",
  exam_performance: "考试发挥",
  exam_score: "成绩与通过",
  exam_admission: "录取与入围",
  relationship_contact: "是否重新联系",
  relationship_reconcile: "能否复合",
  relationship_stability: "关系能否稳定",
  investment_short_term: "短线风险与得失",
  investment_long_term: "长期持有条件",
};

const TOPIC_RULES: TopicRule[] = [
  { topic: "self", label: "日常改变与外在调整", pattern: /理发|剪头发|剪发|染发|烫发|换发型|换造型|美容|美甲|买衣服|换衣服/, usefulGod: "shi" },
  { topic: "health", label: "身体与恢复", pattern: /健康|身体|生病|疼|痛|症状|检查|治疗|手术|康复|药/, usefulGod: "shi" },
  { topic: "legal", label: "诉讼与争议", pattern: /官司|诉讼|起诉|仲裁|法律|纠纷|报警|判决/ },
  { topic: "study", label: "学习与考试", pattern: /考试|学习|升学|学校|论文|答辩|成绩|录取/ },
  { topic: "career", label: "工作与事业", pattern: /工作|事业|职业|职位|求职|找工作|应聘|录用|入职|离职|跳槽|面试|升职|创业|项目|offer/i },
  { topic: "wealth", label: "收入与得财", pattern: /赢钱|赚钱|收入|回报|财运|投资|股票|基金|期货|加密|虚拟币|买入|卖出|仓位|收益|盈利|亏损|奖金|工资|钱/ },
  { topic: "partnership", label: "同伴与竞争", pattern: /兄弟|姐妹|同事|竞争|朋友关系|朋友.*(?:靠谱|可信|相处|矛盾)/, usefulGod: "siblings" },
  { topic: "partnership", label: "合作与分配", pattern: /合伙|合作|股权|分成|团队|同事|伙伴/, usefulGod: "ying" },
  { topic: "relationship_female", label: "与男性对象的关系", pattern: /男友|男朋友|老公|丈夫|男性对象/ },
  { topic: "relationship_male", label: "与女性对象的关系", pattern: /女友|女朋友|老婆|妻子|女性对象/ },
  { topic: "self", label: "关系走势", pattern: /感情|恋爱|前任|复合|对象|婚姻|喜欢的人|这段关系|我们的关系/ },
  { topic: "children", label: "子女与宠物", pattern: /孩子|子女|怀孕|备孕|宝宝|宠物|猫|狗/ },
  { topic: "family", label: "文书、资产与长辈", pattern: /家人|家庭|父母|妈妈|爸爸|长辈|房产|房子|家里|文书|合同|车辆|车子|汽车/ },
  { topic: "travel", label: "邀约与放松", pattern: /约人|约朋友|聚会|出去|出门|旅行|旅游|出行平安|打牌|麻将|娱乐|玩|放松|吃饭|喝酒/ },
];

const TOPIC_HINT_TOPICS: Record<LiuyaoTopicHint, readonly LiuyaoTopic[]> = {
  career: ["career"],
  wealth: ["wealth"],
  study: ["study"],
  relationship: ["self", "relationship_male", "relationship_female"],
  health: ["health"],
  family: ["family", "children"],
  travel: ["travel"],
  legal: ["legal"],
  partnership: ["partnership"],
  other: ["self"],
};

const TOPIC_HINT_LABELS: Record<Exclude<LiuyaoTopicHint, "relationship" | "other">, string> = {
  career: "工作与事业",
  wealth: "收入与得财",
  study: "学习与考试",
  health: "身体与恢复",
  family: "家庭与相关事务",
  travel: "出行与日常安排",
  legal: "诉讼与争议",
  partnership: "合作与关系",
};

function mod(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function localDateParts(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

function julianDayAtNoon(year: number, month: number, day: number) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

export function sexagenaryDay(date: Date, timezone: string): { dayStem: HeavenlyStem; dayBranch: EarthlyBranch } {
  const { year, month, day } = localDateParts(date, timezone);
  const julianDay = julianDayAtNoon(year, month, day);
  return {
    dayStem: STEMS[mod(julianDay - 1, 10)],
    dayBranch: BRANCHES[mod(julianDay + 1, 12)],
  };
}

export function solarTermMonthBranch(date: Date, timezone: string): EarthlyBranch {
  const { month, day } = localDateParts(date, timezone);
  const code = month * 100 + day;
  if (code >= 1207 || code < 106) return "zi";
  if (code < 204) return "chou";
  if (code < 306) return "yin";
  if (code < 405) return "mao";
  if (code < 506) return "chen";
  if (code < 606) return "si";
  if (code < 707) return "wu";
  if (code < 808) return "wei";
  if (code < 908) return "shen";
  if (code < 1008) return "you";
  if (code < 1107) return "xu";
  return "hai";
}

function isNearMonthBoundary(date: Date, timezone: string) {
  const { month, day } = localDateParts(date, timezone);
  const boundaries: Record<number, number> = { 1: 6, 2: 4, 3: 6, 4: 5, 5: 6, 6: 6, 7: 7, 8: 8, 9: 8, 10: 8, 11: 7, 12: 7 };
  return Math.abs(day - boundaries[month]) <= 1;
}

export function classifyLiuyaoIntents(question: string, topicHint?: LiuyaoTopicHint): LiuyaoIntent[] {
  const matches = TOPIC_RULES.filter((rule) => rule.pattern.test(question));
  let unique = matches.filter((rule, index) => matches.findIndex((candidate) => candidate.topic === rule.topic) === index);
  if (unique.some((rule) => rule.topic === "relationship_female" || rule.topic === "relationship_male")) {
    unique = unique.filter((rule) => !(rule.topic === "self" && rule.label === "关系走势"));
  }
  if (!unique.length && topicHint && topicHint !== "other") {
    const topic = TOPIC_HINT_TOPICS[topicHint][0];
    return [{
      id: `${topic}-1`,
      label: topicHint === "relationship" ? "关系走势" : TOPIC_HINT_LABELS[topicHint],
      topic,
      priority: 1,
      ...(topic === "health" ? { usefulGod: "shi" as const } : {}),
    }];
  }
  if (!unique.length) return [{ id: "self", label: "这件事是否适合推进", topic: "self", priority: 1 }];

  if (topicHint && topicHint !== "other") {
    const hinted = TOPIC_HINT_TOPICS[topicHint];
    unique = [...unique].sort((left, right) => Number(hinted.includes(right.topic)) - Number(hinted.includes(left.topic)));
  }

  // 日常邀约同时问输赢时，分开回答“玩得如何”和“能否得财”，不混成一个模糊结论。
  const casual = unique.find((item) => item.topic === "travel");
  const wealth = unique.find((item) => item.topic === "wealth");
  const ordered = casual && wealth
    ? [casual, wealth, ...unique.filter((item) => item !== casual && item !== wealth)]
    : unique;
  return ordered.slice(0, 3).map((rule, index) => {
    const scenario = SCENARIO_RULES.find((item) => item.pattern.test(question) && SCENARIO_TOPICS[item.scenario].includes(rule.topic))?.scenario;
    const scenarioFocus = scenario ? scenarioFocusForQuestion(question, scenario) : undefined;
    const genericReconciliation = scenario === "reconciliation" && rule.topic === "self";
    return {
      id: `${rule.topic}-${index + 1}`,
      label: scenarioFocus ? FOCUS_LABELS[scenarioFocus] ?? rule.label : rule.label,
      topic: rule.topic,
      priority: index + 1,
      ...(rule.usefulGod ? { usefulGod: rule.usefulGod } : genericReconciliation ? { usefulGod: "ying" as const } : {}),
      ...(scenario ? { scenario } : {}),
      ...(scenarioFocus ? { scenarioFocus } : {}),
    };
  });
}

export function deterministicIntentConfidence(question: string, topicHint?: LiuyaoTopicHint): number {
  const matches = TOPIC_RULES.filter((rule) => rule.pattern.test(question));
  const uniqueTopics = new Set(matches.map((rule) => rule.topic));
  if (!matches.length) return topicHint && topicHint !== "other" ? 0.58 : 0.28;
  const hinted = topicHint && topicHint !== "other" ? TOPIC_HINT_TOPICS[topicHint] : [];
  const hintMatches = matches.some((rule) => hinted.includes(rule.topic));
  const matchedScenario = SCENARIO_RULES.find((rule) => rule.pattern.test(question))?.scenario;
  if (matchedScenario && !hasExplicitScenarioFocus(question, matchedScenario)) return hintMatches ? 0.7 : 0.5;
  const explicitMultiGoal = uniqueTopics.size > 1 && /和|以及|同时|还|又|并且|，|、/.test(question);
  if (uniqueTopics.size === 1 && (!topicHint || topicHint === "other" || hintMatches)) return 0.93;
  if (explicitMultiGoal && (!topicHint || topicHint === "other" || hintMatches)) return 0.88;
  return hintMatches ? 0.76 : 0.52;
}

export function toneForQuestion(question: string, intents: LiuyaoIntent[]): LiuyaoTone {
  if (intents.some((intent) => intent.topic === "health" || intent.topic === "legal" || intent.scenario === "investment")) return "careful";
  if (intents.some((intent) => intent.topic === "relationship_female" || intent.topic === "relationship_male" || intent.topic === "family" || intent.scenario === "reconciliation")) return "warm";
  if (/玩|聚会|打牌|麻将|约朋友|吃饭|喝酒|放松/.test(question)) return "playful";
  return "grounded";
}

export function timingScaleForQuestion(question: string, intents: LiuyaoIntent[]): LiuyaoTimingScale {
  if (/今天|今日|今晚|明天|明日|后天|这两天|几天|本周|这周|周末|近期|眼下|马上/.test(question)) return "day";
  if (/这个月|下个月|几个月|半年|今年|明年|长期|未来|季度|什么时候|何时/.test(question)) return "month";
  return intents.some((intent) => intent.topic === "travel") ? "day" : "month";
}

export function createIntentSelection(input: {
  question: string;
  topicHint?: LiuyaoTopicHint;
  intents?: LiuyaoIntent[];
  source?: LiuyaoIntentSelection["resolution"]["source"];
  confidence?: number;
}): LiuyaoIntentSelection {
  const intents = input.intents?.length ? input.intents : classifyLiuyaoIntents(input.question.trim(), input.topicHint);
  return {
    topic: intents[0].topic,
    ...(intents[0].usefulGod ? { usefulGod: intents[0].usefulGod } : {}),
    intents,
    tone: toneForQuestion(input.question, intents),
    timingScale: timingScaleForQuestion(input.question, intents),
    ...(intents[0].scenario ? { scenario: intents[0].scenario } : {}),
    ...(intents[0].scenarioFocus ? { scenarioFocus: intents[0].scenarioFocus } : {}),
    resolution: {
      source: input.source ?? "deterministic",
      confidence: Math.max(0, Math.min(1, input.confidence ?? deterministicIntentConfidence(input.question, input.topicHint))),
      ...(input.topicHint ? { topicHint: input.topicHint } : {}),
    },
  };
}

export function resolveLiuyaoContext(input: { question: string; occurredAt?: string; timezone?: string; intentSelection?: LiuyaoIntentSelection }): LiuyaoAnalysisContext {
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
  if (Number.isNaN(occurredAt.getTime())) throw new Error("Invalid divination time");
  const timezone = input.timezone || "Asia/Shanghai";
  // Validate the IANA time zone before using it in later calculations.
  new Intl.DateTimeFormat("en", { timeZone: timezone }).format(occurredAt);
  const selection = input.intentSelection ?? createIntentSelection({ question: input.question });
  const intents = selection.intents;
  return {
    topic: selection.topic,
    ...(selection.usefulGod ? { usefulGod: selection.usefulGod } : {}),
    intents,
    tone: selection.tone,
    timingScale: selection.timingScale,
    ...(selection.scenario ? { scenario: selection.scenario } : {}),
    ...(selection.scenarioFocus ? { scenarioFocus: selection.scenarioFocus } : {}),
    intentResolution: selection.resolution,
    calendarBoundary: isNearMonthBoundary(occurredAt, timezone),
    occurredAt: occurredAt.toISOString(),
    timezone,
    monthBranch: solarTermMonthBranch(occurredAt, timezone),
    ...sexagenaryDay(occurredAt, timezone),
  };
}
