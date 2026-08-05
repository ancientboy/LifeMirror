import { markAccountDataChanged } from "./account-data";

export type SavedBirthProfile = {
  version: 1;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  unknownTime: boolean;
  place: string;
  utcOffsetMinutes: number;
  longitude: string;
  latitude: string;
  dayBoundary: "midnight" | "late-zi";
  luckGender: "male" | "female" | null;
  useTrueSolarTime: boolean;
  updatedAt: string;
};

const SETTINGS_KEY = "life-mirror:memory-settings:v1";
export const BIRTH_PROFILE_CHANGED_EVENT = "life-mirror:birth-profile-changed";

function readSettings(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function validProfile(value: unknown): value is SavedBirthProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const profile = value as Partial<SavedBirthProfile>;
  return profile.version === 1
    && Number.isInteger(profile.year) && profile.year! >= 1900 && profile.year! <= 2100
    && Number.isInteger(profile.month) && profile.month! >= 1 && profile.month! <= 12
    && Number.isInteger(profile.day) && profile.day! >= 1 && profile.day! <= 31
    && typeof profile.place === "string" && profile.place.trim().length > 0
    && typeof profile.updatedAt === "string";
}

export function getSavedBirthProfile(): SavedBirthProfile | null {
  const value = readSettings().birthProfile;
  return validProfile(value) ? value : null;
}

export function saveBirthProfile(profile: Omit<SavedBirthProfile, "version" | "updatedAt">): SavedBirthProfile {
  const value: SavedBirthProfile = { ...profile, version: 1, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...readSettings(), birthProfile: value, birthProfileUpdatedAt: value.updatedAt }));
  window.dispatchEvent(new CustomEvent(BIRTH_PROFILE_CHANGED_EVENT));
  markAccountDataChanged();
  return value;
}

export function removeSavedBirthProfile() {
  const settings = readSettings();
  settings.birthProfile = null;
  settings.birthProfileUpdatedAt = new Date().toISOString();
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(BIRTH_PROFILE_CHANGED_EVENT));
  markAccountDataChanged();
}

export function formatSavedBirthProfile(profile: SavedBirthProfile) {
  const date = `${profile.year}年${profile.month}月${profile.day}日`;
  const time = profile.unknownTime ? "时间未知" : `${String(profile.hour).padStart(2, "0")}:${String(profile.minute).padStart(2, "0")}`;
  return `${date} · ${time} · ${profile.place}`;
}
