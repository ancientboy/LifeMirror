import type { LiuyaoKnowledgeContext } from "../knowledge/liuyao-retrieval.js";
import type { LiuyaoAnalysisContext, LiuyaoEvidence, LiuyaoResult } from "../tools/liuyao/types.js";

const RULE_NAMES: Record<string, string> = {
  analysis_context_required: "判断条件说明",
  useful_god_by_topic: "按所问主题取用神",
  useful_god_multiple_candidates: "用神候选比较",
  hidden_spirit: "用神伏藏",
  month_strength: "月令旺衰",
  single_moving_line: "独发",
  single_static_line: "独静",
  six_combine_structure: "六合结构",
  six_clash_structure: "六冲结构",
  day_generates_useful: "日辰生用神",
  day_controls_useful: "日辰克用神",
  month_break: "月破",
  void_clashed_open: "冲空候选",
  moving_line_clashed: "动爻逢冲",
  hidden_movement: "暗动",
  day_break: "日破",
  moving_line_bound_by_combine: "动爻合绊",
  day_combine: "日辰相合",
  branch_harm_on_useful: "用神逢害",
  shi_line_changes: "世爻发动",
  ying_line_changes: "应爻发动",
  useful_generates_shi: "用神生世",
  useful_controls_shi: "用神克世",
  shi_generates_useful: "世爻生用",
  shi_controls_useful: "世爻克用",
  shi_use_clash: "世用相冲",
  shi_use_combine: "世用相合",
  ying_generates_shi: "应爻生世",
  ying_controls_shi: "应爻克世",
  source_god_moves: "原神发动",
  avoid_god_moves: "忌神发动",
  useful_god_void: "用神旬空",
  return_generation: "回头生",
  return_control: "回头克",
  transforms_progress: "化进神",
  transforms_retreat: "化退神",
  transforms_void: "化空",
  transforms_month_break: "化月破",
  hidden_spirit_supported: "伏神得扶",
  hidden_spirit_weak: "伏神偏弱",
  hidden_spirit_void: "伏神旬空",
  hidden_spirit_month_break: "伏神月破",
  flying_generates_hidden: "飞神生伏神",
  hidden_generates_flying: "伏神生飞神",
  hidden_controls_flying: "伏神克飞神",
  flying_controls_hidden: "飞神克伏神",
  hidden_and_flying_same_element: "飞伏比和",
};

const RELATION_NAMES: Record<string, string> = {
  same: "同类比和",
  generates: "相生",
  controls: "相克",
  generated_by: "受生",
  controlled_by: "受克",
  clash: "相冲",
  combine: "相合",
};

export function humanizeLiuyaoRule(rule: string) {
  if (/[㐀-鿿]/.test(rule)) return rule;
  if (RULE_NAMES[rule]) return RULE_NAMES[rule];
  if (rule.startsWith("timing_")) return "应期观察窗口";
  if (rule.startsWith("topic_auxiliary_")) return "主题辅助线索";
  if (rule.startsWith("scenario_focus_")) return "情境重点";
  if (rule.startsWith("three_harmony_")) return "三合局线索";
  if (rule.startsWith("shi_holds_")) return "世爻所临六亲";
  if (rule.includes("punishment")) return "用神逢刑";
  if (rule.includes("tomb")) return "用神入墓";
  return "六爻结构线索";
}

export function cleanLiuyaoText(text: string) {
  return text
    .replace(/\bsame\b/gi, RELATION_NAMES.same)
    .replace(/\bgenerates\b/gi, RELATION_NAMES.generates)
    .replace(/\bcontrols\b/gi, RELATION_NAMES.controls)
    .replace(/\bgenerated_by\b/gi, RELATION_NAMES.generated_by)
    .replace(/\bcontrolled_by\b/gi, RELATION_NAMES.controlled_by)
    .replace(/\bclash\b/gi, RELATION_NAMES.clash)
    .replace(/\bcombine\b/gi, RELATION_NAMES.combine)
    .replace(/(?:得分|分为|score\s*(?:is|=)?)[：:\s]*-?\d+(?:\.\d+)?/gi, "偏弱")
    .replace(/\s+/g, " ")
    .trim();
}

function presentEvidence(item: LiuyaoEvidence) {
  return {
    title: humanizeLiuyaoRule(item.rule),
    technical: cleanLiuyaoText(item.technicalText ?? item.conclusion),
    plain: cleanLiuyaoText(item.plainMeaning ?? item.conclusion),
    effect: item.effect === "support" ? "positive" as const : item.effect === "obstruct" ? "negative" as const : "mixed" as const,
  };
}

export function assertLiuyaoPresentationIntegrity(result: LiuyaoResult, knowledge: LiuyaoKnowledgeContext) {
  const calculated = [...result.movingLines].sort((a, b) => a - b);
  const retrieved = knowledge.movingLines.map((line) => line.position).sort((a, b) => a - b);
  if (calculated.join(",") !== retrieved.join(",")) throw new Error("moving_line_integrity_failed");
  if (knowledge.original.number !== result.originalHexagram.number || knowledge.changed.number !== result.changedHexagram.number) {
    throw new Error("hexagram_integrity_failed");
  }
  if (new Set(calculated).size !== calculated.length || calculated.some((line) => line < 1 || line > 6)) {
    throw new Error("moving_line_integrity_failed");
  }
}

export function buildLiuyaoPresentation(input: {
  question: string;
  result: LiuyaoResult;
  knowledge: LiuyaoKnowledgeContext;
  analysisContext?: LiuyaoAnalysisContext | null;
}) {
  assertLiuyaoPresentationIntegrity(input.result, input.knowledge);
  return {
    question: input.question.trim(),
    method: "三枚铜钱纳甲六爻；经典阅读规则与纳甲判断分层呈现",
    original: {
      number: input.knowledge.original.number,
      name: input.knowledge.original.name,
      judgment: input.knowledge.original.classical.judgment,
      image: input.knowledge.original.classical.image,
      symbolicMeaning: input.knowledge.original.symbolic.meaning,
      symbolicInterpretation: input.knowledge.original.symbolic.interpretation,
    },
    changed: {
      number: input.knowledge.changed.number,
      name: input.knowledge.changed.name,
      judgment: input.knowledge.changed.classical.judgment,
      image: input.knowledge.changed.classical.image,
      symbolicMeaning: input.knowledge.changed.symbolic.meaning,
      symbolicInterpretation: input.knowledge.changed.symbolic.interpretation,
    },
    movingLines: input.knowledge.movingLines.map((line) => ({
      position: line.position,
      name: line.name,
      text: line.text,
      image: line.image,
      positionMeaning: line.positionMeaning,
    })),
    readingRule: input.knowledge.readingRule,
    questionTarget: input.analysisContext?.intents?.map((intent) => intent.label) ?? [],
    tone: input.result.judgment.tone,
    verdicts: input.result.judgment.verdicts.map((verdict) => ({
      label: verdict.label,
      direction: verdict.direction,
      shortReason: cleanLiuyaoText(verdict.shortReason),
      evidenceBalance: verdict.evidenceBalance,
    })),
    evidence: input.result.judgment.keyEvidence.slice(0, 6).map(presentEvidence),
    limitations: input.result.judgment.limitations.map(cleanLiuyaoText),
  };
}
