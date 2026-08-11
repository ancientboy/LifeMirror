export const REPORT_REASON_CODES = ["harassment", "impersonation", "privacy", "other"] as const;
export const REPORT_RESOLUTION_CODES = ["confirmed", "no_action", "duplicate"] as const;

export function normalizeReportReason(value: unknown): typeof REPORT_REASON_CODES[number] | null {
  return REPORT_REASON_CODES.includes(value as typeof REPORT_REASON_CODES[number]) ? value as typeof REPORT_REASON_CODES[number] : null;
}

export function moderationTransition(current: "open" | "reviewed" | "closed", resolution: unknown) {
  if (current !== "open") return null;
  if (!REPORT_RESOLUTION_CODES.includes(resolution as typeof REPORT_RESOLUTION_CODES[number])) return null;
  return { status: "reviewed" as const, resolutionCode: resolution as typeof REPORT_RESOLUTION_CODES[number] };
}
