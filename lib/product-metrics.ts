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
] as const;

export type ProductMetricEvent = typeof PRODUCT_METRIC_EVENTS[number];
export type ProductMetricSurface = "chat" | "daily" | "mirror" | "share" | "relationship";

const eventSet = new Set<string>(PRODUCT_METRIC_EVENTS);
const surfaceSet = new Set<string>(["chat", "daily", "mirror", "share", "relationship"]);

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
