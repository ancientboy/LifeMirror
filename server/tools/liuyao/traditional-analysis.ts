import type {
  EarthlyBranch,
  FiveElement,
  HeavenlyStem,
  LiuyaoAnalysisContext,
  LiuyaoCastingLine,
  LiuyaoEvidence,
  LiuyaoLine,
  LiuyaoTopic,
  LiuyaoTraditionalAnalysis,
  Polarity,
  SixRelation,
} from "./types.js";

export const ELEMENT_NAMES: Record<FiveElement, string> = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };
export const BRANCH_NAMES: Record<EarthlyBranch, string> = { zi: "子", chou: "丑", yin: "寅", mao: "卯", chen: "辰", si: "巳", wu: "午", wei: "未", shen: "申", you: "酉", xu: "戌", hai: "亥" };
export const STEM_NAMES: Record<HeavenlyStem, string> = { jia: "甲", yi: "乙", bing: "丙", ding: "丁", wu: "戊", ji: "己", geng: "庚", xin: "辛", ren: "壬", gui: "癸" };

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
  }));
}

const TOPIC_RELATION: Record<LiuyaoTopic, SixRelation | "shi"> = {
  self: "shi", career: "officials", wealth: "wealth", study: "parents", relationship_male: "wealth",
  relationship_female: "officials", health: "offspring", family: "parents", children: "offspring",
  travel: "offspring", legal: "officials", partnership: "siblings",
};

function strength(element: FiveElement, month: EarthlyBranch) {
  const monthElement = BRANCH_ELEMENT[month];
  if (element === monthElement) return { level: "prosperous" as const, score: 2 };
  if (GENERATES[monthElement] === element) return { level: "supported" as const, score: 1 };
  if (GENERATES[element] === monthElement) return { level: "resting" as const, score: 0 };
  if (CONTROLS[element] === monthElement) return { level: "confined" as const, score: -1 };
  return { level: "dead" as const, score: -1 };
}

function elementRelation(source: FiveElement, target: FiveElement): "same" | "generates" | "controls" | "generated_by" | "controlled_by" {
  if (source === target) return "same";
  if (GENERATES[source] === target) return "generates";
  if (CONTROLS[source] === target) return "controls";
  if (GENERATES[target] === source) return "generated_by";
  return "controlled_by";
}

function hiddenSpirit(lines: readonly LiuyaoLine[], palace: PalaceStructure, relation: SixRelation) {
  const pureBits = ({ qian: "111", dui: "110", li: "101", zhen: "100", xun: "011", kan: "010", gen: "001", kun: "000" } as Record<string, string>)[palace.palace];
  const fake = lines.map((line, index) => ({ ...line, polarity: pureBits[index % 3] === "1" ? "yang" as const : "yin" as const }));
  const purePalace = { ...palace, palaceStage: "pure" as const, shi: 6, ying: 3 };
  const pureLines = enrichLines(fake, palace.palace, palace.palace, purePalace);
  const hidden = pureLines.find((line) => line.relation === relation);
  if (!hidden) return null;
  const flying = lines[hidden.position - 1];
  return { relation, line: hidden.position, branch: hidden.branch, flyingBranch: flying.branch, relationToFlying: elementRelation(hidden.element, flying.element) };
}

export function analyzeTraditional(lines: readonly LiuyaoLine[], palace: PalaceStructure, context?: LiuyaoAnalysisContext): { analysis: LiuyaoTraditionalAnalysis; evidence: LiuyaoEvidence[] } {
  if (!context) return {
    analysis: { status: "context_required", usefulGod: null, strength: null, relationships: [], hiddenSpirit: null, timing: null, tendency: "undetermined", uncertainty: "high", missingContext: ["topic", "monthBranch", "dayStem", "dayBranch"] },
    evidence: [{ rule: "analysis_context_required", conclusion: "装卦已完成；用神、旺衰、生克、旬空、六神与应期必须由明确的所测主题和历法上下文计算。", confidence: 1 }],
  };
  const evidence: LiuyaoEvidence[] = [];
  const target = TOPIC_RELATION[context.topic];
  const candidates = target === "shi" ? lines.filter((line) => line.role === "shi") : lines.filter((line) => line.relation === target);
  const hidden = target === "shi" || candidates.length ? null : hiddenSpirit(lines, palace, target);
  const useful = candidates.sort((a, b) => Number(b.role === "shi") - Number(a.role === "shi") || Number(b.moving) - Number(a.moving))[0];
  if (useful) evidence.push({ rule: "useful_god_by_topic", conclusion: `所测主题 ${context.topic} 取 ${target} 为用神，第 ${useful.position} 爻入选。`, confidence: candidates.length > 1 ? 0.6 : 0.75, line: useful.position });
  if (!useful && hidden) evidence.push({ rule: "hidden_spirit", conclusion: `用神不上卦，取第 ${hidden.line} 爻伏神。`, confidence: 0.55, line: hidden.line });
  const usefulStrength = useful ? strength(useful.element, context.monthBranch) : null;
  if (useful && usefulStrength) evidence.push({ rule: "month_strength", conclusion: `用神五行相对于月建为 ${usefulStrength.level}。`, confidence: 0.7, line: useful.position });
  const relationships: LiuyaoTraditionalAnalysis["relationships"] = [];
  if (useful) {
    relationships.push({ source: "month", target: `line_${useful.position}`, relation: context.monthBranch === useful.branch ? "same" : elementRelation(BRANCH_ELEMENT[context.monthBranch], useful.element) });
    relationships.push({ source: "day", target: `line_${useful.position}`, relation: context.dayBranch === useful.branch ? "same" : elementRelation(BRANCH_ELEMENT[context.dayBranch], useful.element) });
    if (CLASH[context.dayBranch] === useful.branch) relationships.push({ source: "day", target: `line_${useful.position}`, relation: "clash" });
    if (COMBINE[context.dayBranch] === useful.branch) relationships.push({ source: "day", target: `line_${useful.position}`, relation: "combine" });
    for (const moving of lines.filter((line) => line.moving && line.position !== useful.position)) {
      relationships.push({ source: `moving_line_${moving.position}`, target: `line_${useful.position}`, relation: elementRelation(moving.element, useful.element) });
    }
    evidence.push({ rule: "day_month_relationships", conclusion: "已按日辰、月建与用神五行计算生克、冲合关系。", confidence: 0.65, line: useful.position });
    if (lines.some((line) => line.moving && line.position !== useful.position)) evidence.push({ rule: "moving_line_generation_control", conclusion: "已计算动爻对用神的生克关系。", confidence: 0.6, line: useful.position });
  }
  const timing = useful ? {
    candidates: useful.void ? [useful.branch, CLASH[useful.branch]] : useful.moving ? [COMBINE[useful.branch], useful.branch] : [CLASH[useful.branch], useful.branch],
    basis: useful.void ? "fill_or_clash_void" : useful.moving ? "moving_line_meets_combination" : "static_line_meets_clash",
    confidence: useful.void ? 0.5 : 0.45,
  } : hidden ? { candidates: [hidden.branch, CLASH[hidden.flyingBranch]], basis: "hidden_spirit_emerges", confidence: 0.4 } : null;
  if (timing) evidence.push({ rule: `timing_${timing.basis}`, conclusion: "应期仅输出传统规则候选，不构成事件或日期承诺。", confidence: timing.confidence });
  const score = (usefulStrength?.score ?? 0) + (useful?.role === "shi" ? 1 : 0) + (useful?.moving ? 1 : 0) - (useful?.void ? 2 : 0);
  return {
    analysis: {
      status: "complete", usefulGod: useful ? { relation: target, line: useful.position, hidden: false, flyingLine: null } : hidden ? { relation: target, line: hidden.line, hidden: true, flyingLine: hidden.line } : null,
      strength: usefulStrength, relationships, hiddenSpirit: hidden, timing,
      tendency: !useful ? "undetermined" : score >= 2 ? "favorable" : score <= -1 ? "unfavorable" : "mixed",
      uncertainty: !useful || Math.abs(score) < 2 ? "high" : "medium", missingContext: [],
    },
    evidence,
  };
}
