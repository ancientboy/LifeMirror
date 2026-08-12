"use client";

export const PRODUCT_METRIC_EVENTS = [
  "chat_message_sent",
  "daily_opened",
  "daily_checkin_completed",
  "mirror_result_ready",
  "tool_continued_chat",
  "share_card_shared",
  "share_link_created",
  "share_response_created",
  "first_reply_received",
  "conversation_continued",
  "life_loop_created",
  "life_loop_feedback",
  "memory_recall_positive",
  "memory_recall_negative",
  "share_intent",
  "invite_accepted",
  "onboarding_started",
  "onboarding_prompt_used",
  "generation_stopped",
  "generation_retried",
  "chat_feedback_helpful",
  "chat_feedback_missed",
  "account_bound",
  "relationship_entry_opened",
  "relationship_text_submitted",
  "relationship_image_submitted",
  "relationship_clarification_shown",
  "relationship_clarification_answered",
  "relationship_answer_received",
  "relationship_reply_copied",
  "relationship_person_saved",
  "relationship_case_revisited",
  "relationship_feedback_submitted",
  "relationship_outcome_positive",
  "relationship_outcome_negative",
  "vision_parse_failed",
] as const;

export type ProductMetricEvent = typeof PRODUCT_METRIC_EVENTS[number];
export type ProductMetricSurface = "chat" | "daily" | "mirror" | "share" | "relationship" | "onboarding" | "account";

const eventSet = new Set<string>(PRODUCT_METRIC_EVENTS);
const surfaceSet = new Set<string>(["chat", "daily", "mirror", "share", "relationship", "onboarding", "account"]);

/**
 * Sends only an allow-listed behavioral counter.  Callers must never pass
 * copy, prompts, real-person IDs, account data or share tokens as eventKey.
 */
export function recordProductMetric(eventType: ProductMetricEvent, surface: ProductMetricSurface, eventKey: string) {
  if (!eventSet.has(eventType) || !surfaceSet.has(surface) || !/^[a-zA-Z0-9:_-]{8,120}$/.test(eventKey)) return;
  void fetch("/api/v1/account/product-metrics/events", {
    method: "POST", credentials: "include", headers: { "content-type": "application/json" },
    body: JSON.stringify({ eventType, surface, eventKey }),
  }).catch(() => undefined);
}

export function metricDayKey(prefix: string, date = new Date()) {
  return `${prefix}:${new Intl.DateTimeFormat("en-CA").format(date)}`;
}
