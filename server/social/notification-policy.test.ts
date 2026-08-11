import assert from "node:assert/strict";
import test from "node:test";
import { canDeliverExternalNotification, defaultNotificationPreferences } from "./notification-policy.js";

test("notification policy respects user opt-out and a six-hour delivery cooldown", () => {
  const now = new Date("2026-08-11T12:00:00.000Z");
  assert.equal(canDeliverExternalNotification({ type: "relationship_request", preferences: defaultNotificationPreferences, now }), true);
  assert.equal(canDeliverExternalNotification({ type: "relationship_request", preferences: { ...defaultNotificationPreferences, relationship_request: false }, now }), false);
  assert.equal(canDeliverExternalNotification({ type: "relationship_request", preferences: defaultNotificationPreferences, lastDeliveredAt: "2026-08-11T08:00:00.000Z", now }), false);
});

test("quiet hours postpone optional external delivery without losing the in-app record", () => {
  assert.equal(canDeliverExternalNotification({ type: "share_response", preferences: { ...defaultNotificationPreferences, quietHoursEnabled: true }, quietHours: { start: 22, end: 8 }, now: new Date("2026-08-11T23:00:00.000Z") }), false);
});
