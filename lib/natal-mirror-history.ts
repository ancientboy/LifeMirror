import type { BaziResult } from "@/server/tools/bazi/types";
import type { AstrologyResult } from "@/server/tools/astrology/types";
import type { SavedBirthProfile } from "./birth-profile";
import type { MirrorResult } from "@/components/app/UnifiedMirrorResult";
import { markAccountDataChanged } from "./account-data";

type NatalKind = "bazi" | "astrology";
type NatalResult = BaziResult | AstrologyResult;

export type SavedNatalMirror = {
  version: 1;
  kind: NatalKind;
  profileKey: string;
  result: NatalResult;
  reflection?: MirrorResult;
  calculatedAt: string;
};

const KEY = "life-mirror:natal-mirrors:v1";
const SETTINGS_KEY = "life-mirror:memory-settings:v1";

function readSettings(): Record<string, unknown> {
  try {
    const value = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch { return {}; }
}

function profileKey(profile: SavedBirthProfile) {
  return [profile.year, profile.month, profile.day, profile.hour, profile.minute, profile.unknownTime, profile.place.trim(), profile.utcOffsetMinutes, profile.timeZone ?? "", profile.longitude, profile.latitude, profile.dayBoundary, profile.luckGender ?? "", profile.useTrueSolarTime].join("|");
}

function read(): SavedNatalMirror[] {
  if (typeof window === "undefined") return [];
  try {
    // v2 stores these stable charts in the account settings snapshot.  The
    // legacy key remains readable so existing users are migrated on first save.
    const settings = readSettings();
    const value = settings.natalMirrors ?? JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is SavedNatalMirror => item?.version === 1 && (item.kind === "bazi" || item.kind === "astrology") && typeof item.profileKey === "string" && item.result) : [];
  } catch { return []; }
}

function write(items: SavedNatalMirror[]) {
  const value = items.slice(0, 12);
  window.localStorage.setItem(KEY, JSON.stringify(value));
  // AccountDataSync already persists settings across devices. Keeping a copy in
  // the old key makes the migration reversible for a user who has not logged in.
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...readSettings(), natalMirrors: value, natalMirrorsUpdatedAt: new Date().toISOString() }));
  markAccountDataChanged();
}

/** The dashboard only needs the latest saved chart for each system. */
export function getLatestSavedNatalMirrors(): Partial<Record<NatalKind, SavedNatalMirror>> {
  return read().reduce<Partial<Record<NatalKind, SavedNatalMirror>>>((latest, item) => {
    const current = latest[item.kind];
    if (!current || Date.parse(item.calculatedAt) > Date.parse(current.calculatedAt)) latest[item.kind] = item;
    return latest;
  }, {});
}

export function getSavedNatalMirror<T extends NatalResult>(kind: NatalKind, profile: SavedBirthProfile): SavedNatalMirror & { result: T } | null {
  const match = read().find((item) => item.kind === kind && item.profileKey === profileKey(profile));
  return match as (SavedNatalMirror & { result: T }) | null;
}

export function saveNatalMirror(kind: NatalKind, profile: SavedBirthProfile, result: NatalResult, reflection?: MirrorResult) {
  const key = profileKey(profile);
  const existing = read().find((item) => item.kind === kind && item.profileKey === key);
  const next: SavedNatalMirror = { version: 1, kind, profileKey: key, result, reflection: reflection ?? existing?.reflection, calculatedAt: new Date().toISOString() };
  write([next, ...read().filter((item) => !(item.kind === kind && item.profileKey === key))]);
}

export function saveNatalMirrorReflection(kind: NatalKind, profile: SavedBirthProfile, reflection: MirrorResult) {
  const existing = getSavedNatalMirror(kind, profile);
  if (existing) saveNatalMirror(kind, profile, existing.result, reflection);
}
