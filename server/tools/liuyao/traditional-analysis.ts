import type {
  EarthlyBranch,
  FiveElement,
  HeavenlyStem,
  LiuyaoAnalysisContext,
  LiuyaoCastingLine,
  LiuyaoEvidence,
  LiuyaoLine,
  LiuyaoScenarioFocus,
  LiuyaoTopic,
  LiuyaoTraditionalAnalysis,
  LiuyaoTimingCandidate,
  LiuyaoUsefulGodTarget,
  Polarity,
  SixRelation,
} from "./types.js";

export const ELEMENT_NAMES: Record<FiveElement, string> = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };
export const BRANCH_NAMES: Record<EarthlyBranch, string> = { zi: "子", chou: "丑", yin: "寅", mao: "卯", chen: "辰", si: "巳", wu: "午", wei: "未", shen: "申", you: "酉", xu: "戌", hai: "亥" };
export const STEM_NAMES: Record<HeavenlyStem, string> = { jia: "甲", yi: "乙", bing: "丙", ding: "丁", wu: "戊", ji: "己", geng: "庚", xin: "辛", ren: "壬", gui: "癸" };
const STRENGTH_NAMES = { prosperous: "旺", supported: "相", resting: "休", confined: "囚", dead: "死" } as const;
const RELATION_NAMES: Record<SixRelation, string> = { parents: "父母", siblings: "兄弟", offspring: "子孙", wealth: "妻财", officials: "官鬼" };

const TRIGRAM_ELEMENT: Record<string, FiveElement> = { qian: "metal", dui: "metal", li: "fire", zhen: "wood", xun: "wood", kan: "water", gen: "earth", kun: "earth" };
const BRANCH_ELEMENT: Record<EarthlyBranch, FiveElement> = { zi: "water", chou: "earth", yin: "wood", mao: "wood", chen: "earth", si: "fire", wu: "fire", wei: "earth", shen: "metal", you: "metal", xu: "earth", hai: "water" };
const GENERATES: Record<FiveElement, FiveElement> = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
const CONTROLS: Record<FiveElement, FiveElement> = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };
const BRANCHES: EarthlyBranch[] = ["zi", "chou", "yin", "mao", "chen", "si", "wu", "wei", "shen", "you", "xu", "hai"];
const STEMS: HeavenlyStem[] = ["jia", "yi", "bing", "ding", "wu", "ji", "geng", "xin", "ren", "gui"];
const SPIRITS: NonNullable<LiuyaoLine["spirit"]>[] = ["azure_dragon", "vermilion_bird", "hooked_earth", "soaring_serpent", "white_tiger", "black_tortoise"];
const SPIRIT_START: Record<HeavenlyStem, number> = { jia: 0, yi: 0, bing: 1, ding: 1, wu: 2, ji: 3, geng: 4, xin: 4, ren: 5, gui: 5 };
const CLASH: Record<EarthlyBranch, EarthlyBranch> = { zi: "wu", wu: "zi", chou: "wei", wei: "chou", yin: "shen", shen: "yin", mao: "you", you: "mao", chen: "xu", xu: "chen", si: "hai", hai: "si" };
const COMBINE: Record<EarthlyBranch, EarthlyBranch> = { zi: "chou", chou: "zi", yin: "hai", hai: "yin", mao: "xu", xu: "mao", chen: "you", you: "chen", si: "shen", shen: "si", wu: "wei", wei: "wu" };
const HARM: Record<EarthlyBranch, EarthlyBranch> = { zi: "wei", wei: "zi", chou: "wu", wu: "chou", yin: "si", si: "yin", mao: "chen", chen: "mao", shen: "hai", hai: "shen", you: "xu", xu: "you" };
const PROGRESS: Partial<Record<EarthlyBranch, EarthlyBranch>> = { hai: "zi", yin: "mao", si: "wu", shen: "you", chou: "chen", chen: "wei", wei: "xu", xu: "chou" };
const RETREAT = Object.fromEntries(Object.entries(PROGRESS).map(([from, to]) => [to, from])) as Partial<Record<EarthlyBranch, EarthlyBranch>>;
const PUNISHMENTS: ReadonlyArray<readonly EarthlyBranch[]> = [["yin", "si", "shen"], ["chou", "xu", "wei"], ["zi", "mao"]];
const SELF_PUNISHMENTS = new Set<EarthlyBranch>(["chen", "wu", "you", "hai"]);
const TOMB: Record<FiveElement, EarthlyBranch> = { wood: "wei", fire: "xu", earth: "chen", metal: "chou", water: "chen" };
const THREE_HARMONIES: Array<{ branches: readonly EarthlyBranch[]; element: FiveElement }> = [
  { branches: ["shen", "zi", "chen"], element: "water" },
  { branches: ["hai", "mao", "wei"], element: "wood" },
  { branches: ["yin", "wu", "xu"], element: "fire" },
  { branches: ["si", "you", "chou"], element: "metal" },
];

type Najia = { lowerBranches: EarthlyBranch[]; upperBranches: EarthlyBranch[]; lowerStem: HeavenlyStem; upperStem: HeavenlyStem };
const NAJIA: Record<string, Najia> = {
  qian: { lowerBranches: ["zi", "yin", "chen"], upperBranches: ["wu", "shen", "xu"], lowerStem: "jia", upperStem: "ren" },
  kun: { lowerBranches: ["wei", "si", "mao"], upperBranches: ["chou", "hai", "you"], lowerStem: "yi", upperStem: "gui" },
  zhen: { lowerBranches: ["zi", "yin", "chen"], upperBranches: ["wu", "shen", "xu"], lowerStem: "geng", upperStem: "geng" },
  xun: { lowerBranches: ["chou", "hai", "you"], upperBranches: ["wei", "si", "mao"], lowerStem: "xin", upperStem: "xin" },
  kan: { lowerBranches: ["yin", "chen", "wu"], upperBranches: ["shen", "xu", "zi"], lowerStem: "wu", upperStem: "wu" },
  li: { lowerBranches: ["mao", "chou", "hai"], upperBranches: ["you", "wei", "si"], lowerStem: "ji", upperStem: "ji" },
  gen: { lowerBranches: ["chen", "wu", "shen"], upperBranches: ["xu", "zi", "yin"], lowerStem: "bing", upperStem: "bing" },
  dui: { lowerBranches: ["si", "mao", "chou"], upperBranches: ["hai", "you", "wei"], lowerStem: "ding", upperStem: "ding" },
};

const STAGES = [
  { stage: "pure", flips: [], shi: 6 }, { stage: "first", flips: [0], shi: 1 },
  { stage: "second", flips: [0, 1], shi: 2 }, { stage: "third", flips: [0, 1, 2], shi: 3 },
  { stage: "fourth", flips: [0, 1, 2, 3], shi: 4 }, { stage: "fifth", flips: [0, 1, 2, 3, 4], shi: 5 },
  { stage: "wandering_soul", flips: [0, 1, 2, 4], shi: 4 }, { stage: "returning_soul", flips: [4], shi: 3 },
] as const;

export type PalaceStructure = { palace: string; palaceElement: FiveElement; palaceStage: typeof STAGES[number]["stage"]; shi: number; ying: number };
const PALACES = new Map<string, PalaceStructure>();
for (const [palace, element] of Object.entries(TRIGRAM_ELEMENT)) {
  const bits = Object.entries({ qian: "111", dui: "110", li: "101", zhen: "100", xun: "011", kan: "010", gen: "001", kun: "000" }).find(([key]) => key === palace)![1].repeat(2).split("");
  for (const entry of STAGES) {
    const pattern = [...bits];
    for (const position of entry.flips) pattern[position] = pattern[position] === "1" ? "0" : "1";
    PALACES.set(pattern.join(""), { palace, palaceElement: element, palaceStage: entry.stage, shi: entry.shi, ying: entry.shi <= 3 ? entry.shi + 3 : entry.shi - 3 });
  }
}

export function palaceFor(polarities: readonly Polarity[]): PalaceStructure {
  const result = PALACES.get(polarities.map((value) => value === "yang" ? "1" : "0").join(""));
  if (!result) throw new Error("Unable to resolve Liuyao palace");
  return result;
}

export function hexagramBody(lines: readonly LiuyaoLine[], palace: PalaceStructure) {
  const shiLine = lines[palace.shi - 1];
  const start = shiLine.polarity === "yang" ? BRANCHES.indexOf("zi") : BRANCHES.indexOf("wu");
  const branch = BRANCHES[(start + palace.shi - 1) % BRANCHES.length];
  return {
    branch,
    polarity: shiLine.polarity,
    lines: lines.filter((line) => line.branch === branch).map((line) => line.position),
  };
}

function sixRelation(palace: FiveElement, line: FiveElement): SixRelation {
  if (line === palace) return "siblings";
  if (GENERATES[line] === palace) return "parents";
  if (GENERATES[palace] === line) return "offspring";
  if (CONTROLS[line] === palace) return "officials";
  return "wealth";
}

export function voidBranches(dayStem: HeavenlyStem, dayBranch: EarthlyBranch): EarthlyBranch[] {
  const start = (BRANCHES.indexOf(dayBranch) - STEMS.indexOf(dayStem) + 10) % 12;
  return [BRANCHES[start], BRANCHES[(start + 1) % 12]];
}

export function enrichLines(lines: readonly LiuyaoCastingLine[], lowerTrigram: string, upperTrigram: string, palace: PalaceStructure, context?: LiuyaoAnalysisContext): LiuyaoLine[] {
  const lower = NAJIA[lowerTrigram];
  const upper = NAJIA[upperTrigram];
  const branches = [...lower.lowerBranches, ...upper.upperBranches];
  const stems = [lower.lowerStem, lower.lowerStem, lower.lowerStem, upper.upperStem, upper.upperStem, upper.upperStem];
  const voids = context ? voidBranches(context.dayStem, context.dayBranch) : [];
  const spiritStart = context ? SPIRIT_START[context.dayStem] : 0;
  return lines.map((line, index) => ({
    ...line, stem: stems[index], branch: branches[index], element: BRANCH_ELEMENT[branches[index]],
    relation: sixRelation(palace.palaceElement, BRANCH_ELEMENT[branches[index]]),
    spirit: context ? SPIRITS[(spiritStart + index) % 6] : null,
    role: line.position === palace.shi ? "shi" : line.position === palace.ying ? "ying" : null,
    void: context ? voids.includes(branches[index]) : null,
    changedBranch: null,
    changedElement: null,
  }));
}

const TOPIC_RELATION: Record<LiuyaoTopic, LiuyaoUsefulGodTarget> = {
  self: "shi", career: "officials", wealth: "wealth", study: "parents", relationship_male: "wealth",
  relationship_female: "officials", health: "shi", family: "parents", children: "offspring",
  travel: "offspring", legal: "officials", partnership: "ying",
};

const TOPIC_AUXILIARY: Partial<Record<LiuyaoTopic, { relation: SixRelation; label: string }>> = {
  career: { relation: "parents", label: "单位、合同与手续" },
  study: { relation: "officials", label: "考试压力与评价条件" },
  legal: { relation: "parents", label: "文书、证据与程序" },
  wealth: { relation: "offspring", label: "财源与生财条件" },
};

const SCENARIO_FOCUS_NAMES: Record<LiuyaoScenarioFocus, string> = {
  job_interview: "面试表现与推进", job_offer: "录用与 offer 落地", job_start: "入职与试用期落地",
  exam_performance: "考试发挥", exam_score: "成绩与通过", exam_admission: "录取与入围",
  relationship_contact: "是否重新联系", relationship_reconcile: "能否复合", relationship_stability: "关系能否稳定",
  investment_short_term: "短线风险与得失", investment_long_term: "长期持有条件",
};

export function dayTombFor(element: FiveElement): EarthlyBranch {
  return TOMB[element];
}

export function transformationDirection(from: EarthlyBranch, to: EarthlyBranch): "progress" | "retreat" | null {
  if (PROGRESS[from] === to) return "progress";
  if (RETREAT[from] === to) return "retreat";
  return null;
}

export function branchPattern(lines: readonly LiuyaoLine[]): "six_combine" | "six_clash" | null {
  const pairs = [[0, 3], [1, 4], [2, 5]] as const;
  if (pairs.every(([lower, upper]) => COMBINE[lines[lower].branch] === lines[upper].branch)) return "six_combine";
  if (pairs.every(([lower, upper]) => CLASH[lines[lower].branch] === lines[upper].branch)) return "six_clash";
  return null;
}

export function activeThreeHarmony(
  lines: readonly LiuyaoLine[],
  monthBranch: EarthlyBranch,
  dayBranch: EarthlyBranch,
): { element: FiveElement; branches: readonly EarthlyBranch[] } | null {
  const active = new Set<EarthlyBranch>([
    monthBranch,
    dayBranch,
    ...lines.filter((line) => line.moving).map((line) => line.branch),
  ]);
  return THREE_HARMONIES.find((group) => group.branches.every((branch) => active.has(branch))) ?? null;
}

function strength(element: FiveElement, month: EarthlyBranch) {
  const monthElement = BRANCH_ELEMENT[month];
  if (element === monthElement) return { level: "prosperous" as const, score: 2 };
  if (GENERATES[monthElement] === element) return { level: "supported" as const, score: 1 };
  if (GENERATES[element] === monthElement) return { level: "resting" as const, score: 0 };
  if (CONTROLS[element] === monthElement) return { level: "confined" as const, score: -1 };
  return { level: "dead" as const, score: -1 };
}

type CandidateAssessment = { line: LiuyaoLine; score: number; reasons: string[] };

function lineIsWeak(line: LiuyaoLine, context: LiuyaoAnalysisContext) {
  return Boolean(line.void || CLASH[context.monthBranch] === line.branch || strength(line.element, context.monthBranch).score < 0);
}

function shiHoldingInterpretation(
  relation: SixRelation,
  topic: LiuyaoTopic,
  weak: boolean,
): { amount: number; effect: LiuyaoEvidence["effect"]; plainMeaning: string } {
  if (weak) return {
    amount: -0.5,
    effect: "obstruct",
    plainMeaning: `世爻虽临${RELATION_NAMES[relation]}，但自身空破或失令；这个角色落在你身上，却暂时缺少承接它的力量。`,
  };
  if (relation === "parents") {
    const supportive = topic === "career" || topic === "study" || topic === "legal" || topic === "family";
    return { amount: supportive ? 0.5 : 0, effect: supportive ? "support" : "mixed", plainMeaning: supportive ? "你当前更能靠准备、材料、规则或责任感把事情接住。" : "你更在意规则、手续和责任，能稳住局面，也可能让自己背得偏重。" };
  }
  if (relation === "siblings") {
    const obstructive = topic === "wealth";
    return { amount: obstructive ? -1 : -0.25, effect: obstructive ? "obstruct" : "mixed", plainMeaning: obstructive ? "竞争、分摊或额外开销直接落在自己这一边，求财时要先扣掉这些消耗。" : "你更依赖自己和同类资源，也更容易卷入比较、竞争或利益分配。" };
  }
  if (relation === "offspring") {
    const supportive = topic === "travel" || topic === "health" || topic === "children";
    const obstructive = topic === "career" || topic === "legal";
    return { amount: supportive ? 0.5 : obstructive ? -0.5 : 0, effect: supportive ? "support" : obstructive ? "obstruct" : "mixed", plainMeaning: supportive ? "你这边有放松、解决问题或恢复的主动性，和所问主题方向一致。" : obstructive ? "你更想卸压或摆脱约束，但所问之事偏偏要求承担责任或面对规则，节奏容易相顶。" : "你更想把事情化开、过得轻一点；这能减压，但不自动等于目标已经落地。" };
  }
  if (relation === "wealth") {
    const supportive = topic === "wealth" || topic === "relationship_male";
    return { amount: supportive ? 0.5 : 0, effect: supportive ? "support" : "mixed", plainMeaning: supportive ? "资源、结果或对象条件落到自身位置，主观投入与所求方向较一致。" : "你更关注具体结果、资源和现实回报，判断时不能只谈感受。" };
  }
  const supportive = topic === "career" || topic === "legal" || topic === "relationship_female";
  const obstructive = topic === "health";
  return { amount: supportive ? 0.5 : obstructive ? -0.5 : 0, effect: supportive ? "support" : obstructive ? "obstruct" : "mixed", plainMeaning: supportive ? "职位、责任、规则或对象条件落在自身位置，你与主题贴得很近，但压力也会一起落身。" : obstructive ? "压力与病象类因素贴近自身，只能提醒重视现实症状和检查，不能据此判断病名或轻重。" : "责任和压力直接落到自己身上，推进力与负担会同时出现。" };
}

function assessUsefulGodCandidate(line: LiuyaoLine, context: LiuyaoAnalysisContext): CandidateAssessment {
  const reasons: string[] = [];
  let score = 0;
  const adjust = (amount: number, reason: string) => {
    score += amount;
    reasons.push(`${reason}${amount > 0 ? "+" : ""}${amount}`);
  };
  const monthRelation = context.monthBranch === line.branch ? "same" : elementRelation(BRANCH_ELEMENT[context.monthBranch], line.element);
  const dayRelation = context.dayBranch === line.branch ? "same" : elementRelation(BRANCH_ELEMENT[context.dayBranch], line.element);
  if (line.role === "shi") adjust(2, "临世");
  if (line.moving) adjust(3, "发动");
  if (line.void) adjust(-4, "旬空");
  if (monthRelation === "same") adjust(4, "临月");
  else if (monthRelation === "generates") adjust(2, "月生");
  else if (monthRelation === "controls") adjust(-3, "月克");
  else if (monthRelation === "generated_by") adjust(-1, "泄于月");
  if (CLASH[context.monthBranch] === line.branch) adjust(-4, "月破");
  if (dayRelation === "same") adjust(3, "临日");
  else if (dayRelation === "generates") adjust(2, "日生");
  else if (dayRelation === "controls") adjust(-2, "日克");
  if (CLASH[context.dayBranch] === line.branch) adjust(-1, "日冲");
  if (COMBINE[context.dayBranch] === line.branch) adjust(line.moving ? -1 : 1, line.moving ? "日合绊" : "日合");
  if (context.dayBranch === dayTombFor(line.element)) adjust(-1, "日墓");
  return { line, score, reasons };
}

const SOLAR_MONTH_STARTS: Array<{ branch: EarthlyBranch; month: number; day: number }> = [
  { branch: "chou", month: 1, day: 6 }, { branch: "yin", month: 2, day: 4 },
  { branch: "mao", month: 3, day: 6 }, { branch: "chen", month: 4, day: 5 },
  { branch: "si", month: 5, day: 6 }, { branch: "wu", month: 6, day: 6 },
  { branch: "wei", month: 7, day: 7 }, { branch: "shen", month: 8, day: 8 },
  { branch: "you", month: 9, day: 8 }, { branch: "xu", month: 10, day: 8 },
  { branch: "hai", month: 11, day: 7 }, { branch: "zi", month: 12, day: 7 },
];

function timingDateWindows(context: LiuyaoAnalysisContext, branch: EarthlyBranch, scale: LiuyaoTimingCandidate["scale"]): LiuyaoTimingCandidate["dateWindows"] {
  if (!context.occurredAt || !context.timezone) return undefined;
  const occurredAt = new Date(context.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) return undefined;
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: context.timezone, year: "numeric", month: "2-digit", day: "2-digit" });
    const parts = Object.fromEntries(formatter.formatToParts(occurredAt).map((part) => [part.type, part.value]));
    const base = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
    if (scale === "day") {
      const offset = (BRANCHES.indexOf(branch) - BRANCHES.indexOf(context.dayBranch) + 12) % 12;
      return [offset, offset + 12].map((days, index) => {
        const date = new Date(base + days * 86_400_000).toISOString().slice(0, 10);
        return { startDate: date, endDate: date, label: `${index === 0 ? "近期" : "下一轮"}${BRANCH_NAMES[branch]}日候选` };
      });
    }
    const baseYear = Number(parts.year);
    const periods = Array.from({ length: 4 }, (_, index) => baseYear - 1 + index).flatMap((year) =>
      SOLAR_MONTH_STARTS.map((entry, entryIndex) => {
        const next = SOLAR_MONTH_STARTS[entryIndex + 1];
        const start = Date.UTC(year, entry.month - 1, entry.day);
        const end = next
          ? Date.UTC(year, next.month - 1, next.day) - 86_400_000
          : Date.UTC(year + 1, SOLAR_MONTH_STARTS[0].month - 1, SOLAR_MONTH_STARTS[0].day) - 86_400_000;
        return { ...entry, start, end };
      }),
    );
    return periods
      .filter((period) => period.branch === branch && period.end >= base)
      .slice(0, 2)
      .map((period, index) => ({
        startDate: new Date(Math.max(period.start, base)).toISOString().slice(0, 10),
        endDate: new Date(period.end).toISOString().slice(0, 10),
        label: `${index === 0 ? "近期" : "下一轮"}${BRANCH_NAMES[branch]}月候选`,
      }));
  } catch {
    return undefined;
  }
}

function elementRelation(source: FiveElement, target: FiveElement): "same" | "generates" | "controls" | "generated_by" | "controlled_by" {
  if (source === target) return "same";
  if (GENERATES[source] === target) return "generates";
  if (CONTROLS[source] === target) return "controls";
  if (GENERATES[target] === source) return "generated_by";
  return "controlled_by";
}

function hiddenSpirit(lines: readonly LiuyaoLine[], palace: PalaceStructure, relation: SixRelation, context: LiuyaoAnalysisContext) {
  const pureBits = ({ qian: "111", dui: "110", li: "101", zhen: "100", xun: "011", kan: "010", gen: "001", kun: "000" } as Record<string, string>)[palace.palace];
  const fake = lines.map((line, index) => ({ ...line, polarity: pureBits[index % 3] === "1" ? "yang" as const : "yin" as const }));
  const purePalace = { ...palace, palaceStage: "pure" as const, shi: 6, ying: 3 };
  const pureLines = enrichLines(fake, palace.palace, palace.palace, purePalace);
  const hidden = pureLines
    .filter((line) => line.relation === relation)
    .map((line) => {
      let power = strength(line.element, context.monthBranch).score;
      const dayRelation = context.dayBranch === line.branch ? "same" : elementRelation(BRANCH_ELEMENT[context.dayBranch], line.element);
      if (line.branch === context.dayBranch) power += 2;
      else if (dayRelation === "generates") power += 1;
      else if (dayRelation === "controls") power -= 1;
      if (line.branch === context.monthBranch) power += 2;
      if (CLASH[line.branch] === context.monthBranch) power -= 2;
      return { line, power };
    })
    .sort((a, b) => b.power - a.power || a.line.position - b.line.position)[0]?.line;
  if (!hidden) return null;
  const flying = lines[hidden.position - 1];
  return {
    relation, line: hidden.position, branch: hidden.branch, element: hidden.element,
    flyingBranch: flying.branch, flyingLine: flying.position, flyingMoving: flying.moving,
    relationToFlying: elementRelation(hidden.element, flying.element),
    void: voidBranches(context.dayStem, context.dayBranch).includes(hidden.branch),
    monthStrength: strength(hidden.element, context.monthBranch).score,
  };
}

export function analyzeTraditional(lines: readonly LiuyaoLine[], palace: PalaceStructure, context?: LiuyaoAnalysisContext): { analysis: LiuyaoTraditionalAnalysis; evidence: LiuyaoEvidence[] } {
  if (!context) return {
    analysis: { status: "context_required", usefulGod: null, strength: null, relationships: [], hiddenSpirit: null, timing: null, tendency: "undetermined", uncertainty: "high", missingContext: ["topic", "monthBranch", "dayStem", "dayBranch"] },
    evidence: [{ rule: "analysis_context_required", conclusion: "装卦已完成；用神、旺衰、生克、旬空、六神与应期必须由明确的所测主题和历法上下文计算。", confidence: 1 }],
  };
  const evidence: LiuyaoEvidence[] = [];
  const addEvidence = (item: LiuyaoEvidence) => evidence.push({
    id: `${item.rule}-${item.line ?? "all"}-${evidence.length + 1}`,
    effect: "neutral",
    strength: 0,
    technicalText: item.conclusion,
    plainMeaning: item.conclusion,
    ...item,
  });
  const target = context.usefulGod ?? TOPIC_RELATION[context.topic];
  const candidates = target === "shi" || target === "ying"
    ? lines.filter((line) => line.role === target)
    : lines.filter((line) => line.relation === target);
  const hidden = target === "shi" || target === "ying" || candidates.length ? null : hiddenSpirit(lines, palace, target, context);
  const candidateAssessments = candidates
    .map((line) => assessUsefulGodCandidate(line, context))
    .sort((a, b) => b.score - a.score || b.line.position - a.line.position);
  const useful = candidateAssessments[0]?.line;
  const candidateGap = candidateAssessments.length > 1 ? candidateAssessments[0].score - candidateAssessments[1].score : null;
  if (useful) addEvidence({
    rule: "useful_god_by_topic",
    conclusion: `所测主题 ${context.topic} 取 ${target} 为用神，第 ${useful.position} 爻入选。`,
    technicalText: `${target}为用，第${useful.position}爻；${candidateAssessments.map((item) => `第${item.line.position}爻 ${item.score}分（${item.reasons.join("、") || "无加减项"}）`).join("；")}。`,
    plainMeaning: `这件事最关键的落点在第${useful.position}爻，后面的判断都围绕它展开。`,
    confidence: candidateGap === null ? 0.9 : Math.min(0.88, 0.64 + Math.max(0, candidateGap) * 0.04),
    effect: "neutral", strength: 0, line: useful.position,
  });
  if (useful && candidateAssessments.length > 1) addEvidence({
    rule: "useful_god_multiple_candidates",
    conclusion: `${target}两现或多现，按旺衰、动静、世位与空破择第${useful.position}爻。`,
    technicalText: candidateAssessments.map((item) => `第${item.line.position}爻 ${item.score}分：${item.reasons.join("、") || "无显著加减项"}`).join("；"),
    plainMeaning: candidateGap && candidateGap >= 3 ? "同类关键因素不止一个，但主次差距比较清楚，因此以更有力的这一爻为主。" : "同类关键因素不止一个，而且力量接近；主判断有落点，但另一爻也可能形成旁支或竞争。",
    confidence: candidateGap === null ? 0.7 : Math.min(0.86, 0.62 + Math.max(0, candidateGap) * 0.04),
    effect: candidateGap && candidateGap >= 3 ? "neutral" : "mixed", strength: 0, line: useful.position,
  });
  if (!useful && hidden) addEvidence({
    rule: "hidden_spirit", conclusion: `用神不上卦，取第 ${hidden.line} 爻伏神。`,
    technicalText: `用神不上卦，伏于第${hidden.line}爻，飞神为${BRANCH_NAMES[hidden.flyingBranch]}。`,
    plainMeaning: "关键条件不是没有，而是还藏在下面，暂时没有直接站到明面上。",
    confidence: 0.68, effect: "mixed", strength: -0.5, line: hidden.line,
  });
  const usefulStrength = useful ? strength(useful.element, context.monthBranch) : null;
  if (useful && usefulStrength) addEvidence({
    rule: "month_strength", conclusion: `用神五行相对于月建为 ${usefulStrength.level}。`,
    technicalText: `用神${ELEMENT_NAMES[useful.element]}相对月建${BRANCH_NAMES[context.monthBranch]}为${STRENGTH_NAMES[usefulStrength.level]}。`,
    plainMeaning: usefulStrength.score > 0 ? "关键条件当前有时令支撑，做事不算没力。" : usefulStrength.score < 0 ? "关键条件眼下力量偏弱，想推进会更费劲。" : "关键条件有用，但持续推进会有消耗。",
    confidence: 0.82, effect: usefulStrength.score > 0 ? "support" : usefulStrength.score < 0 ? "obstruct" : "mixed", strength: usefulStrength.score, line: useful.position,
  });
  const relationships: LiuyaoTraditionalAnalysis["relationships"] = [];
  let score = usefulStrength?.score ?? 0;
  const body = hexagramBody(lines, palace);
  addEvidence({
    rule: "hexagram_body_location",
    conclusion: `月卦身取${BRANCH_NAMES[body.branch]}${body.lines.length ? `，见于第${body.lines.join("、")}爻` : "，不上卦"}。`,
    technicalText: `世爻在第${palace.shi}爻属${body.polarity === "yang" ? "阳" : "阴"}，按${body.polarity === "yang" ? "子" : "午"}起初爻顺数至世位，月卦身为${BRANCH_NAMES[body.branch]}${body.lines.length ? `，对应第${body.lines.join("、")}爻` : "，本卦六爻无同支"}。`,
    plainMeaning: body.lines.length ? "卦身给这件事标出一个落点，可用来辅助看事情落在哪一层；它本身不单独决定吉凶。" : "卦身没有直接落到明爻上，只保留为结构线索，不拿它硬凑结论。",
    confidence: 0.76, effect: "neutral", strength: 0, line: body.lines[0],
  });
  if (palace.palaceStage === "wandering_soul") addEvidence({
    rule: "wandering_soul_structure", conclusion: "本卦处游魂宫位。",
    technicalText: `${palace.palace}宫游魂卦，世在第${palace.shi}爻。`,
    plainMeaning: "局面更容易出现心意游移、人在外或方向未定的感觉；这是变化背景，不等于事情必散。",
    confidence: 0.78, effect: "mixed", strength: 0,
  });
  if (palace.palaceStage === "returning_soul") addEvidence({
    rule: "returning_soul_structure", conclusion: "本卦处归魂宫位。",
    technicalText: `${palace.palace}宫归魂卦，世在第${palace.shi}爻。`,
    plainMeaning: "局面带着回到旧处、旧人旧题再现或重新收拢的背景；是否真能回成，还要看用神与世应。",
    confidence: 0.78, effect: "mixed", strength: 0,
  });
  const moving = lines.filter((line) => line.moving);
  if (moving.length === 1) addEvidence({
    rule: "single_moving_line", conclusion: `第${moving[0].position}爻独发。`,
    technicalText: `全卦仅第${moving[0].position}爻发动，其六亲为${RELATION_NAMES[moving[0].relation]}${moving[0].role ? `、临${moving[0].role === "shi" ? "世" : "应"}` : ""}。`,
    plainMeaning: "全卦只有这一处主动变化，读卦时它是最集中的剧情焦点，但不能脱离用神旺衰单独定吉凶。",
    confidence: 0.88, effect: "neutral", strength: 0, line: moving[0].position,
  });
  if (moving.length === 5) {
    const still = lines.find((line) => !line.moving)!;
    addEvidence({
      rule: "single_static_line", conclusion: `第${still.position}爻独静。`,
      technicalText: `全卦五爻发动，仅第${still.position}爻安静，其六亲为${RELATION_NAMES[still.relation]}${still.role ? `、临${still.role === "shi" ? "世" : "应"}` : ""}。`,
      plainMeaning: "四周都在变，只有这一处保持不动；它是观察局面靠什么定住的焦点，不直接等于吉或凶。",
      confidence: 0.86, effect: "neutral", strength: 0, line: still.position,
    });
  }
  const pattern = branchPattern(lines);
  if (pattern === "six_combine") addEvidence({
    rule: "six_combine_structure", conclusion: "本卦为六合结构。",
    technicalText: "内外三组地支逐组六合，卦势偏连接、牵绊与缓进。",
    plainMeaning: "这件事不太像一刀切，更像彼此还连着、进展偏慢；合不等于一定好，也可能是暂时放不开。",
    confidence: 0.82, effect: "mixed", strength: 0.5,
  });
  if (pattern === "six_clash") addEvidence({
    rule: "six_clash_structure", conclusion: "本卦为六冲结构。",
    technicalText: "内外三组地支逐组相冲，卦势偏变化、松动与难久持。",
    plainMeaning: "局面动得快，也容易散；冲不等于一定坏，但原来的状态很难一直照旧。",
    confidence: 0.82, effect: "mixed", strength: 0.5,
  });
  const repeatedChanges = lines.filter((line) => line.moving && line.changedBranch === line.branch);
  const reversedChanges = lines.filter((line) => line.moving && line.changedBranch === CLASH[line.branch]);
  if (repeatedChanges.length) {
    score -= 0.5;
    addEvidence({
      rule: "moving_lines_repeat_fuyin", conclusion: `第${repeatedChanges.map((line) => line.position).join("、")}爻动而支复见，为伏吟线索。`,
      technicalText: repeatedChanges.map((line) => `第${line.position}爻${BRANCH_NAMES[line.branch]}化${BRANCH_NAMES[line.changedBranch!]}`).join("；"),
      plainMeaning: "变化发生了，却容易绕回原处；更像同一主题反复推进，而不是立刻换成全新的局面。",
      confidence: 0.76, effect: "mixed", strength: -0.5,
    });
  }
  if (reversedChanges.length) {
    score -= 1;
    addEvidence({
      rule: "moving_lines_reverse_fanyin", conclusion: `第${reversedChanges.map((line) => line.position).join("、")}爻动而化冲，为反吟线索。`,
      technicalText: reversedChanges.map((line) => `第${line.position}爻${BRANCH_NAMES[line.branch]}化${BRANCH_NAMES[line.changedBranch!]}相冲`).join("；"),
      plainMeaning: "事情动起来后容易出现方向回摆或前后相反的变化，需要给反复留出余地。",
      confidence: 0.78, effect: "obstruct", strength: -1,
    });
  }
  if (useful) {
    const dayClashesUseful = CLASH[context.dayBranch] === useful.branch;
    const dayCombinesUseful = COMBINE[context.dayBranch] === useful.branch;
    const voidOpenedByClash = Boolean(useful.void && dayClashesUseful);
    const monthRelation = context.monthBranch === useful.branch ? "same" : elementRelation(BRANCH_ELEMENT[context.monthBranch], useful.element);
    const dayRelation = context.dayBranch === useful.branch ? "same" : elementRelation(BRANCH_ELEMENT[context.dayBranch], useful.element);
    relationships.push({ source: "month", target: `line_${useful.position}`, relation: monthRelation });
    relationships.push({ source: "day", target: `line_${useful.position}`, relation: dayRelation });
    if (monthRelation === "generates" || monthRelation === "same") score += 1;
    if (dayRelation === "generates" || dayRelation === "same") score += 1;
    if (dayRelation === "controls") score -= 1;
    if (dayRelation === "generates") addEvidence({ rule: "day_generates_useful", conclusion: "日辰生用神。", technicalText: `日辰${BRANCH_NAMES[context.dayBranch]}生用神${ELEMENT_NAMES[useful.element]}。`, plainMeaning: "眼前现实在给关键条件补力，事情更容易接得上。", confidence: 0.84, effect: "support", strength: 1, line: useful.position });
    if (dayRelation === "controls") addEvidence({ rule: "day_controls_useful", conclusion: "日辰克用神。", technicalText: `日辰${BRANCH_NAMES[context.dayBranch]}克用神${ELEMENT_NAMES[useful.element]}。`, plainMeaning: "眼前现实正在压住关键条件，推进时会明显感觉到掣肘。", confidence: 0.84, effect: "obstruct", strength: -1, line: useful.position });
    if (CLASH[context.monthBranch] === useful.branch) {
      relationships.push({ source: "month", target: `line_${useful.position}`, relation: "clash" });
      score -= 2;
      addEvidence({ rule: "month_break", conclusion: "用神受月建相冲，为月破。", technicalText: `${BRANCH_NAMES[useful.branch]}受月建${BRANCH_NAMES[context.monthBranch]}冲，为月破。`, plainMeaning: "关键条件当前被大环境冲散，表面有机会也不容易稳稳接住。", confidence: 0.9, effect: "obstruct", strength: -2, line: useful.position });
    }
    if (dayClashesUseful) {
      relationships.push({ source: "day", target: `line_${useful.position}`, relation: "clash" });
      if (voidOpenedByClash) {
        addEvidence({ rule: "void_clashed_open", conclusion: "旬空用神逢日冲，作冲空候选。", technicalText: `用神${BRANCH_NAMES[useful.branch]}旬空，日辰${BRANCH_NAMES[context.dayBranch]}冲之。`, plainMeaning: "原本悬着的关键条件被现实碰了一下，有机会显形，但能不能站稳还要看自身有没有力。", confidence: 0.72, effect: "mixed", strength: 0.5, line: useful.position });
      } else if (useful.moving) {
        addEvidence({ rule: "moving_line_clashed", conclusion: "发动用神又逢日冲。", technicalText: `用神${BRANCH_NAMES[useful.branch]}发动并受日辰${BRANCH_NAMES[context.dayBranch]}冲。`, plainMeaning: "事情已经在动，又被现实推了一把，变化会更快，但稳定性未必跟得上。", confidence: 0.8, effect: "mixed", strength: 0.5, line: useful.position });
      } else {
        const rooted = usefulStrength !== null && usefulStrength.score > 0 && CLASH[context.monthBranch] !== useful.branch;
        score += rooted ? 0.5 : -1;
        addEvidence(rooted
          ? { rule: "hidden_movement", conclusion: "旺静用神逢日冲，作暗动看。", technicalText: `静爻用神${BRANCH_NAMES[useful.branch]}得月令生扶而逢日辰${BRANCH_NAMES[context.dayBranch]}冲，旺而暗动。`, plainMeaning: "表面还没宣布变化，底下其实已经被现实推动；关键条件会比看起来更快有动作。", confidence: 0.78, effect: "support", strength: 0.5, line: useful.position }
          : { rule: "day_break", conclusion: "衰静用神逢日冲，作日破看。", technicalText: `静爻用神${BRANCH_NAMES[useful.branch]}无月令根气而受日辰${BRANCH_NAMES[context.dayBranch]}冲，按日破处理。`, plainMeaning: "关键条件本来就不够稳，又被眼前变化冲散，短期兑现能力偏弱。", confidence: 0.82, effect: "obstruct", strength: -1, line: useful.position });
      }
    }
    if (dayCombinesUseful) {
      relationships.push({ source: "day", target: `line_${useful.position}`, relation: "combine" });
      if (useful.moving) {
        score -= 0.5;
        addEvidence({ rule: "moving_line_bound_by_combine", conclusion: "发动用神被日辰合住。", technicalText: `发动用神${BRANCH_NAMES[useful.branch]}与日辰${BRANCH_NAMES[context.dayBranch]}六合，作合绊看。`, plainMeaning: "事情有动作，却像被关系或条件牵住，暂时不容易痛快往前。", confidence: 0.76, effect: "obstruct", strength: -0.5, line: useful.position });
      } else {
        score += 1;
        addEvidence({ rule: "day_combine", conclusion: "静爻用神得日辰相合。", technicalText: `日辰${BRANCH_NAMES[context.dayBranch]}合静爻用神${BRANCH_NAMES[useful.branch]}。`, plainMeaning: "现实里有一股力量把关键条件接住，事情更容易搭上线，但推进速度偏慢。", confidence: 0.8, effect: "support", strength: 1, line: useful.position });
      }
    }
    if (context.dayBranch === dayTombFor(useful.element)) {
      const vigorous = useful.moving || usefulStrength?.score === 2 || useful.branch === context.monthBranch;
      score -= vigorous ? 0.5 : 1;
      addEvidence({
        rule: vigorous ? "day_tomb_with_vigor" : "day_tomb",
        conclusion: vigorous ? "用神临日墓，但自身仍有气。" : "用神入日墓。",
        technicalText: `用神${ELEMENT_NAMES[useful.element]}临${BRANCH_NAMES[context.dayBranch]}日墓${vigorous ? "，兼见发动或月令有气" : ""}。`,
        plainMeaning: vigorous ? "关键条件暂时被收住，但不是彻底没力，更像有东西还压在里面没展开。" : "关键条件像被收进仓里，眼下难直接发挥，通常要等它松开或被冲动。",
        confidence: vigorous ? 0.66 : 0.74, effect: vigorous ? "mixed" : "obstruct", strength: vigorous ? -0.5 : -1, line: useful.position,
      });
    }
    const externalActiveBranches = [
      context.monthBranch,
      context.dayBranch,
      ...lines.filter((line) => line.moving && line.position !== useful.position).flatMap((line) => line.changedBranch ? [line.branch, line.changedBranch] : [line.branch]),
      ...(useful.changedBranch ? [useful.changedBranch] : []),
    ];
    const harmfulBranch = externalActiveBranches.find((branch) => HARM[useful.branch] === branch);
    if (harmfulBranch) {
      score -= 0.5;
      addEvidence({
        rule: "branch_harm_on_useful", conclusion: `用神${BRANCH_NAMES[useful.branch]}与${BRANCH_NAMES[harmfulBranch]}相害。`,
        technicalText: `用神${BRANCH_NAMES[useful.branch]}与日月、动变爻中的${BRANCH_NAMES[harmfulBranch]}构成六害。`,
        plainMeaning: "这里更像隐性的别扭、误解或损耗，不一定正面冲突，却会让配合打折。",
        confidence: 0.64, effect: "mixed", strength: -0.5, line: useful.position,
      });
    }
    const punishment = PUNISHMENTS.find((group) => group.includes(useful.branch) && group.every((branch) => branch === useful.branch || externalActiveBranches.includes(branch)));
    const selfPunishment = SELF_PUNISHMENTS.has(useful.branch) && externalActiveBranches.includes(useful.branch);
    if (punishment || selfPunishment) {
      score -= 0.5;
      const branches = punishment ?? [useful.branch, useful.branch];
      addEvidence({
        rule: selfPunishment ? "self_punishment_on_useful" : "branch_punishment_on_useful",
        conclusion: `${branches.map((branch) => BRANCH_NAMES[branch]).join("、")}成刑象。`,
        technicalText: selfPunishment
          ? `用神${BRANCH_NAMES[useful.branch]}与日月或变爻复见，构成自刑线索。`
          : `${branches.map((branch) => BRANCH_NAMES[branch]).join("、")}在用神与日月、动变爻中齐见，构成相刑线索。`,
        plainMeaning: selfPunishment ? "阻力更像内部反复、自己卡自己，需要防止同一个问题循环出现。" : "几股力量不是直接对撞，而是彼此拧着、互相施压，过程容易反复。",
        confidence: 0.62, effect: "mixed", strength: -0.5, line: useful.position,
      });
    }
    const selfLine = lines.find((line) => line.role === "shi");
    if (selfLine) {
      const holding = shiHoldingInterpretation(selfLine.relation, context.topic, lineIsWeak(selfLine, context));
      score += holding.amount;
      addEvidence({
        rule: `shi_holds_${selfLine.relation}`,
        conclusion: `${RELATION_NAMES[selfLine.relation]}持世${lineIsWeak(selfLine, context) ? "而自身偏弱" : ""}。`,
        technicalText: `第${selfLine.position}爻临世，六亲为${RELATION_NAMES[selfLine.relation]}${selfLine.void ? "、旬空" : ""}${CLASH[context.monthBranch] === selfLine.branch ? "、月破" : ""}；按${context.topic}专题解释。`,
        plainMeaning: holding.plainMeaning,
        confidence: 0.7,
        effect: holding.effect,
        strength: holding.amount,
        line: selfLine.position,
      });
    }
    const specializedShiYing = context.topic === "partnership" || context.topic === "relationship_male" || context.topic === "relationship_female";
    if (selfLine && useful.position !== selfLine.position && !specializedShiYing) {
      const usefulToSelf = elementRelation(useful.element, selfLine.element);
      const selfToUseful = elementRelation(selfLine.element, useful.element);
      if (usefulToSelf === "generates") {
        score += 0.5;
        addEvidence({ rule: "useful_generates_shi", conclusion: "用神生世爻。", technicalText: `用神第${useful.position}爻${ELEMENT_NAMES[useful.element]}生世爻第${selfLine.position}爻${ELEMENT_NAMES[selfLine.element]}。`, plainMeaning: "关键条件在向你这边给力，事情与自身承接之间比较顺。", confidence: 0.74, effect: "support", strength: 0.5, line: useful.position });
      } else if (usefulToSelf === "controls") {
        score -= 0.5;
        addEvidence({ rule: "useful_controls_shi", conclusion: "用神克世爻。", technicalText: `用神第${useful.position}爻${ELEMENT_NAMES[useful.element]}克世爻第${selfLine.position}爻${ELEMENT_NAMES[selfLine.element]}。`, plainMeaning: "你想要的结果或关键条件本身也会给你压力，得到它未必轻松。", confidence: 0.74, effect: "obstruct", strength: -0.5, line: useful.position });
      } else if (selfToUseful === "generates") {
        score -= 0.25;
        addEvidence({ rule: "shi_generates_useful", conclusion: "世爻生用神。", technicalText: `世爻第${selfLine.position}爻${ELEMENT_NAMES[selfLine.element]}生用神第${useful.position}爻${ELEMENT_NAMES[useful.element]}。`, plainMeaning: "这件事更依赖你主动投入和托举，能推进，但成本主要从你这边出。", confidence: 0.72, effect: "mixed", strength: -0.25, line: selfLine.position });
      } else if (selfToUseful === "controls") {
        score -= 0.5;
        addEvidence({ rule: "shi_controls_useful", conclusion: "世爻克用神。", technicalText: `世爻第${selfLine.position}爻${ELEMENT_NAMES[selfLine.element]}克用神第${useful.position}爻${ELEMENT_NAMES[useful.element]}。`, plainMeaning: "你和目标之间有一层对抗感，越用力控制，越可能增加推进阻力。", confidence: 0.74, effect: "obstruct", strength: -0.5, line: selfLine.position });
      }
      if (CLASH[selfLine.branch] === useful.branch) {
        score -= 0.5;
        addEvidence({ rule: "shi_use_clash", conclusion: "世爻与用神相冲。", technicalText: `世爻${BRANCH_NAMES[selfLine.branch]}与用神${BRANCH_NAMES[useful.branch]}六冲。`, plainMeaning: "你当前的状态和目标不在同一个节奏上，推进时容易一边想要、一边又把它冲开。", confidence: 0.76, effect: "mixed", strength: -0.5, line: useful.position });
      } else if (COMBINE[selfLine.branch] === useful.branch) {
        addEvidence({ rule: "shi_use_combine", conclusion: "世爻与用神相合。", technicalText: `世爻${BRANCH_NAMES[selfLine.branch]}与用神${BRANCH_NAMES[useful.branch]}六合。`, plainMeaning: "你和目标之间有连接，比较容易搭上线；但合也可能带来牵绊，仍要看动静与空破。", confidence: 0.74, effect: "mixed", strength: 0, line: useful.position });
      }
    }
    const otherLine = lines.find((line) => line.role === "ying");
    if (selfLine?.moving) addEvidence({
      rule: "shi_line_changes",
      conclusion: "世爻发动，自身立场或做法正在变化。",
      technicalText: `世爻第${selfLine.position}爻${BRANCH_NAMES[selfLine.branch]}发动${selfLine.changedBranch ? `化${BRANCH_NAMES[selfLine.changedBranch]}` : ""}。`,
      plainMeaning: "你不是被动等结果的一方；自己的选择、节奏或投入方式正在改，后续关系不能只按起卦时的原状看。",
      confidence: 0.78, effect: "mixed", strength: 0, line: selfLine.position,
    });
    if (otherLine?.moving) addEvidence({
      rule: "ying_line_changes",
      conclusion: "应爻发动，对方或外部条件正在变化。",
      technicalText: `应爻第${otherLine.position}爻${BRANCH_NAMES[otherLine.branch]}发动${otherLine.changedBranch ? `化${BRANCH_NAMES[otherLine.changedBranch]}` : ""}。`,
      plainMeaning: "对方或外部环境并非静止，当前态度不能直接外推成最终状态；要继续观察它变到哪里。",
      confidence: 0.78, effect: "mixed", strength: 0, line: otherLine.position,
    });
    if (selfLine && otherLine && (selfLine.moving || otherLine.moving)) {
      const before = elementRelation(otherLine.element, selfLine.element);
      const afterSelfElement = selfLine.changedElement ?? selfLine.element;
      const afterOtherElement = otherLine.changedElement ?? otherLine.element;
      const after = elementRelation(afterOtherElement, afterSelfElement);
      const afterSelfBranch = selfLine.changedBranch ?? selfLine.branch;
      const afterOtherBranch = otherLine.changedBranch ?? otherLine.branch;
      const relationalTopic = context.topic === "partnership" || context.topic === "relationship_male" || context.topic === "relationship_female" || context.scenario === "job_search" || context.scenario === "reconciliation";
      const afterCombine = COMBINE[afterSelfBranch] === afterOtherBranch;
      const afterClash = CLASH[afterSelfBranch] === afterOtherBranch;
      const amount = !relationalTopic ? 0 : after === "generates" ? 0.5 : after === "controls" ? -0.5 : afterClash ? -0.5 : afterCombine ? 0.5 : 0;
      score += amount;
      addEvidence({
        rule: "shi_ying_relation_after_change",
        conclusion: `世应动变后关系由${before}转为${after}${afterCombine ? "，变后相合" : afterClash ? "，变后相冲" : ""}。`,
        technicalText: `世爻以${ELEMENT_NAMES[afterSelfElement]}、${BRANCH_NAMES[afterSelfBranch]}看变后状态；应爻以${ELEMENT_NAMES[afterOtherElement]}、${BRANCH_NAMES[afterOtherBranch]}看变后状态，应对世由${before}转${after}${afterCombine ? "并六合" : afterClash ? "并六冲" : ""}。`,
        plainMeaning: after === "generates" ? "变化之后，对方或外部条件更能向你这边给力。" : after === "controls" ? "变化之后，对方或外部条件对你的约束更强。" : afterCombine ? "变化之后双方更容易重新接上，但也可能形成牵绊。" : afterClash ? "变化之后双方节奏更容易对冲，稳定性要打折。" : before === after ? "双方虽然在动，基本的力量关系暂未改变。" : "双方动过之后，互动方式已经换挡，不能只按原来的关系判断。",
        confidence: 0.74,
        effect: amount > 0 ? "support" : amount < 0 ? "obstruct" : "mixed",
        strength: amount,
        line: otherLine.position,
      });
    }
    if (context.topic === "partnership") {
      const selfLine = lines.find((line) => line.role === "shi");
      const otherLine = lines.find((line) => line.role === "ying");
      if (selfLine && otherLine) {
        const otherToSelf = elementRelation(otherLine.element, selfLine.element);
        const selfToOther = elementRelation(selfLine.element, otherLine.element);
        if (otherToSelf === "generates") {
          score += 1;
          addEvidence({ rule: "ying_generates_shi", conclusion: "应爻生世爻。", technicalText: `应爻${ELEMENT_NAMES[otherLine.element]}生世爻${ELEMENT_NAMES[selfLine.element]}。`, plainMeaning: "对方或外部条件有向你这边给力的迹象，合作并非只有你单方面撑着。", confidence: 0.76, effect: "support", strength: 1, line: otherLine.position });
        } else if (otherToSelf === "controls") {
          score -= 1;
          addEvidence({ rule: "ying_controls_shi", conclusion: "应爻克世爻。", technicalText: `应爻${ELEMENT_NAMES[otherLine.element]}克世爻${ELEMENT_NAMES[selfLine.element]}。`, plainMeaning: "对方或外部条件对你形成约束，合作里的主动权和压力并不对等。", confidence: 0.76, effect: "obstruct", strength: -1, line: otherLine.position });
        } else if (selfToOther === "generates") {
          score -= 0.5;
          addEvidence({ rule: "shi_generates_ying", conclusion: "世爻生应爻。", technicalText: `世爻${ELEMENT_NAMES[selfLine.element]}生应爻${ELEMENT_NAMES[otherLine.element]}。`, plainMeaning: "这段合作更像由你主动投入和托举，能推进，但要留意是否长期变成单向供给。", confidence: 0.74, effect: "mixed", strength: -0.5, line: selfLine.position });
        }
      }
    }
    if (context.topic === "relationship_male" || context.topic === "relationship_female") {
      const selfLine = lines.find((line) => line.role === "shi");
      const otherLine = lines.find((line) => line.role === "ying");
      if (selfLine && otherLine) {
        const otherToSelf = elementRelation(otherLine.element, selfLine.element);
        const selfToOther = elementRelation(selfLine.element, otherLine.element);
        if (otherToSelf === "generates") {
          score += 0.5;
          addEvidence({ rule: "relationship_ying_generates_shi", conclusion: "感情占中应爻生世爻。", technicalText: `对象用神之外，辅看世应：应爻${ELEMENT_NAMES[otherLine.element]}生世爻${ELEMENT_NAMES[selfLine.element]}。`, plainMeaning: "除了看对象那颗用神，双方互动里也有对方向你靠近或给力的一面。", confidence: 0.7, effect: "support", strength: 0.5, line: otherLine.position });
        } else if (otherToSelf === "controls") {
          score -= 0.5;
          addEvidence({ rule: "relationship_ying_controls_shi", conclusion: "感情占中应爻克世爻。", technicalText: `对象用神之外，辅看世应：应爻${ELEMENT_NAMES[otherLine.element]}克世爻${ELEMENT_NAMES[selfLine.element]}。`, plainMeaning: "双方互动里，对方或关系本身给你的压力更明显，不能只看有没有感情。", confidence: 0.7, effect: "obstruct", strength: -0.5, line: otherLine.position });
        } else if (selfToOther === "generates") {
          addEvidence({ rule: "relationship_shi_generates_ying", conclusion: "感情占中世爻生应爻。", technicalText: `对象用神之外，辅看世应：世爻${ELEMENT_NAMES[selfLine.element]}生应爻${ELEMENT_NAMES[otherLine.element]}。`, plainMeaning: "这段互动更像你在主动供给和靠近；能不能长久，要看对方是否也有实际回应。", confidence: 0.68, effect: "mixed", strength: -0.5, line: selfLine.position });
        }
      }
    }
    const auxiliary = TOPIC_AUXILIARY[context.topic];
    if (auxiliary) {
      const auxiliaryLine = lines
        .filter((line) => line.relation === auxiliary.relation)
        .sort((a, b) => Number(b.moving) - Number(a.moving) || Number(b.branch === context.dayBranch) - Number(a.branch === context.dayBranch) || Number(b.branch === context.monthBranch) - Number(a.branch === context.monthBranch))[0];
      if (auxiliaryLine && (auxiliaryLine.moving || auxiliaryLine.branch === context.dayBranch || auxiliaryLine.branch === context.monthBranch)) {
        const weakened = Boolean(auxiliaryLine.void || CLASH[context.monthBranch] === auxiliaryLine.branch);
        addEvidence({
          rule: `topic_auxiliary_${context.topic}`,
          conclusion: `${auxiliary.label}对应的${RELATION_NAMES[auxiliary.relation]}爻${weakened ? "空破" : "活跃"}。`,
          technicalText: `${context.topic}专题除主用神外，辅看${auxiliary.label}：第${auxiliaryLine.position}爻${auxiliaryLine.moving ? "发动" : "临日月"}${weakened ? "，兼见旬空或月破" : ""}。`,
          plainMeaning: weakened ? `${auxiliary.label}这条辅助链虽然显眼，但当前承接偏弱，不能只看主结论就忽略落地条件。` : `${auxiliary.label}这条辅助链正在发挥作用，主结论能否落地还要连同它一起看。`,
          confidence: 0.68, effect: weakened ? "mixed" : "neutral", strength: weakened ? -0.5 : 0, line: auxiliaryLine.position,
        });
      }
    }
    if (context.scenarioFocus) addEvidence({
      rule: `scenario_focus_${context.scenarioFocus}`,
      conclusion: `本次专题目标为“${SCENARIO_FOCUS_NAMES[context.scenarioFocus]}”。`,
      technicalText: `同一主题按用户问题拆为${SCENARIO_FOCUS_NAMES[context.scenarioFocus]}，只调用与该阶段相关的辅助证据。`,
      plainMeaning: `这次只回答“${SCENARIO_FOCUS_NAMES[context.scenarioFocus]}”，不把同一主题下的其他阶段混成一个结论。`,
      confidence: 0.98, effect: "neutral", strength: 0,
    });
    if (context.scenario === "job_search") {
      const applicant = lines.find((line) => line.role === "shi");
      const employer = lines.find((line) => line.role === "ying");
      if (applicant && employer && context.scenarioFocus !== "job_offer") {
        const employerToApplicant = elementRelation(employer.element, applicant.element);
        const applicantToEmployer = elementRelation(applicant.element, employer.element);
        const favorable = employerToApplicant === "generates";
        const unfavorable = employerToApplicant === "controls";
        const amount = favorable ? 0.5 : unfavorable ? -0.5 : applicantToEmployer === "generates" ? -0.25 : 0;
        score += amount;
        addEvidence({
          rule: "job_search_employer_relation", conclusion: `求职专题辅看应爻与世爻，关系为${employerToApplicant}。`,
          technicalText: `应爻第${employer.position}爻代表招聘方，世爻第${applicant.position}爻代表求职者；应对世为${employerToApplicant}${applicantToEmployer === "generates" ? "，兼见世生应" : ""}。`,
          plainMeaning: favorable ? "招聘方或岗位条件有向你这边给力的一面。" : unfavorable ? "岗位或招聘方对你形成明显约束，匹配和主动权偏弱。" : applicantToEmployer === "generates" ? "这次机会更依赖你主动证明和投入，别把单向努力误当成对方已经接住。" : "双方暂时没有清楚的生扶或克制，能否录用还要回到用神和文书条件。",
          confidence: 0.72, effect: favorable ? "support" : unfavorable ? "obstruct" : "mixed", strength: amount, line: employer.position,
        });
      }
      const documentLine = lines.filter((line) => line.relation === "parents")
        .sort((a, b) => Number(b.moving) - Number(a.moving) || Number(b.branch === context.dayBranch) - Number(a.branch === context.dayBranch) || Number(b.branch === context.monthBranch) - Number(a.branch === context.monthBranch))[0];
      if (documentLine && context.scenarioFocus !== "job_interview" && (documentLine.moving || documentLine.branch === context.dayBranch || documentLine.branch === context.monthBranch)) {
        const weak = Boolean(documentLine.void || CLASH[context.monthBranch] === documentLine.branch);
        score += weak ? -0.5 : 0.5;
        addEvidence({ rule: "job_search_documents", conclusion: `求职文书与录用手续${weak ? "空破" : "得动旺"}。`, technicalText: `父母第${documentLine.position}爻主简历、通知、合同与手续，${documentLine.moving ? "发动" : "临日月"}${weak ? "而兼见旬空或月破" : ""}。`, plainMeaning: weak ? "简历、通知、合同或流程这条链容易卡住，口头信号不能直接当成录用落地。" : "简历、通知、合同或流程条件比较有力，机会更容易走到可确认的一步。", confidence: 0.72, effect: weak ? "obstruct" : "support", strength: weak ? -0.5 : 0.5, line: documentLine.position });
      }
    }
    if (context.scenario === "exam") {
      const evaluationLine = lines.filter((line) => line.relation === "officials")
        .sort((a, b) => Number(b.moving) - Number(a.moving) || Number(b.branch === context.dayBranch) - Number(a.branch === context.dayBranch) || Number(b.branch === context.monthBranch) - Number(a.branch === context.monthBranch))[0];
      if (evaluationLine && (!context.scenarioFocus || context.scenarioFocus === "exam_admission") && (evaluationLine.moving || evaluationLine.branch === context.dayBranch || evaluationLine.branch === context.monthBranch)) {
        const relation = elementRelation(evaluationLine.element, useful.element);
        const weak = Boolean(evaluationLine.void || CLASH[context.monthBranch] === evaluationLine.branch);
        const amount = weak ? 0 : relation === "generates" ? 0.5 : relation === "controls" ? -0.5 : 0;
        score += amount;
        addEvidence({ rule: "exam_evaluation_conditions", conclusion: `考试专题官鬼评价条件活跃${weak ? "但空破" : ""}。`, technicalText: `官鬼第${evaluationLine.position}爻主考试压力、评价与录取门槛，${evaluationLine.moving ? "发动" : "临日月"}；对父母用神关系为${relation}${weak ? "，自身兼见空破" : ""}。`, plainMeaning: weak ? "考试压力或评价条件看起来显眼，但自身承接不稳，不能只凭焦虑判断结果。" : relation === "generates" ? "评价条件虽带来压力，却能托住准备、材料或成绩这条主线。" : relation === "controls" ? "评价门槛正在压住准备或成绩这条主线，需要把薄弱环节落实到现实复习与材料。" : "压力和评价条件很显眼，但它没有单独给出结果方向，仍以父母用神旺衰为主。", confidence: 0.7, effect: amount > 0 ? "support" : amount < 0 ? "obstruct" : "mixed", strength: amount, line: evaluationLine.position });
      }
    }
    if (context.scenario === "reconciliation") {
      const self = lines.find((line) => line.role === "shi");
      const other = lines.find((line) => line.role === "ying");
      if (context.scenarioFocus === "relationship_contact" && other) {
        const weak = lineIsWeak(other, context);
        const amount = other.moving && !weak ? 0.5 : weak ? -0.5 : 0;
        score += amount;
        addEvidence({
          rule: "relationship_contact_signal",
          conclusion: `联系专题看应爻，当前${other.moving ? "发动" : "安静"}${weak ? "且偏弱" : ""}。`,
          technicalText: `应爻第${other.position}爻代表对方与外部回应，${other.moving ? `发动化${other.changedBranch ? BRANCH_NAMES[other.changedBranch] : "变"}` : "安静"}${other.void ? "、旬空" : ""}${CLASH[context.monthBranch] === other.branch ? "、月破" : ""}。`,
          plainMeaning: amount > 0 ? "对方这一侧有主动变化，重新出现消息或动作的条件较强。" : amount < 0 ? "对方这一侧承接偏弱，即使有念头，也不宜直接当成会落实的联系。" : "对方这一侧暂未出现明确动作，卦里不能把“仍有连接”直接说成“马上会联系”。",
          confidence: 0.76, effect: amount > 0 ? "support" : amount < 0 ? "obstruct" : "mixed", strength: amount, line: other.position,
        });
      }
      if (self && other && context.scenarioFocus !== "relationship_contact" && CLASH[self.branch] === other.branch) {
        score -= 0.5;
        addEvidence({ rule: "reconciliation_shi_ying_clash", conclusion: "复合专题世应相冲。", technicalText: `世爻${BRANCH_NAMES[self.branch]}与应爻${BRANCH_NAMES[other.branch]}六冲。`, plainMeaning: "双方现在的节奏或立场仍在对冲；旧关系回来不等于旧矛盾已经消失。", confidence: 0.78, effect: "obstruct", strength: -0.5, line: other.position });
      } else if (self && other && context.scenarioFocus !== "relationship_contact" && COMBINE[self.branch] === other.branch) {
        score += 0.5;
        addEvidence({ rule: "reconciliation_shi_ying_combine", conclusion: "复合专题世应相合。", technicalText: `世爻${BRANCH_NAMES[self.branch]}与应爻${BRANCH_NAMES[other.branch]}六合。`, plainMeaning: "双方仍有连接和重新搭上线的条件，但能否真正复合还要看空破、动爻和对象用神。", confidence: 0.76, effect: "support", strength: 0.5, line: other.position });
      }
    }
    if (context.scenario === "investment") {
      const riskLine = lines.filter((line) => line.relation === "officials")
        .sort((a, b) => Number(b.moving) - Number(a.moving) || Number(b.branch === context.dayBranch) - Number(a.branch === context.dayBranch) || Number(b.branch === context.monthBranch) - Number(a.branch === context.monthBranch))[0];
      if (riskLine && (riskLine.moving || riskLine.branch === context.dayBranch || riskLine.branch === context.monthBranch)) {
        const muted = Boolean(riskLine.void || CLASH[context.monthBranch] === riskLine.branch);
        score += muted ? 0 : -1;
        addEvidence({ rule: "investment_risk_factor", conclusion: `投资专题官鬼风险因素${muted ? "活跃但空破" : "活跃"}。`, technicalText: `官鬼第${riskLine.position}爻主风险、压力与不利条件，${riskLine.moving ? "发动" : "临日月"}${muted ? "，兼见旬空或月破" : ""}。`, plainMeaning: muted ? "风险信号出现了，但当前未必完全落地；仍应核验标的、仓位和退出条件。" : "风险与压力正在主动作用，不能只看财爻或收益想象，现实里要先核验损失承受能力。", confidence: 0.76, effect: muted ? "mixed" : "obstruct", strength: muted ? 0 : -1, line: riskLine.position });
      }
      const horizon = context.scenarioFocus === "investment_long_term" ? "长期" : "短线";
      addEvidence({
        rule: context.scenarioFocus === "investment_long_term" ? "investment_long_term_weighting" : "investment_short_term_weighting",
        conclusion: `${horizon}投资按不同证据层级判断。`,
        technicalText: context.scenarioFocus === "investment_long_term" ? "长期优先月令旺衰、原忌神持续性与化进化退；动爻只作过程变量。" : "短线优先财爻动变、回头生克、空破合冲与兄弟分财；月令作为背景。",
        plainMeaning: context.scenarioFocus === "investment_long_term" ? "长期问题不拿眼前一两次波动代替持有逻辑，重点看条件有没有持续性。" : "短线问题先看眼前波动、兑现和损失条件，不把长期想象拿来掩盖当前风险。",
        confidence: 0.9, effect: "neutral", strength: 0,
      });
    }
    if (context.topic === "health") {
      const illnessLine = lines
        .filter((line) => line.relation === "officials")
        .sort((a, b) => Number(b.moving) - Number(a.moving) || Number(b.branch === context.monthBranch) - Number(a.branch === context.monthBranch))[0];
      const reliefLine = lines.find((line) => line.relation === "offspring" && line.moving);
      if (illnessLine && (illnessLine.moving || illnessLine.branch === context.monthBranch || illnessLine.branch === context.dayBranch)) {
        score -= 1;
        addEvidence({ rule: "health_illness_factor_active", conclusion: "健康占中官鬼病象活跃。", technicalText: `官鬼第${illnessLine.position}爻${illnessLine.moving ? "发动" : "临日月"}，仅作传统病象因素。`, plainMeaning: "卦里代表症状与压力的因素比较显眼；这只能提醒你重视现实检查，不能用来判断病名或轻重。", confidence: 0.6, effect: "obstruct", strength: -1, line: illnessLine.position });
      }
      if (illnessLine && reliefLine && CONTROLS[reliefLine.element] === illnessLine.element) {
        score += 1;
        addEvidence({ rule: "health_relief_controls_illness", conclusion: "子孙发动制官鬼。", technicalText: `子孙第${reliefLine.position}爻发动，五行制官鬼病象。`, plainMeaning: "卦里也有一股缓解和恢复的力量在动；现实里仍应落实为休息、就医或遵循专业建议。", confidence: 0.58, effect: "support", strength: 1, line: reliefLine.position });
      }
    }
    for (const moving of lines.filter((line) => line.moving && line.position !== useful.position)) {
      const relation = elementRelation(moving.element, useful.element);
      const transformation = moving.changedBranch ? transformationDirection(moving.branch, moving.changedBranch) : null;
      relationships.push({ source: `moving_line_${moving.position}`, target: `line_${useful.position}`, relation });
      if (relation === "generates") {
        score += 1;
        addEvidence({ rule: "source_god_moves", conclusion: `第${moving.position}爻原神发动生用神。`, technicalText: `第${moving.position}爻原神${ELEMENT_NAMES[moving.element]}发动，生用神${ELEMENT_NAMES[useful.element]}。`, plainMeaning: "卦里有一股正在行动的助力，会把事情往前推。", confidence: 0.82, effect: "support", strength: 1, line: moving.position });
        if (transformation === "progress") {
          score += 0.5;
          addEvidence({ rule: "source_god_transforms_progress", conclusion: `第${moving.position}爻原神化进。`, technicalText: `原神由${BRANCH_NAMES[moving.branch]}化${BRANCH_NAMES[moving.changedBranch!]}，既生用神又化进。`, plainMeaning: "帮助这件事的力量不只启动了，后劲还在增强。", confidence: 0.78, effect: "support", strength: 0.5, line: moving.position });
        } else if (transformation === "retreat") {
          score -= 0.5;
          addEvidence({ rule: "source_god_transforms_retreat", conclusion: `第${moving.position}爻原神化退。`, technicalText: `原神由${BRANCH_NAMES[moving.branch]}化${BRANCH_NAMES[moving.changedBranch!]}，生用但化退。`, plainMeaning: "助力虽然出现了，但后劲在回收，不能只看开头那一下。", confidence: 0.76, effect: "mixed", strength: -0.5, line: moving.position });
        }
      } else if (relation === "controls") {
        score -= 1;
        addEvidence({ rule: "avoid_god_moves", conclusion: `第${moving.position}爻忌神发动克用神。`, technicalText: `第${moving.position}爻忌神${ELEMENT_NAMES[moving.element]}发动，克用神${ELEMENT_NAMES[useful.element]}。`, plainMeaning: "阻力不是静静摆着，而是在主动发生作用。", confidence: 0.82, effect: "obstruct", strength: -1, line: moving.position });
        if (transformation === "progress") {
          score -= 0.5;
          addEvidence({ rule: "avoid_god_transforms_progress", conclusion: `第${moving.position}爻忌神化进。`, technicalText: `忌神由${BRANCH_NAMES[moving.branch]}化${BRANCH_NAMES[moving.changedBranch!]}，克用且化进。`, plainMeaning: "阻力启动后还在加码，需要预留更多回旋空间。", confidence: 0.78, effect: "obstruct", strength: -0.5, line: moving.position });
        } else if (transformation === "retreat") {
          score += 0.5;
          addEvidence({ rule: "avoid_god_transforms_retreat", conclusion: `第${moving.position}爻忌神化退。`, technicalText: `忌神由${BRANCH_NAMES[moving.branch]}化${BRANCH_NAMES[moving.changedBranch!]}，虽克用但化退。`, plainMeaning: "阻力眼下存在，但后劲在减弱，不必把当前压力当成一直不变。", confidence: 0.76, effect: "mixed", strength: 0.5, line: moving.position });
        }
      }
    }
    if (useful.void) {
      score -= voidOpenedByClash ? 1 : 2;
      addEvidence({ rule: "useful_god_void", conclusion: voidOpenedByClash ? "用神旬空，兼逢日冲。" : "用神旬空。", technicalText: `用神${BRANCH_NAMES[useful.branch]}落旬空${voidOpenedByClash ? "，日辰冲空" : ""}。`, plainMeaning: voidOpenedByClash ? "关键条件原本落不到实处，现在被冲动而有显形机会，但仍要等现实兑现。" : "关键条件眼下有点落不到实处，承诺和期待需要等现实验证。", confidence: 0.9, effect: "obstruct", strength: voidOpenedByClash ? -1 : -2, line: useful.position });
    }
    if (useful.moving) score += 1;
    if (useful.moving && useful.changedElement) {
      const changeRelation = elementRelation(useful.changedElement, useful.element);
      if (changeRelation === "generates") {
        score += 2;
        addEvidence({ rule: "return_generation", conclusion: "用神发动化回头生。", technicalText: `用神发动，变爻${ELEMENT_NAMES[useful.changedElement]}回头生本爻${ELEMENT_NAMES[useful.element]}。`, plainMeaning: "事情动起来以后，后续变化反而会给它补力。", confidence: 0.88, effect: "support", strength: 2, line: useful.position });
      } else if (changeRelation === "controls") {
        score -= 2;
        addEvidence({ rule: "return_control", conclusion: "用神发动化回头克。", technicalText: `用神发动，变爻${ELEMENT_NAMES[useful.changedElement]}回头克本爻${ELEMENT_NAMES[useful.element]}。`, plainMeaning: "事情一旦启动，后续变化反而会回过头来给自己添阻力。", confidence: 0.88, effect: "obstruct", strength: -2, line: useful.position });
      }
      if (useful.changedBranch && transformationDirection(useful.branch, useful.changedBranch) === "progress") {
        score += 1;
        addEvidence({ rule: "transforms_progress", conclusion: "用神发动化进神。", technicalText: `用神由${BRANCH_NAMES[useful.branch]}化${BRANCH_NAMES[useful.changedBranch]}，为化进。`, plainMeaning: "事情不是原地打转，动起来以后力量还有逐步增强的趋势。", confidence: 0.84, effect: "support", strength: 1, line: useful.position });
      } else if (useful.changedBranch && transformationDirection(useful.branch, useful.changedBranch) === "retreat") {
        score -= 1;
        addEvidence({ rule: "transforms_retreat", conclusion: "用神发动化退神。", technicalText: `用神由${BRANCH_NAMES[useful.branch]}化${BRANCH_NAMES[useful.changedBranch]}，为化退。`, plainMeaning: "事情开始时有动作，但后劲更像在往回收。", confidence: 0.84, effect: "obstruct", strength: -1, line: useful.position });
      }
      if (useful.changedBranch && voidBranches(context.dayStem, context.dayBranch).includes(useful.changedBranch)) {
        score -= 1;
        addEvidence({ rule: "transforms_void", conclusion: "用神发动化空。", technicalText: `用神变爻${BRANCH_NAMES[useful.changedBranch]}落旬空。`, plainMeaning: "事情动起来之后，后续承接容易出现一段落空或迟滞。", confidence: 0.86, effect: "obstruct", strength: -1, line: useful.position });
      }
      if (useful.changedBranch && CLASH[context.monthBranch] === useful.changedBranch) {
        score -= 1;
        addEvidence({ rule: "transforms_month_break", conclusion: "用神发动化月破。", technicalText: `用神变爻${BRANCH_NAMES[useful.changedBranch]}受月建冲破。`, plainMeaning: "后续变化和大环境顶着来，落地稳定性会打折。", confidence: 0.86, effect: "obstruct", strength: -1, line: useful.position });
      }
    }
    const harmony = activeThreeHarmony(lines, context.monthBranch, context.dayBranch);
    if (harmony) {
      const relation = elementRelation(harmony.element, useful.element);
      const supportive = relation === "same" || relation === "generates";
      const obstructive = relation === "controls" || relation === "generated_by";
      const harmonyStrength = supportive ? 1 : obstructive ? -1 : -0.5;
      score += harmonyStrength;
      addEvidence({
        rule: supportive ? "three_harmony_supports_useful" : obstructive ? "three_harmony_drains_or_controls_useful" : "three_harmony_contested",
        conclusion: `日月与动爻构成三合${ELEMENT_NAMES[harmony.element]}局。`,
        technicalText: `${harmony.branches.map((branch) => BRANCH_NAMES[branch]).join("、")}三支齐见并含动爻，合成${ELEMENT_NAMES[harmony.element]}局；合局对用神关系为${relation}。`,
        plainMeaning: supportive ? "几股分散的力量正在往同一个方向汇合，而且这个方向能托住关键条件。" : obstructive ? "几股力量虽然合到了一起，但形成的方向会压住或消耗关键条件。" : "几股力量正在抱团成势，但用神也在与这股合力较劲，结果不会只看一个因素。",
        confidence: 0.72, effect: supportive ? "support" : obstructive ? "obstruct" : "mixed", strength: harmonyStrength,
      });
    }
    if (useful.spirit === "azure_dragon") addEvidence({ rule: "azure_dragon_on_useful", conclusion: "用神临青龙。", technicalText: `第${useful.position}爻用神临青龙。`, plainMeaning: context.topic === "travel" ? "这颗爻带着轻松、好气氛的意味，图开心这件事比较对味。" : "关键位置带着较顺手、有人情助力的一面。", confidence: 0.68, effect: "support", strength: 0.5, line: useful.position });
    if (useful.spirit === "vermilion_bird") addEvidence({ rule: "vermilion_bird_on_useful", conclusion: "用神临朱雀。", technicalText: `第${useful.position}爻用神临朱雀。`, plainMeaning: "这件事很吃沟通，话说得顺不顺会直接改变气氛。", confidence: 0.65, effect: "mixed", strength: 0, line: useful.position });
    if (useful.spirit === "white_tiger") addEvidence({ rule: "white_tiger_on_useful", conclusion: "用神临白虎。", technicalText: `第${useful.position}爻用神临白虎。`, plainMeaning: "关键位置带着压力和较劲感，处理时别把弦绷得太紧。", confidence: 0.65, effect: "obstruct", strength: -0.5, line: useful.position });
    if (context.topic === "wealth") {
      const competitors = lines.filter((line) => line.relation === "siblings" && (line.moving || line.role === "shi"));
      if (competitors.length) {
        score -= competitors.length;
        addEvidence({ rule: "siblings_divide_wealth", conclusion: `${competitors.length}个兄弟爻参与分财。`, technicalText: `求财见兄弟爻${competitors.map((line) => `第${line.position}爻`).join("、")}发动或临世。`, plainMeaning: competitors.length > 1 ? "桌上不只你一个人惦记这份财，分财和消耗都偏多。" : "这份财旁边有竞争或额外消耗，不太容易完整落袋。", confidence: 0.84, effect: "obstruct", strength: -competitors.length, line: competitors[0].position });
      }
    }
  }
  if (hidden) {
    const hiddenDayRelation = context.dayBranch === hidden.branch ? "same" : elementRelation(BRANCH_ELEMENT[context.dayBranch], hidden.element);
    if (hidden.monthStrength > 0 || hiddenDayRelation === "same" || hiddenDayRelation === "generates") {
      score += 1;
      addEvidence({ rule: "hidden_spirit_supported", conclusion: "伏神得日月生扶。", technicalText: `伏神${BRANCH_NAMES[hidden.branch]}月令旺衰分为${hidden.monthStrength}，日辰关系为${hiddenDayRelation}。`, plainMeaning: "关键条件虽然还没露面，但自身并不虚弱；只要遮挡松开，就有机会接上现实。", confidence: 0.74, effect: "support", strength: 1, line: hidden.line });
    } else if (hidden.monthStrength < 0 && hiddenDayRelation === "controls") {
      score -= 1;
      addEvidence({ rule: "hidden_spirit_weak", conclusion: "伏神休囚又受日克。", technicalText: `伏神${BRANCH_NAMES[hidden.branch]}失月令，并受日辰${BRANCH_NAMES[context.dayBranch]}克制。`, plainMeaning: "藏着的关键条件自身也偏弱，即使暂时露头，承接能力仍有限。", confidence: 0.76, effect: "obstruct", strength: -1, line: hidden.line });
    }
    if (hidden.void) {
      score -= 1;
      addEvidence({ rule: "hidden_spirit_void", conclusion: "伏神落旬空。", technicalText: `伏神${BRANCH_NAMES[hidden.branch]}不上卦且落旬空。`, plainMeaning: "关键条件既藏着又暂时落不到实处，需要先等它填实，不能只靠期待。", confidence: 0.82, effect: "obstruct", strength: -1, line: hidden.line });
    }
    if (CLASH[context.monthBranch] === hidden.branch) {
      score -= 1.5;
      addEvidence({ rule: "hidden_spirit_month_break", conclusion: "伏神又逢月破。", technicalText: `伏神${BRANCH_NAMES[hidden.branch]}受月建${BRANCH_NAMES[context.monthBranch]}冲破。`, plainMeaning: "关键条件不但藏着，还被当前大环境冲散，短期更难稳定透出。", confidence: 0.84, effect: "obstruct", strength: -1.5, line: hidden.line });
    }
    if (hidden.relationToFlying === "generated_by") {
      score += 1;
      addEvidence({ rule: "flying_generates_hidden", conclusion: "飞神生伏神。", technicalText: `飞神${BRANCH_NAMES[hidden.flyingBranch]}生伏神${BRANCH_NAMES[hidden.branch]}。`, plainMeaning: "藏着的关键条件虽然没露面，但上面有力量在生它，仍有冒头的机会。", confidence: 0.78, effect: "support", strength: 1, line: hidden.line });
    } else if (hidden.relationToFlying === "controlled_by") {
      const pressure = hidden.flyingMoving ? -1.5 : -1;
      score += pressure;
      addEvidence({ rule: hidden.flyingMoving ? "moving_flying_controls_hidden" : "flying_controls_hidden", conclusion: `飞神${hidden.flyingMoving ? "发动" : ""}克伏神。`, technicalText: `第${hidden.flyingLine}爻飞神${BRANCH_NAMES[hidden.flyingBranch]}${hidden.flyingMoving ? "发动并" : ""}克伏神${BRANCH_NAMES[hidden.branch]}。`, plainMeaning: hidden.flyingMoving ? "压住关键条件的现实因素还在主动变化，伏神短期更难透出。" : "关键条件既藏着，又被上面的现实压住，短期不容易出来。", confidence: 0.8, effect: "obstruct", strength: pressure, line: hidden.line });
    } else if (hidden.relationToFlying === "generates") {
      score -= 0.5;
      addEvidence({ rule: "hidden_generates_flying", conclusion: "伏神生飞神。", technicalText: `伏神${BRANCH_NAMES[hidden.branch]}生飞神${BRANCH_NAMES[hidden.flyingBranch]}。`, plainMeaning: "藏着的关键条件在反过来供给表面事务，自身容易被消耗，显现会更慢。", confidence: 0.7, effect: "mixed", strength: -0.5, line: hidden.line });
    } else if (hidden.relationToFlying === "controls") {
      addEvidence({ rule: "hidden_controls_flying", conclusion: "伏神克飞神。", technicalText: `伏神${BRANCH_NAMES[hidden.branch]}克飞神${BRANCH_NAMES[hidden.flyingBranch]}。`, plainMeaning: "藏着的条件与表面阻隔彼此较劲；不是完全出不来，但往往要付出推动成本。", confidence: 0.68, effect: "mixed", strength: 0, line: hidden.line });
    } else if (hidden.relationToFlying === "same") {
      score += 0.5;
      addEvidence({ rule: "hidden_and_flying_same_element", conclusion: "飞伏比和。", technicalText: `飞神${BRANCH_NAMES[hidden.flyingBranch]}与伏神${BRANCH_NAMES[hidden.branch]}五行比和。`, plainMeaning: "表里两层力量同类，关键条件虽未明现，但不至于被表面因素直接压坏。", confidence: 0.66, effect: "support", strength: 0.5, line: hidden.line });
    }
  }
  const timingDetails: LiuyaoTimingCandidate[] = [];
  const timingScale = context.timingScale ?? "day";
  const addTiming = (candidate: Omit<LiuyaoTimingCandidate, "scale">) => {
    if (!timingDetails.some((item) => item.branch === candidate.branch && item.trigger === candidate.trigger)) {
      const dateWindows = timingDateWindows(context, candidate.branch, timingScale);
      timingDetails.push({ ...candidate, scale: timingScale, ...(dateWindows?.length ? { dateWindows } : {}) });
    }
  };
  if (useful) {
    if (useful.void) {
      addTiming({ branch: useful.branch, trigger: "fill", reason: "用神旬空，候填实", confidence: 0.52 });
      addTiming({ branch: CLASH[useful.branch], trigger: "clash_open", reason: "用神旬空，候冲空显形", confidence: 0.48 });
    }
    if (CLASH[context.monthBranch] === useful.branch) {
      addTiming({ branch: useful.branch, trigger: "fill", reason: "用神月破，候值临填实", confidence: 0.46 });
      addTiming({ branch: COMBINE[useful.branch], trigger: "meet_combine", reason: "用神月破，候相合缓解冲破", confidence: 0.42 });
    }
    if (COMBINE[context.dayBranch] === useful.branch && useful.moving) {
      addTiming({ branch: CLASH[useful.branch], trigger: "release_combine", reason: "发动用神受合绊，候冲开", confidence: 0.44 });
    }
    if (context.dayBranch === dayTombFor(useful.element)) {
      addTiming({ branch: CLASH[dayTombFor(useful.element)], trigger: "clash_open", reason: "用神临墓，候冲墓松动", confidence: 0.4 });
    }
    if (!timingDetails.length && useful.moving) {
      addTiming({ branch: COMBINE[useful.branch], trigger: "meet_combine", reason: "用神发动，候逢合承接", confidence: 0.42 });
      addTiming({ branch: useful.branch, trigger: "fill", reason: "用神发动，候值临增强", confidence: 0.4 });
    }
    if (!timingDetails.length) {
      addTiming({ branch: CLASH[useful.branch], trigger: "meet_clash", reason: "用神安静，候逢冲发动", confidence: 0.4 });
      addTiming({ branch: useful.branch, trigger: "fill", reason: "候用神值临", confidence: 0.38 });
    }
  } else if (hidden) {
    if (hidden.void) {
      addTiming({ branch: hidden.branch, trigger: "fill", reason: "伏神旬空，候填实后再透出", confidence: 0.44 });
      addTiming({ branch: CLASH[hidden.branch], trigger: "clash_open", reason: "伏神旬空，候冲空显形", confidence: 0.4 });
    }
    if (CLASH[context.monthBranch] === hidden.branch) {
      addTiming({ branch: hidden.branch, trigger: "fill", reason: "伏神月破，候值临填实", confidence: 0.4 });
      addTiming({ branch: COMBINE[hidden.branch], trigger: "meet_combine", reason: "伏神月破，候相合缓解", confidence: 0.36 });
    }
    addTiming({ branch: hidden.branch, trigger: "hidden_emerges", reason: "伏神候值临透出", confidence: 0.4 });
    addTiming({ branch: CLASH[hidden.flyingBranch], trigger: "clash_open", reason: "候冲开飞神，使伏神显现", confidence: 0.36 });
  }
  const timing = timingDetails.length ? {
    candidates: timingDetails.map((item) => item.branch),
    details: timingDetails,
    basis: [...new Set(timingDetails.map((item) => item.trigger))].join("+"),
    confidence: Math.max(...timingDetails.map((item) => item.confidence)),
  } : null;
  if (timing) addEvidence({ rule: `timing_${timing.basis}`, conclusion: `应期按${timingScale === "day" ? "日" : "节气月"}尺度输出候选，不构成事件或日期承诺。`, confidence: timing.confidence, effect: "neutral", strength: 0, plainMeaning: `时间线索按问题尺度保留为${timingScale === "day" ? "地支日" : "节气月"}观察窗口，不把它说成一定发生的日期。` });
  return {
    analysis: {
      status: "complete", usefulGod: useful ? { relation: target, line: useful.position, hidden: false, flyingLine: null } : hidden ? { relation: target, line: hidden.line, hidden: true, flyingLine: hidden.line } : null,
      strength: usefulStrength, relationships, hiddenSpirit: hidden, timing,
      tendency: !useful && !hidden ? "undetermined" : score >= 2 ? "favorable" : score <= -1 ? "unfavorable" : "mixed",
      uncertainty: !useful || Math.abs(score) < 2 ? "high" : "medium", missingContext: [],
    },
    evidence,
  };
}
