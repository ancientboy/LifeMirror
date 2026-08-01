import type { LiuyaoKnowledgeContext } from "../knowledge/liuyao-retrieval.js";
import type { CoinToss, LiuyaoResult } from "../tools/liuyao/types.js";

export type MirrorReflection = {
  observation: string;
  insight: string;
  reflectionQuestion: string;
  actionSuggestion: string;
};

export type ReflectionDraftPayload = {
  version: 1;
  runtimeId: string;
  userId: string;
  question: string;
  tosses: CoinToss[];
  hexagram: LiuyaoResult;
  knowledge: LiuyaoKnowledgeContext;
  reflection: MirrorReflection;
  provider: string;
  model: string;
  generatedAt: string;
  expiresAt: string;
};
