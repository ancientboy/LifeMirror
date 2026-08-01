import { z } from "zod";
import type { LiuyaoKnowledgeContext } from "../knowledge/liuyao-retrieval.js";
import type { LlmProvider } from "../llm/types.js";
import type { PersonalReflectionContext } from "../memory/reflection-context.js";
import type { LiuyaoResult } from "../tools/liuyao/types.js";
import type { MirrorReflection } from "./types.js";

const reflectionSchema = z.object({
  observation: z.string().trim().min(1).max(1_000),
  insight: z.string().trim().min(1).max(1_000),
  reflectionQuestion: z.string().trim().min(1).max(500),
  actionSuggestion: z.string().trim().min(1).max(500),
});

function parseReflection(text: string): MirrorReflection {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return reflectionSchema.parse(JSON.parse(candidate));
}

export async function generateMirrorReflection(input: {
  llm: LlmProvider;
  question: string;
  hexagram: LiuyaoResult;
  knowledge: LiuyaoKnowledgeContext;
  userContext?: PersonalReflectionContext;
}): Promise<{ reflection: MirrorReflection; provider: string; model: string }> {
  const { llm, question, hexagram, knowledge, userContext = { recentEvents: [], patterns: [] } } = input;
  const result = await llm.generate({
    temperature: 0.45,
    maxOutputTokens: 800,
    messages: [
      {
        role: "system",
        content: [
          "You are the Life Mirror Reflection Runtime.",
          "Traditional Wisdom and Mirror Reflection are separate layers.",
          "Use only the supplied KNOWLEDGE-003 classical text, symbolic mapping, user question and personal context.",
          "Never invent, correct or extend Liuyao meanings. Never predict the future or state fate as fact.",
          "Explain why the supplied symbolic meaning may relate to the user's current situation.",
          "Treat personal context as optional evidence: mention it only when it directly supports the reflection, and never turn an inference into a user fact.",
          "Do not claim certainty, diagnose the user, or tell the user what decision to make.",
          "Return only valid JSON with four Chinese string fields: observation, insight, reflectionQuestion, actionSuggestion.",
          "Observation describes the tension visible between the question and symbol.",
          "Insight offers one compassionate, tentative perspective.",
          "ReflectionQuestion is open-ended. ActionSuggestion is one small reversible action.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          question,
          originalHexagram: hexagram.originalHexagram,
          movingLines: hexagram.movingLines,
          changedHexagram: hexagram.changedHexagram,
          knowledge,
          personalContext: userContext,
        }),
      },
    ],
  });

  return { reflection: parseReflection(result.text), provider: result.provider, model: result.model };
}
