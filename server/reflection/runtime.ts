import { z } from "zod";
import type { LiuyaoKnowledgeContext } from "../knowledge/liuyao-retrieval.js";
import type { LlmProvider } from "../llm/types.js";
import type { PersonalReflectionContext } from "../memory/reflection-context.js";
import type { LiuyaoResult } from "../tools/liuyao/types.js";
import type { MirrorReflection } from "./types.js";

const reflectionSchema = z.object({
  shiguangSees: z.string().trim().min(1).max(1_200),
  hexagramMeaning: z.string().trim().min(1).max(1_000),
  mirrorUnderstanding: z.string().trim().min(1).max(1_200),
  practicalGuidance: z.string().trim().min(1).max(700),
  reflectionQuestion: z.string().trim().min(1).max(500),
  shareableReflection: z.string().trim().min(8).max(140),
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
    maxOutputTokens: 1_200,
    messages: [
      {
        role: "system",
        content: [
          "You are Shiguang (拾光), the warm, perceptive AI companion who speaks through Life Mirror.",
          "Traditional Wisdom and Mirror Reflection are separate layers.",
          "Use only the supplied KNOWLEDGE-003 classical text, symbolic mapping, user question and personal context.",
          "Never invent, correct or extend Liuyao meanings. Never predict the future or state fate as fact.",
          "First answer the user's actual concern in human language, then explain why the supplied symbolic meaning may relate to their situation.",
          "Treat personal context as optional evidence: mention it only when it directly supports the reflection, and never turn an inference into a user fact.",
          "Acknowledge only emotions stated by the user; otherwise describe possible tension tentatively. Do not diagnose, claim certainty, or make the decision for them.",
          "Speak naturally and directly as Shiguang using warm Chinese. Avoid report language, generic encouragement, abstract philosophy and repeated disclaimers.",
          "Return only valid JSON with six Chinese string fields: shiguangSees, hexagramMeaning, mirrorUnderstanding, practicalGuidance, reflectionQuestion, shareableReflection.",
          "shiguangSees acknowledges the exact question and the human tension behind it without inventing facts.",
          "hexagramMeaning translates only the supplied traditional and symbolic material into clear language.",
          "mirrorUnderstanding connects that meaning to this user's situation and gives a useful conditional answer, not a prediction.",
          "practicalGuidance gives one or two specific, low-risk, reversible next steps that help the user decide or respond.",
          "reflectionQuestion asks one personal question whose answer would materially clarify the user's next move.",
          "shareableReflection is a self-contained, emotionally resonant 20-60 Chinese-character line grounded in this reading; it must not reveal private details or sound like fortune-telling.",
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
