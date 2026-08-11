export const SOCIAL_NOTIFICATION_TYPES = ["relationship_request", "relationship_accepted", "relationship_question", "share_response"] as const;
export type SocialNotificationType = (typeof SOCIAL_NOTIFICATION_TYPES)[number];
export type NotificationPreferences = Record<SocialNotificationType, boolean> & { quietHoursEnabled: boolean };

export const defaultNotificationPreferences: NotificationPreferences = {
  relationship_request: true,
  relationship_accepted: true,
  relationship_question: true,
  share_response: true,
  quietHoursEnabled: false,
};

/** In-app records are never dropped; this only governs optional external delivery. */
export function canDeliverExternalNotification(input: { type: SocialNotificationType; preferences: NotificationPreferences; lastDeliveredAt?: string | null; now: Date; quietHours?: { start: number; end: number } }): boolean {
  if (!input.preferences[input.type]) return false;
  const last = input.lastDeliveredAt ? Date.parse(input.lastDeliveredAt) : NaN;
  if (Number.isFinite(last) && input.now.getTime() - last < 6 * 60 * 60 * 1000) return false;
  if (input.preferences.quietHoursEnabled && input.quietHours) {
    const hour = input.now.getUTCHours();
    const { start, end } = input.quietHours;
    const quiet = start < end ? hour >= start && hour < end : hour >= start || hour < end;
    if (quiet) return false;
  }
  return true;
}
