import { z } from "zod";

export const productMetricEventTypes = ["chat_message_sent", "daily_opened", "daily_checkin_completed", "mirror_result_ready", "tool_continued_chat", "share_card_shared", "share_link_created", "share_response_created", "first_reply_received", "conversation_continued", "life_loop_created", "life_loop_feedback", "memory_recall_positive", "memory_recall_negative", "share_intent"] as const;
const surfaces = ["chat", "daily", "mirror", "share", "relationship"] as const;

/** Product metrics are opaque counters. This schema intentionally has no text, name, content or token fields. */
export const productMetricEventSchema = z.object({
  eventType: z.enum(productMetricEventTypes),
  surface: z.enum(surfaces),
  eventKey: z.string().regex(/^[a-zA-Z0-9:_-]{8,120}$/),
}).strict();

export function summarizeProductMetrics(rows: Array<{ event_type: string; total: number | string }>) {
  const totals = Object.fromEntries(productMetricEventTypes.map((event) => [event, 0])) as Record<typeof productMetricEventTypes[number], number>;
  for (const row of rows) if (row.event_type in totals) totals[row.event_type as keyof typeof totals] = Number(row.total) || 0;
  return {
    ...totals,
    dailyCompletionRate: totals.daily_opened ? totals.daily_checkin_completed / totals.daily_opened : 0,
    shareRate: totals.mirror_result_ready ? totals.share_card_shared / totals.mirror_result_ready : 0,
    conversationContinuationRate: totals.first_reply_received ? totals.conversation_continued / totals.first_reply_received : 0,
    realityFeedbackRate: totals.life_loop_created ? totals.life_loop_feedback / totals.life_loop_created : 0,
    memoryAccuracyRate: totals.memory_recall_positive + totals.memory_recall_negative ? totals.memory_recall_positive / (totals.memory_recall_positive + totals.memory_recall_negative) : 0,
  };
}
