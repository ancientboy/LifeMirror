import { z } from "zod";
import type { LlmProvider } from "../../llm/types.js";
import { createIntentSelection, deterministicIntentConfidence } from "./context-resolver.js";
import type {
  LiuyaoIntent,
  LiuyaoIntentSelection,
  LiuyaoScenario,
  LiuyaoScenarioFocus,
  LiuyaoTopic,
  LiuyaoTopicHint,
  LiuyaoUsefulGodTarget,
} from "./types.js";

const topics = ["self", "career", "wealth", "study", "relationship_male", "relationship_female", "health", "family", "children", "travel", "legal", "partnership"] as const;
const targetRoles = ["default", "self", "other_party", "peer_competitor"] as const;
const scenarios = ["job_search", "exam", "reconciliation", "investment"] as const;
const focuses = [
  "job_interview", "job_offer", "job_start",
  "exam_performance", "exam_score", "exam_admission",
  "relationship_contact", "relationship_reconcile", "relationship_stability",
  "investment_short_term", "investment_long_term",
] as const;

const llmIntentSchema = z.object({
  label: z.string().trim().min(1).max(80),
  topic: z.enum(topics),
  targetRole: z.enum(targetRoles),
  scenario: z.enum(scenarios).nullable(),
  scenarioFocus: z.enum(focuses).nullable(),
});

const llmOptionSchema = z.object({
  label: z.string().trim().min(1).max(80),
  intents: z.array(llmIntentSchema).min(1).max(3),
});

const llmResolutionSchema = z.object({
  intents: z.array(llmIntentSchema).min(1).max(3),
  confidence: z.number().min(0).max(1),
  needsClarification: z.boolean(),
  clarificationQuestion: z.string().trim().min(1).max(160).nullable(),
  clarificationOptions: z.array(llmOptionSchema).max(3),
});

const intentJsonSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    intents: { type: "array", minItems: 1, maxItems: 3, items: { $ref: "#/$defs/intent" } },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    needsClarification: { type: "boolean" },
    clarificationQuestion: { type: ["string", "null"] },
    clarificationOptions: { type: "array", maxItems: 3, items: { $ref: "#/$defs/option" } },
  },
  required: ["intents", "confidence", "needsClarification", "clarificationQuestion", "clarificationOptions"],
  $defs: {
    intent: {
      type: "object",
      additionalProperties: false,
      properties: {
        label: { type: "string" },
        topic: { type: "string", enum: topics },
        targetRole: { type: "string", enum: targetRoles },
        scenario: { type: ["string", "null"], enum: [...scenarios, null] },
        scenarioFocus: { type: ["string", "null"], enum: [...focuses, null] },
      },
      required: ["label", "topic", "targetRole", "scenario", "scenarioFocus"],
    },
    option: {
      type: "object",
      additionalProperties: false,
      properties: {
        label: { type: "string" },
        intents: { type: "array", minItems: 1, maxItems: 3, items: { $ref: "#/$defs/intent" } },
      },
      required: ["label", "intents"],
    },
  },
};

export type LiuyaoIntentResolution = {
  status: "resolved" | "confirmation_required";
  source: LiuyaoIntentSelection["resolution"]["source"];
  confidence: number;
  summary: string;
  selection?: LiuyaoIntentSelection;
  clarification?: {
    question: string;
    options: Array<{ id: string; label: string; selection: LiuyaoIntentSelection }>;
  };
};

function parseJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(candidate);
}

function normalizeIntents(items: z.infer<typeof llmIntentSchema>[]): LiuyaoIntent[] {
  const scenarioTopics: Record<LiuyaoScenario, readonly LiuyaoTopic[]> = {
    job_search: ["career"], exam: ["study"],
    reconciliation: ["self", "relationship_male", "relationship_female"], investment: ["wealth"],
  };
  const focusScenarios: Record<LiuyaoScenarioFocus, LiuyaoScenario> = {
    job_interview: "job_search", job_offer: "job_search", job_start: "job_search",
    exam_performance: "exam", exam_score: "exam", exam_admission: "exam",
    relationship_contact: "reconciliation", relationship_reconcile: "reconciliation", relationship_stability: "reconciliation",
    investment_short_term: "investment", investment_long_term: "investment",
  };
  return items.map((item, index) => {
    const topic = item.topic as LiuyaoTopic;
    const scenario = item.scenario && scenarioTopics[item.scenario].includes(topic) ? item.scenario as LiuyaoScenario : undefined;
    const scenarioFocus = item.scenarioFocus && scenario && focusScenarios[item.scenarioFocus] === scenario ? item.scenarioFocus as LiuyaoScenarioFocus : undefined;
    const usefulGod: LiuyaoUsefulGodTarget | undefined = topic === "health" || item.targetRole === "self"
      ? "shi"
      : item.targetRole === "other_party" || (scenario === "reconciliation" && topic === "self")
        ? "ying"
        : item.targetRole === "peer_competitor"
          ? "siblings"
          : undefined;
    return {
      id: `${topic}-${index + 1}`,
      label: item.label,
      topic,
      priority: index + 1,
      ...(usefulGod ? { usefulGod } : {}),
      ...(scenario ? { scenario } : {}),
      ...(scenarioFocus ? { scenarioFocus } : {}),
    };
  });
}

function summary(selection: LiuyaoIntentSelection) {
  return selection.intents.map((intent) => intent.label).join("；");
}

const deterministicFocusOptions: Record<LiuyaoScenario, Array<{ label: string; focus: LiuyaoScenarioFocus }>> = {
  job_search: [
    { label: "面试能否发挥和推进", focus: "job_interview" },
    { label: "能否拿到录用或 offer", focus: "job_offer" },
    { label: "入职或试用期能否落地", focus: "job_start" },
  ],
  exam: [
    { label: "考试当场发挥", focus: "exam_performance" },
    { label: "成绩或是否通过", focus: "exam_score" },
    { label: "能否录取或入围", focus: "exam_admission" },
  ],
  reconciliation: [
    { label: "对方是否重新联系", focus: "relationship_contact" },
    { label: "双方能否复合", focus: "relationship_reconcile" },
    { label: "关系以后能否稳定", focus: "relationship_stability" },
  ],
  investment: [
    { label: "短线交易风险与得失", focus: "investment_short_term" },
    { label: "长期持有条件", focus: "investment_long_term" },
  ],
};

function deterministicClarification(question: string, topicHint: LiuyaoTopicHint | undefined, selection: LiuyaoIntentSelection): LiuyaoIntentResolution | null {
  if (!selection.scenario) return null;
  const options = deterministicFocusOptions[selection.scenario];
  return {
    status: "confirmation_required",
    source: "fallback",
    confidence: selection.resolution.confidence,
    summary: summary(selection),
    clarification: {
      question: "这次你最想确认的是哪个阶段？",
      options: options.map((option, index) => ({
        id: `option-${index + 1}`,
        label: option.label,
        selection: createIntentSelection({
          question,
          topicHint,
          intents: selection.intents.map((intent, intentIndex) => intentIndex === 0 ? { ...intent, label: option.label, scenarioFocus: option.focus } : intent),
          source: "user_confirmed",
          confidence: 1,
        }),
      })),
    },
  };
}

export async function understandLiuyaoIntent(input: {
  llm: LlmProvider;
  question: string;
  topicHint?: LiuyaoTopicHint;
}): Promise<LiuyaoIntentResolution> {
  const deterministic = createIntentSelection({ question: input.question, topicHint: input.topicHint });
  const deterministicConfidence = deterministicIntentConfidence(input.question, input.topicHint);
  if (deterministicConfidence >= 0.85) {
    return { status: "resolved", source: "deterministic", confidence: deterministicConfidence, summary: summary(deterministic), selection: deterministic };
  }

  if (input.llm.name === "disabled") {
    const fallback = createIntentSelection({
      question: input.question,
      topicHint: input.topicHint,
      source: "fallback",
      confidence: deterministicConfidence,
    });
    return deterministicClarification(input.question, input.topicHint, fallback)
      ?? { status: "resolved", source: "fallback", confidence: deterministicConfidence, summary: summary(fallback), selection: fallback };
  }

  try {
    const result = await input.llm.generate({
      temperature: 0,
      maxOutputTokens: 700,
      responseFormat: {
        name: "liuyao_intent_resolution",
        description: "Classify only what the user is asking before deterministic Liuyao calculation.",
        schema: intentJsonSchema,
        strict: true,
      },
      messages: [
        {
          role: "system",
          content: [
            "You classify a Chinese Liuyao question into the supplied enums. You do not interpret a hexagram, predict an outcome, choose a useful god or line, choose dates, or offer advice.",
            "The optional topicHint is a strong user-provided hint, but the literal question wins when they conflict.",
            "Separate genuinely distinct goals into at most three intents. Do not split one goal merely because several nouns appear.",
            "Use scenarioFocus only when the requested stage is clear. Never silently turn contact into reconciliation, interview into offer, performance into admission, or short-term trading into long-term holding.",
            "If one of those distinctions materially changes the target and is not clear, set needsClarification=true and provide two or three short mutually exclusive options, each containing the complete intents that would apply.",
            "targetRole describes only the real-world subject: self, other_party, peer_competitor, or default. Deterministic code maps that role to traditional targets later.",
            "Generic relationship questions without a stated gender use topic=self and targetRole=other_party. Health questions use topic=health and targetRole=self.",
            "When clarification is not needed, clarificationQuestion is null and clarificationOptions is empty.",
          ].join(" "),
        },
        { role: "user", content: JSON.stringify({ question: input.question, topicHint: input.topicHint ?? null }) },
      ],
    });
    const parsed = llmResolutionSchema.parse(parseJson(result.text));
    const selection = createIntentSelection({
      question: input.question,
      topicHint: input.topicHint,
      intents: normalizeIntents(parsed.intents),
      source: "llm",
      confidence: parsed.confidence,
    });
    if (parsed.needsClarification && parsed.clarificationQuestion && parsed.clarificationOptions.length >= 2) {
      return {
        status: "confirmation_required",
        source: "llm",
        confidence: parsed.confidence,
        summary: summary(selection),
        clarification: {
          question: parsed.clarificationQuestion,
          options: parsed.clarificationOptions.map((option, index) => ({
            id: `option-${index + 1}`,
            label: option.label,
            selection: createIntentSelection({
              question: input.question,
              topicHint: input.topicHint,
              intents: normalizeIntents(option.intents),
              source: "user_confirmed",
              confidence: 1,
            }),
          })),
        },
      };
    }
    return { status: "resolved", source: "llm", confidence: parsed.confidence, summary: summary(selection), selection };
  } catch {
    const fallback = createIntentSelection({
      question: input.question,
      topicHint: input.topicHint,
      source: "fallback",
      confidence: deterministicConfidence,
    });
    return deterministicClarification(input.question, input.topicHint, fallback)
      ?? { status: "resolved", source: "fallback", confidence: deterministicConfidence, summary: summary(fallback), selection: fallback };
  }
}
