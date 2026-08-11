/**
 * Resolve the UTC offset for a civil time in an IANA zone.  A numeric UTC
 * offset is still accepted elsewhere as a compatibility fallback, but it is
 * wrong for many historical birth dates because of daylight-saving changes.
 */
export type CivilDateTime = { year: number; month: number; day: number; hour: number; minute: number };

function partsAt(epochMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(epochMs));
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? NaN);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute") };
}

export function isIanaTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }); return true; } catch { return false; }
}

/** Returns the historical offset in minutes east of UTC for this wall-clock time. */
export function resolveCivilOffsetMinutes(civil: CivilDateTime, timeZone?: string | null): number | null {
  if (!isIanaTimeZone(timeZone)) return null;
  const wallClock = Date.UTC(civil.year, civil.month - 1, civil.day, civil.hour, civil.minute);
  // Format the instant in the requested zone, interpret those fields as UTC,
  // then iterate once more. This handles both standard and DST offsets without
  // relying on the browser's own zone.
  let instant = wallClock;
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const local = partsAt(instant, timeZone);
    const representedAsUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
    instant = wallClock - (representedAsUtc - instant);
  }
  return Math.round((wallClock - instant) / 60_000);
}

export function localDateInZone(now: Date, timeZone?: string | null, fallbackOffsetMinutes = 0): Pick<CivilDateTime, "year" | "month" | "day"> {
  if (isIanaTimeZone(timeZone)) {
    const local = partsAt(now.getTime(), timeZone);
    return { year: local.year, month: local.month, day: local.day };
  }
  const shifted = new Date(now.getTime() + fallbackOffsetMinutes * 60_000);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}
