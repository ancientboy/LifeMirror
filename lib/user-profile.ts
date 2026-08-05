import { markAccountDataChanged } from "./account-data";

export type GenderDisplay = "hidden" | "female" | "male" | "nonbinary";

export type UserProfile = {
  version: 1;
  nickname: string;
  avatar: string;
  gender: GenderDisplay;
  updatedAt: string;
};

const SETTINGS_KEY = "life-mirror:memory-settings:v1";
export const USER_PROFILE_CHANGED_EVENT = "life-mirror:user-profile-changed";

function readSettings(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export function getUserProfile(): UserProfile {
  const value = readSettings().userProfile as Partial<UserProfile> | undefined;
  return {
    version: 1,
    nickname: typeof value?.nickname === "string" ? value.nickname.slice(0, 20) : "",
    avatar: typeof value?.avatar === "string" ? value.avatar : "",
    gender: ["hidden", "female", "male", "nonbinary"].includes(value?.gender ?? "") ? value!.gender as GenderDisplay : "hidden",
    updatedAt: typeof value?.updatedAt === "string" ? value.updatedAt : "",
  };
}

export function saveUserProfile(profile: Pick<UserProfile, "nickname" | "avatar" | "gender">) {
  const value: UserProfile = {
    version: 1,
    nickname: profile.nickname.trim().slice(0, 20),
    avatar: profile.avatar,
    gender: profile.gender,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...readSettings(), userProfile: value, userProfileUpdatedAt: value.updatedAt }));
  window.dispatchEvent(new CustomEvent(USER_PROFILE_CHANGED_EVENT));
  markAccountDataChanged();
  return value;
}
