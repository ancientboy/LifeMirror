import { z } from "zod";
import type { LiuyaoKnowledgeContext } from "../knowledge/liuyao-retrieval.js";
import type { LiuyaoReflectionKnowledge } from "../knowledge/liuyao-reflection-map.js";
import type { LlmProvider } from "../llm/types.js";
import type { PersonalReflectionContext } from "../memory/reflection-context.js";
import type { LiuyaoResult } from "../tools/liuyao/types.js";
import { assembleMirrorRuntimeContext } from "./context.js";
import type { ExplanationTrace, MirrorReflection } from "./types.js";
import type { InteractionMode } from "../runtime/types.js";

const reflectionSchema = z.object({
  traditionalJudgment: z.string().trim().min(1).max(1_200),
  reasoningExplanation: z.string().trim().min(1).max(1_200),
  shiguangInterpretation: z.string().trim().min(1).max(1_200),
  practicalGuidance: z.string().trim().min(1).max(700),
  evidenceCards: z.array(z.object({
    title: z.string().trim().min(1).max(120),
    technical: z.string().trim().min(1).max(300),
    plain: z.string().trim().min(1).max(400),
    effect: z.enum(["positive", "negative", "mixed"]),
  })).min(2).max(4),
  closing: z.object({
    type: z.enum(["banter", "follow_up", "observation", "reflection"]),
    text: z.string().trim().min(1).max(300),
  }).optional(),
  reflectionQuestion: z.string().trim().min(1).max(500).optional(),
  shareableReflection: z.string().trim().min(8).max(140),
  shareCards: z.object({
    warm: z.object({ title: z.string().trim().min(1).max(40), quote: z.string().trim().min(8).max(120), meta: z.string().trim().min(1).max(80) }),
    witty: z.object({ title: z.string().trim().min(1).max(40), quote: z.string().trim().min(8).max(120), meta: z.string().trim().min(1).max(80) }),
    roast: z.object({ title: z.string().trim().min(1).max(40), quote: z.string().trim().min(8).max(120), meta: z.string().trim().min(1).max(80) }),
  }).optional(),
});

function parseReflection(text: string): MirrorReflection {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  const reflection = reflectionSchema.parse(JSON.parse(candidate));
  if (!reflection.shareCards) return reflection;
  const cleanQuote = (quote: string) => quote.replace(/^(?:翻译(?:一下|成人话)?|人话(?:版)?|暖心(?:版)?|轻毒舌(?:版)?)[：:\s]+/u, "");
  return {
    ...reflection,
    shareCards: {
      warm: { ...reflection.shareCards.warm, quote: cleanQuote(reflection.shareCards.warm.quote) },
      witty: { ...reflection.shareCards.witty, quote: cleanQuote(reflection.shareCards.witty.quote) },
      roast: { ...reflection.shareCards.roast, quote: cleanQuote(reflection.shareCards.roast.quote) },
    },
  };
}

export async function generateMirrorReflection(input: {
  llm: LlmProvider;
  question: string;
  hexagram: LiuyaoResult;
  knowledge: LiuyaoKnowledgeContext;
  reflectionKnowledge: LiuyaoReflectionKnowledge;
  userContext?: PersonalReflectionContext;
  interactionMode?: InteractionMode;
}): Promise<{ reflection: MirrorReflection; explanationTrace: ExplanationTrace; provider: string; model: string }> {
  const { llm, question, hexagram, knowledge, reflectionKnowledge, userContext = { recentEvents: [], patterns: [] }, interactionMode = "reflection" } = input;
  const runtimeContext = assembleMirrorRuntimeContext({ question, hexagram, knowledge, reflectionKnowledge, userContext });
  const result = await llm.generate({
    temperature: 0.45,
    maxOutputTokens: 1_200,
    messages: [
      {
        role: "system",
        content: [
          "You are Shiguang (拾光), a friend who genuinely understands Liuyao, translates it into vivid everyday Chinese, and stands beside the user without acting mysterious.",
          "Traditional Wisdom and Mirror Reflection are separate layers.",
          "Use only the supplied classical text, LIUYAO_TOOL judgment package, structure, analysis, evidence, user question and optional personal context.",
          "Treat LIUYAO_TOOL structure, analysis, judgment and evidence as immutable computed facts. Do not recalculate, override, complete or contradict them.",
          "Treat hexagram_body_location, wandering_soul_structure, returning_soul_structure, single_moving_line and single_static_line as structural or focus evidence only. Never turn one of them alone into a favorable or unfavorable verdict.",
          "If analysis.status is context_required, say no traditional rule conclusion was calculated; never fill the missing fields yourself.",
          "Never invent, correct or extend Liuyao meanings. Never predict the future or state fate as fact.",
          "KNOWLEDGE-004 mappings are optional reflection candidates, not the answer skeleton and not facts about the user. Ignore them unless the user explicitly asks for self-reflection or judgment.tone calls for careful reflection.",
          "The user came for an answer. Give the direct result first, then explain the 2-4 strongest computed factors as a small story, translate it into ordinary language, and end naturally.",
          "Do not evade the question with phrases such as 'you are not really asking', 'this is not about yes or no', 'the real question is', or 'more important than an answer'. Do not replace the user's stated question with a psychological one.",
          "Answer every judgment.verdict separately when there are multiple intents. A favorable travel verdict and unfavorable wealth verdict should become a crisp answer such as '约，可以约；赢钱就别抱太大期待', never a blended '存在不确定性'.",
          "Use each verdict.label as its exact target. Do not merge interview with offer, performance with score/admission, contact with reconciliation/stability, or short-term investment with long-term holding.",
          "Translate favorable, mixed, unfavorable and undetermined faithfully as positive, conditional, pause/low-expectation, or explicitly limited. Do not exaggerate confidence.",
          "When verdict.evidenceBalance is conflicted, state the strongest support and strongest obstruction in the same answer, preserve the lower confidence, and use the supplied shortReason. Never hide conflict behind a generic '情况复杂'.",
          "Keep evidence scoped by intentId. An evidence card for one intent must not be used to justify another intent's verdict.",
          "If analysis.timing contains dateWindows and timing is relevant to the user's question, preserve each candidate's supplied scale: day means branch-day windows and month means solar-term month windows. Quote only the supplied reason, dates and confidence. Never turn a candidate window into a promised event date.",
          "Treat personal context as optional evidence: mention it only when it directly supports the reflection, and never turn an inference into a user fact.",
          "Acknowledge only emotions stated by the user; otherwise describe possible tension tentatively. Do not diagnose, claim certainty, or make the decision for them.",
          "Match judgment.tone: playful may tease lightly, warm stays humane, grounded is crisp, careful avoids jokes and adds appropriate real-world caution. Avoid academic reports, psychological assessments, fortune-teller performance, generic encouragement, abstract philosophy and repeated disclaimers.",
          "For health, legal or investment questions, preserve the supplied limitation and keep practical guidance anchored in professional evaluation, source verification and real-world risk controls.",
          "Never use stock counselling language such as '真正的问题', '内在需要', '看见自己', '承接', '觉察', or '低风险可撤回实验' unless the user explicitly requested that mode.",
          "Return only valid JSON with: traditionalJudgment, reasoningExplanation, shiguangInterpretation, practicalGuidance, evidenceCards, optional closing, optional reflectionQuestion, shareableReflection, shareCards.",
          "traditionalJudgment must begin with '先说结论：' or, for a light conversational question, '先说结果：'. Answer immediately and put conditions afterward.",
          "reasoningExplanation uses only supplied computed facts. Select 2-4 decisive factors and describe how they interact; do not dump every rule.",
          "evidenceCards contains 2-4 cards copied faithfully from judgment.keyEvidence. technical names the actual rule/factor; plain explains it vividly; map support to positive, obstruct to negative, and mixed/neutral to mixed.",
          "shiguangInterpretation adds warmth and human understanding after the answer has been satisfied. It may connect the supported meaning to the user's situation, but must not reinterpret what they are 'actually' asking.",
          "practicalGuidance gives one or two situation-specific reminders in natural speech. It need not be framed as an experiment.",
          "closing is optional and scene-aware: banter/follow_up for light questions, observation for serious decisions, reflection only when genuinely invited. Do not force every reading into reflection.",
          "reflectionQuestion is optional and may appear only when closing.type is reflection.",
          "shareableReflection is a self-contained, emotionally resonant 20-60 Chinese-character line grounded in this reading; it must not reveal private details or sound like fortune-telling.",
          "shareCards must contain warm, witty and roast. They are three genuinely different social expressions of the same computed conclusion, not color variants: warm is sincere and comforting; witty is a compact Chinese internet-style translation joke; roast is lightly sharp and self-aware, never humiliating. Each card has title, quote and meta. Write each quote as finished copy; never prefix it with labels such as '翻译一下：', '人话版：' or a style name. Never change the traditional conclusion merely to make a joke.",
          interactionMode === "deep" ? "Deep mode: make the reasoning chain explicit, distinguish computed evidence from interpretation, mention the strongest counter-signal, and give concrete conditional guidance. Do not add new claims or certainty." : "Reflection mode: keep the interpretation concise, warm and directly useful.",
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
