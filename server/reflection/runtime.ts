import { z } from "zod";
import type { LiuyaoKnowledgeContext } from "../knowledge/liuyao-retrieval.js";
import type { LiuyaoReflectionKnowledge } from "../knowledge/liuyao-reflection-map.js";
import type { LlmProvider } from "../llm/types.js";
import type { PersonalReflectionContext } from "../memory/reflection-context.js";
import type { LiuyaoResult } from "../tools/liuyao/types.js";
import { assembleMirrorRuntimeContext } from "./context.js";
import type { ExplanationTrace, MirrorReflection } from "./types.js";

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
  reflectionKnowledge: LiuyaoReflectionKnowledge;
  userContext?: PersonalReflectionContext;
}): Promise<{ reflection: MirrorReflection; explanationTrace: ExplanationTrace; provider: string; model: string }> {
  const { llm, question, hexagram, knowledge, reflectionKnowledge, userContext = { recentEvents: [], patterns: [] } } = input;
  const runtimeContext = assembleMirrorRuntimeContext({ question, hexagram, knowledge, reflectionKnowledge, userContext });
  const result = await llm.generate({
    temperature: 0.45,
    maxOutputTokens: 1_200,
    messages: [
      {
        role: "system",
        content: [
          "You are Shiguang (拾光), the warm, perceptive AI companion who speaks through Life Mirror.",
          "Traditional Wisdom and Mirror Reflection are separate layers.",
          "Use only the supplied KNOWLEDGE-003 classical text, KNOWLEDGE-004 reflection mappings, user question and personal context.",
          "Treat LIUYAO_TOOL structure, traditionalAnalysis and evidence as immutable computed facts. Do not recalculate, override, complete or contradict them.",
          "If traditionalAnalysis.status is context_required, say no traditional rule conclusion was calculated; never fill the missing fields yourself.",
          "Never invent, correct or extend Liuyao meanings. Never predict the future or state fate as fact.",
          "KNOWLEDGE-004 mappings are translation candidates, not facts about the user. Use only mappings whose basis is present, and phrase the connection tentatively.",
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
        content: JSON.stringify(runtimeContext),
      },
    ],
  });

  const reflection = parseReflection(result.text);
  return {
    reflection,
    explanationTrace: {
      traditional_basis: knowledge.readingRule.focus.map((item) => `${item.label}: ${item.text}`).join("；"),
      liuyao_factors: hexagram.evidence.map((item) => `${item.rule}: ${item.conclusion}`),
      reflection_mapping: reflectionKnowledge.mappings.map((item) => `${item.traditionalConcept} → ${item.humanMeaning}`).join("；"),
      final_response: reflection,
    },
    provider: result.provider,
    model: result.model,
  };
}
