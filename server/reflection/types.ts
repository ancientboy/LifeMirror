import type { LiuyaoKnowledgeContext } from "../knowledge/liuyao-retrieval.js";
import type { CoinToss, LiuyaoResult } from "../tools/liuyao/types.js";

export type MirrorReflection = {
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

export type StoredMirrorReflection = MirrorReflection | LegacyMirrorReflection;

export function normalizeMirrorReflection(reflection: StoredMirrorReflection): MirrorReflection {
  if ("shiguangSees" in reflection) return reflection;
  return {
    shiguangSees: reflection.observation,
    hexagramMeaning: reflection.insight,
    mirrorUnderstanding: reflection.insight,
    practicalGuidance: reflection.actionSuggestion,
    reflectionQuestion: reflection.reflectionQuestion,
    shareableReflection: reflection.insight,
  };
}

export type ReflectionDraftPayload = {
  version: 1 | 2;
  runtimeId: string;
  userId: string;
  question: string;
  tosses: CoinToss[];
  hexagram: LiuyaoResult;
  knowledge: LiuyaoKnowledgeContext;
  reflection: StoredMirrorReflection;
  provider: string;
  model: string;
  generatedAt: string;
  expiresAt: string;
};
