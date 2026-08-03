import type {
  MirrorReview,
  ProactiveReflectionDecision,
  ProactiveReflectionPreferences,
  ReviewCadence,
  ReviewMemory,
  ReviewPattern,
} from "./types.js";

const DAY_MS = 24 * 60 * 60 * 1_000;

export function reviewPeriod(cadence: ReviewCadence, now = new Date(), timezone = "UTC") {
  const duration = cadence === "weekly" ? 7 * DAY_MS : 30 * DAY_MS;
  return { start: new Date(now.getTime() - duration), end: now, timezone };
}

export function buildMirrorReview(input: {
  cadence: ReviewCadence;
  memories: ReviewMemory[];
  patterns?: ReviewPattern[];
  now?: Date;
  timezone?: string;
}): MirrorReview {
  const period = reviewPeriod(input.cadence, input.now, input.timezone);
  const memories = input.memories
    .filter((memory) => memory.occurredAt >= period.start && memory.occurredAt <= period.end)
    .sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime());
  const evidence = memories.map((memory) => ({
    id: `memory:${memory.sourceEventId}`,
    sourceEventId: memory.sourceEventId,
    occurredAt: memory.occurredAt.toISOString(),
    title: memory.title,
    summary: memory.summary,
  }));
  const evidenceId = new Map(evidence.map((item) => [item.sourceEventId, item.id]));
  const topicSignals = new Map<string, string[]>();
  for (const memory of memories) {
    const ids = topicSignals.get(memory.topic) ?? [];
    ids.push(evidenceId.get(memory.sourceEventId)!);
    topicSignals.set(memory.topic, ids);
  }
  const themes = [...topicSignals.entries()]
    .map(([name, evidenceIds]) => ({ name, signalCount: evidenceIds.length, evidenceIds }))
    .sort((left, right) => right.signalCount - left.signalCount || left.name.localeCompare(right.name));
  const changes: MirrorReview["changes"] = [];
  for (const pattern of input.patterns ?? []) {
    const evidenceIds = pattern.sourceEventIds.map((id) => evidenceId.get(id)).filter((id): id is string => Boolean(id));
    if (evidenceIds.length >= 2) changes.push({ kind: "recurring", description: pattern.title, evidenceIds });
  }
  for (const theme of themes.filter((item) => item.signalCount === 1).slice(0, 2)) {
    changes.push({ kind: "emerging", description: `新出现的探索主题：${theme.name}`, evidenceIds: theme.evidenceIds });
  }
  const uniqueQuestions = [...new Set(memories.map((memory) => memory.reflectionQuestion).filter(Boolean))].slice(-3);
  const uniqueSuggestions = [...new Set(memories.map((memory) => memory.actionSuggestion).filter(Boolean))].slice(-3);
  const sufficient = memories.length >= 2;
  const limitations = sufficient ? [] : ["当前周期内少于两条可见记忆，无法形成可靠趋势。"];
  return {
    cadence: input.cadence,
    period: { start: period.start.toISOString(), end: period.end.toISOString(), timezone: period.timezone },
    status: sufficient ? "ready" : "insufficient_evidence",
    summary: sufficient
      ? `本周期记录了 ${memories.length} 次镜像，较多关注 ${themes.slice(0, 2).map((theme) => theme.name).join("、")}。这些是阶段性线索，不是固定结论。`
      : "当前记录还不足以生成周期回顾。继续记录后，LifeMirror 才会尝试呈现阶段性线索。",
    themes,
    changes,
    reflectionQuestions: sufficient ? uniqueQuestions : [],
    gentleSuggestions: sufficient ? uniqueSuggestions : [],
    evidence,
    trust: {
      confidence: sufficient ? Math.min(0.85, 0.45 + memories.length * 0.08) : 0.25,
      evidenceCount: memories.length,
      limitations,
    },
  };
}

export function decideProactiveReflection(input: {
  review: MirrorReview;
  preferences: ProactiveReflectionPreferences;
  now?: Date;
  lastSuggestedAt?: Date;
  lastSuggestedPeriodEnd?: Date;
}): ProactiveReflectionDecision {
  if (!input.preferences.enabled) return { shouldSuggest: false, reason: "disabled" };
  const cadenceEnabled = input.review.cadence === "weekly" ? input.preferences.weeklyEnabled : input.preferences.monthlyEnabled;
  if (!cadenceEnabled) return { shouldSuggest: false, reason: "cadence_disabled" };
  if (input.review.status !== "ready") return { shouldSuggest: false, reason: "insufficient_evidence" };
  const now = input.now ?? new Date();
  if (input.lastSuggestedAt && now.getTime() - input.lastSuggestedAt.getTime() < input.preferences.cooldownHours * 60 * 60 * 1_000) {
    return { shouldSuggest: false, reason: "cooldown" };
  }
  if (input.lastSuggestedPeriodEnd && input.lastSuggestedPeriodEnd.toISOString() === input.review.period.end) {
    return { shouldSuggest: false, reason: "already_suggested" };
  }
  return {
    shouldSuggest: true,
    reason: "ready",
    suggestion: {
      cadence: input.review.cadence,
      title: input.review.cadence === "weekly" ? "这一周，想一起回看一下吗？" : "这个月，想一起回看一下吗？",
      prompt: "我整理了一些有来源的阶段性线索。只有你愿意时才开始回顾，你也可以随时关闭这类建议。",
      evidenceCount: input.review.trust.evidenceCount,
    },
  };
}
