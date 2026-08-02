import type { LiuyaoKnowledgeContext } from "./liuyao-retrieval.js";
import type { LiuyaoResult, SixRelation } from "../tools/liuyao/types.js";

export type ReflectionMapping = {
  id: string;
  traditionalConcept: string;
  humanMeaning: string;
  userFacingReflection: string;
  basis: string[];
  confidence: number;
};

export type LiuyaoReflectionKnowledge = {
  source: "KNOWLEDGE-004";
  boundary: string;
  mappings: ReflectionMapping[];
};

const RELATION_REFLECTION: Record<SixRelation | "shi", Omit<ReflectionMapping, "id" | "basis" | "confidence">> = {
  officials: {
    traditionalConcept: "官鬼为用",
    humanMeaning: "责任、压力、规则或外部要求成为当前问题的核心变量。",
    userFacingReflection: "这件事带来的责任与外部要求，是否仍在你愿意承受的范围内？",
  },
  wealth: {
    traditionalConcept: "妻财为用",
    humanMeaning: "现实资源、回报、投入产出或关系中的实际承诺成为核心变量。",
    userFacingReflection: "你真正想确认的，是它的价值，还是你愿意为它投入多少？",
  },
  parents: {
    traditionalConcept: "父母为用",
    humanMeaning: "信息、依据、学习、支持系统或既有规则成为核心变量。",
    userFacingReflection: "在做决定前，你还缺少哪项可靠信息或支持？",
  },
  offspring: {
    traditionalConcept: "子孙为用",
    humanMeaning: "行动后的舒展、成果、创造空间或减轻压力的能力成为核心变量。",
    userFacingReflection: "哪个选择更能让你恢复行动空间，而不是继续被压力推着走？",
  },
  siblings: {
    traditionalConcept: "兄弟为用",
    humanMeaning: "同伴、竞争、资源分配或平等协作成为核心变量。",
    userFacingReflection: "这件事中，合作与竞争的边界是否已经说清楚？",
  },
  shi: {
    traditionalConcept: "世爻为用",
    humanMeaning: "你的立场、状态与可承担程度，是这次判断的核心。",
    userFacingReflection: "暂时放下别人期待后，你自己的真实意愿和承受力分别是什么？",
  },
};

const STRENGTH_REFLECTION = {
  prosperous: ["用神旺", "相关条件在当前时令中较有力量。", "已有的支持中，哪一项最值得被转化为实际行动？"],
  supported: ["用神得生", "相关条件得到一定支持，但仍需要落实。", "哪些支持已经真实可用，哪些还只是期待？"],
  resting: ["用神休", "相关力量正在输出或消耗，推进需要关注可持续性。", "继续推进时，什么正在消耗你或关键资源？"],
  confined: ["用神囚", "相关条件受到环境约束，行动空间暂时有限。", "目前真正限制你的条件是什么，它能否被小范围验证或调整？"],
  dead: ["用神衰", "相关条件缺少时令支持，不宜把期待当成已经具备的能力。", "如果不依赖乐观假设，现在仍然成立的条件有哪些？"],
} as const;

function compactBasis(result: LiuyaoResult, rule: string): string[] {
  return result.evidence.filter((item) => item.rule === rule || item.rule.startsWith(rule)).map((item) => `${item.rule}: ${item.conclusion}`);
}

export function retrieveLiuyaoReflectionKnowledge(result: LiuyaoResult, knowledge: LiuyaoKnowledgeContext): LiuyaoReflectionKnowledge {
  const mappings: ReflectionMapping[] = [
    {
      id: `hexagram-${knowledge.original.number}`,
      traditionalConcept: `${knowledge.original.name}卦：${knowledge.original.symbolic.meaning}`,
      humanMeaning: knowledge.original.symbolic.interpretation,
      userFacingReflection: knowledge.original.reflectionMapping.prompt,
      basis: knowledge.readingRule.focus.map((item) => `${item.label}: ${item.text}`),
      confidence: 0.8,
    },
  ];

  if (result.movingLines.length > 0) {
    mappings.push({
      id: `change-${knowledge.original.number}-${knowledge.changed.number}`,
      traditionalConcept: `${knowledge.original.name}之${knowledge.changed.name}`,
      humanMeaning: `当前结构包含变化线索；${knowledge.changed.symbolic.interpretation}`,
      userFacingReflection: "你正在面对的，是需要改变方向，还是需要调整推进方式？",
      basis: [knowledge.readingRule.summary, ...knowledge.movingLines.map((line) => `${line.name}: ${line.text}`)],
      confidence: 0.72,
    });
  }

  const usefulGod = result.analysis.usefulGod;
  if (result.analysis.status === "complete" && usefulGod) {
    const relation = RELATION_REFLECTION[usefulGod.relation];
    mappings.push({
      id: `useful-god-${usefulGod.relation}`,
      ...relation,
      basis: compactBasis(result, "useful_god").concat(compactBasis(result, "hidden_spirit")),
      confidence: result.evidence.find((item) => item.rule === "useful_god_by_topic")?.confidence ?? 0.55,
    });
  }

  if (result.analysis.status === "complete" && result.analysis.strength) {
    const [traditionalConcept, humanMeaning, userFacingReflection] = STRENGTH_REFLECTION[result.analysis.strength.level];
    mappings.push({
      id: `strength-${result.analysis.strength.level}`,
      traditionalConcept,
      humanMeaning,
      userFacingReflection,
      basis: compactBasis(result, "month_strength"),
      confidence: result.evidence.find((item) => item.rule === "month_strength")?.confidence ?? 0.6,
    });
  }

  if (result.analysis.hiddenSpirit) {
    mappings.push({
      id: "hidden-spirit",
      traditionalConcept: "用神伏藏",
      humanMeaning: "关键条件尚未直接显现，需要先确认它是否真实存在、能否被调用。",
      userFacingReflection: "你现在依赖的关键条件，是已经出现的事实，还是仍未验证的期待？",
      basis: compactBasis(result, "hidden_spirit"),
      confidence: 0.55,
    });
  }

  return {
    source: "KNOWLEDGE-004",
    boundary: "本层只把已检索的传统含义映射为可反思的人类处境；不计算卦象、不推断现实事实、不生成最终回答。",
    mappings: mappings.slice(0, 5),
  };
}
