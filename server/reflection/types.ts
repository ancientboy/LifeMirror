import type { LiuyaoKnowledgeContext } from "../knowledge/liuyao-retrieval.js";
import type { LiuyaoReflectionKnowledge } from "../knowledge/liuyao-reflection-map.js";
import type { CoinToss, LiuyaoAnalysisContext, LiuyaoResult } from "../tools/liuyao/types.js";

export type MirrorReflection = {
  traditionalJudgment: string;
  reasoningExplanation: string;
  shiguangInterpretation: string;
  practicalGuidance: string;
  reflectionQuestion: string;
  shareableReflection: string;
};

export type PreviousMirrorReflection = {
  shiguangSees: string;
  hexagramMeaning: string;
  mirrorUnderstanding: string;
  practicalGuidance: string;
  reflectionQuestion: string;
  shareableReflection: string;
};

export type LegacyMirrorReflection = {
  observation: string;
  insight: string;
  reflectionQuestion: string;
  actionSuggestion: string;
};

export type StoredMirrorReflection = MirrorReflection | PreviousMirrorReflection | LegacyMirrorReflection;

export type ExplanationTrace = {
  traditional_basis: string;
  liuyao_factors: string[];
  reflection_mapping: string;
  final_response: MirrorReflection;
};

export function normalizeMirrorReflection(reflection: StoredMirrorReflection): MirrorReflection {
  if ("traditionalJudgment" in reflection) return reflection;
  if ("shiguangSees" in reflection) {
    return {
      traditionalJudgment: reflection.shiguangSees,
      reasoningExplanation: reflection.hexagramMeaning,
      shiguangInterpretation: reflection.mirrorUnderstanding,
      practicalGuidance: reflection.practicalGuidance,
      reflectionQuestion: reflection.reflectionQuestion,
      shareableReflection: reflection.shareableReflection,
    };
  }
  return {
    traditionalJudgment: reflection.observation,
    reasoningExplanation: reflection.insight,
    shiguangInterpretation: reflection.insight,
    practicalGuidance: reflection.actionSuggestion,
    reflectionQuestion: reflection.reflectionQuestion,
    shareableReflection: reflection.insight,
  };
}

export type ReflectionDraftPayload = {
  version: 1 | 2 | 3 | 4 | 5;
  runtimeId: string;
  userId: string;
  question: string;
  tosses: CoinToss[];
  analysisContext?: LiuyaoAnalysisContext;
  hexagram: LiuyaoResult;
  knowledge: LiuyaoKnowledgeContext;
  reflectionKnowledge?: LiuyaoReflectionKnowledge;
  explanationTrace?: ExplanationTrace;
  reflection: StoredMirrorReflection;
  provider: string;
  model: string;
  generatedAt: string;
  expiresAt: string;
};
