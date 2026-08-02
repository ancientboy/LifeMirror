import type { LiuyaoKnowledgeContext } from "../knowledge/liuyao-retrieval.js";
import type { LiuyaoReflectionKnowledge } from "../knowledge/liuyao-reflection-map.js";
import type { PersonalReflectionContext } from "../memory/reflection-context.js";
import type { LiuyaoResult } from "../tools/liuyao/types.js";

export type MirrorRuntimeContext = {
  userQuestion: string;
  liuyaoTool: Pick<LiuyaoResult, "divination" | "structure" | "analysis" | "evidence" | "judgment">;
  classicalKnowledge: LiuyaoKnowledgeContext;
  reflectionKnowledge: LiuyaoReflectionKnowledge;
  personalContext: PersonalReflectionContext;
};

export function assembleMirrorRuntimeContext(input: {
  question: string;
  hexagram: LiuyaoResult;
  knowledge: LiuyaoKnowledgeContext;
  reflectionKnowledge: LiuyaoReflectionKnowledge;
  userContext?: PersonalReflectionContext;
}): MirrorRuntimeContext {
  return {
    userQuestion: input.question.trim(),
    liuyaoTool: {
      divination: input.hexagram.divination,
      structure: input.hexagram.structure,
      analysis: input.hexagram.analysis,
      evidence: input.hexagram.evidence,
      judgment: input.hexagram.judgment,
    },
    classicalKnowledge: input.knowledge,
    reflectionKnowledge: input.reflectionKnowledge,
    personalContext: input.userContext ?? { recentEvents: [], patterns: [] },
  };
}
