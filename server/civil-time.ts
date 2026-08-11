/** Server-safe copy of the civil-time resolver. Keep this inside server/ so
 * the API TypeScript build remains self-contained. */
export type CivilDateTime = { year: number; month: number; day: number; hour: number; minute: number };

function partsAt(epochMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(epochMs));
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? NaN);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute") };
}

export function isIanaTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }); return true; } catch { return false; }
}

export function resolveCivilOffsetMinutes(civil: CivilDateTime, timeZone?: string | null): number | null {
  if (!isIanaTimeZone(timeZone)) return null;
  const wallClock = Date.UTC(civil.year, civil.month - 1, civil.day, civil.hour, civil.minute);
  let instant = wallClock;
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const local = partsAt(instant, timeZone);
    const representedAsUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
    instant = wallClock - (representedAsUtc - instant);
  }
  return Math.round((wallClock - instant) / 60_000);
}
