import { calculateAstrology, calculateAstrologyTransits } from "../server/tools/astrology/core.js";
import { calculateBazi, relateBaziDay } from "../server/tools/bazi/engine.js";
import { localDateInZone } from "./civil-time.js";

export type DailyBirthProfile = {
  year: number; month: number; day: number; hour: number; minute: number; unknownTime: boolean;
  place: string; utcOffsetMinutes: number; timeZone?: string | null; longitude: string; latitude: string;
  dayBoundary: "midnight" | "late-zi"; luckGender: "male" | "female" | null; useTrueSolarTime: boolean;
};

type MirrorHistoryItem = {
  question?: string;
  savedAt?: string;
  source?: string;
  sourceLabel?: string;
  reflection?: { shareableReflection?: string; shiguangInterpretation?: string; traditionalJudgment?: string };
};

type DailyLoopItem = { date?: string; theme?: string; action?: string; status?: "done" | "later" | "release"; checkedInAt?: string };
type DailyRuntimeContext = {
  observations?: Array<{ title?: string; summary?: string; evidenceCount?: number; lastObservedAt?: string }>;
  dailyCheckins?: Array<{ id?: string; summary?: string; occurredAt?: string }>;
};

export type DailyEvidence = { label: "本命底图" | "今日行运" | "近期状态" | "近期镜像" | "授权现实"; detail: string };

export type DailyGuidanceContext = {
  mode: "personal_daily_fortune" | "daily_state_note";
  date: string;
  evidence: DailyEvidence[];
  modelContext: Record<string, unknown>;
};

export type DailyGuidance = { theme: string; reason: string; action: string; sources: DailyEvidence["label"][] };

const EVIDENCE_LABELS = new Set<DailyEvidence["label"]>(["本命底图", "今日行运", "近期状态", "近期镜像", "授权现实"]);

/** The model can phrase the note, but never invent its provenance. */
export function sanitizeDailyGuidance(value: unknown, fallback: DailyGuidance, evidence: DailyEvidence[]): DailyGuidance {
  if (!value || typeof value !== "object") return fallback;
  const item = value as Record<string, unknown>;
  const text = (key: "theme" | "reason" | "action", max: number) => typeof item[key] === "string" && item[key].trim().length >= 4
    ? [...item[key].trim()].slice(0, max).join("") : fallback[key];
  const allowed = new Set(evidence.map((entry) => entry.label));
  const sources = Array.isArray(item.sources)
    ? item.sources.filter((source): source is DailyEvidence["label"] => typeof source === "string" && EVIDENCE_LABELS.has(source as DailyEvidence["label"]) && allowed.has(source as DailyEvidence["label"])).slice(0, 3)
    : [];
  return { theme: text("theme", 52), reason: text("reason", 120), action: text("action", 80), sources: sources.length ? sources : fallback.sources };
}

function toNumber(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function hasUsableCoordinates(profile: DailyBirthProfile) {
  if (!profile.latitude.trim() || !profile.longitude.trim()) return false;
  const latitude = Number(profile.latitude);
  const longitude = Number(profile.longitude);
  return profile.place.trim().length > 0 && Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function recentContext(history: MirrorHistoryItem[]) {
  return history.slice(0, 3).map((item) => ({
    question: item.question?.trim() ?? "",
    source: item.sourceLabel ?? item.source ?? "个人镜像",
    summary: item.reflection?.shiguangInterpretation ?? item.reflection?.shareableReflection ?? item.reflection?.traditionalJudgment ?? "",
    savedAt: item.savedAt ?? "",
  })).filter((item) => item.question || item.summary);
}

export function buildDailyGuidanceContext(profile: DailyBirthProfile | null, history: MirrorHistoryItem[], explicitFacts: Array<{ text?: string; updatedAt?: string }> = [], dailyLoop: DailyLoopItem[] = [], runtime: DailyRuntimeContext | null = null): DailyGuidanceContext {
  const recent = recentContext(history);
  const authorizedFacts = explicitFacts.map((item) => ({ text: item.text?.trim() ?? "", updatedAt: item.updatedAt ?? "" })).filter((item) => item.text).slice(0, 3);
  // Automatic observations can guide a Daily only as a current, provisional
  // theme.  Their evidence remains separate from user-authored facts and they
  // never turn into a statement about personality.
  const activeObservation = runtime?.observations?.find((item) => typeof item?.title === "string" && typeof item?.summary === "string") ?? null;
  const recentCheckins = dailyLoop.filter((item) => item && item.status && item.action)
    .sort((left, right) => String(right.checkedInAt || right.date || "").localeCompare(String(left.checkedInAt || left.date || ""))).slice(0, 3)
    .map((item) => ({ date: item.date ?? "", action: String(item.action).slice(0, 160), status: item.status }));
  const latestCheckin = recentCheckins[0];
  if (!profile || !hasUsableCoordinates(profile)) {
    const date = new Date().toISOString().slice(0, 10);
    const evidence: DailyEvidence[] = recent.length
      ? [{ label: "近期状态", detail: `最近在意：${recent[0].question || "一件尚未落定的事"}` }, { label: "近期镜像", detail: recent[0].source }]
      : [{ label: "近期状态", detail: "今天的状态与此刻的对话" }];
    if (latestCheckin) evidence.unshift({ label: "近期状态", detail: `最近一次小行动：${latestCheckin.status === "done" ? "已完成" : latestCheckin.status === "release" ? "先放下" : "还在进行"}「${latestCheckin.action}」` });
    else if (activeObservation) evidence.unshift({ label: "近期状态", detail: `最近反复出现：${activeObservation.title}` });
    if (authorizedFacts.length) evidence.push({ label: "授权现实", detail: `你明确保留：${authorizedFacts[0].text}` });
    return { mode: "daily_state_note", date, evidence: evidence.slice(0, 4), modelContext: { date, mode: "daily_state_note", recent, recentCheckins, authorizedFacts, activeObservation } };
  }

  try {
    const today = localDateInZone(new Date(), profile.timeZone, profile.utcOffsetMinutes);
    const birthHour = profile.unknownTime ? null : profile.hour;
    const natalAstrology = calculateAstrology({
      year: profile.year, month: profile.month, day: profile.day, hour: birthHour, minute: profile.minute,
      utcOffsetMinutes: profile.utcOffsetMinutes, timeZone: profile.timeZone, latitude: toNumber(profile.latitude), longitude: toNumber(profile.longitude),
    });
    const natalBazi = calculateBazi({
      year: profile.year, month: profile.month, day: profile.day, hour: birthHour, minute: profile.minute,
      utcOffsetMinutes: profile.utcOffsetMinutes, timeZone: profile.timeZone, longitude: profile.longitude ? toNumber(profile.longitude) : null,
      useTrueSolarTime: profile.useTrueSolarTime, dayBoundary: profile.dayBoundary, luckGender: profile.luckGender,
    });
    const dailyAstrology = calculateAstrology({
      ...today, hour: 12, minute: 0, utcOffsetMinutes: profile.utcOffsetMinutes, timeZone: profile.timeZone,
      latitude: toNumber(profile.latitude), longitude: toNumber(profile.longitude),
    });
    const dailyBazi = calculateBazi({
      ...today, hour: 12, minute: 0, utcOffsetMinutes: profile.utcOffsetMinutes, timeZone: profile.timeZone, longitude: null,
      useTrueSolarTime: false, dayBoundary: "midnight", luckGender: null,
    });
    const transit = calculateAstrologyTransits(natalAstrology, {
      ...today, hour: 12, minute: 0, utcOffsetMinutes: profile.utcOffsetMinutes, timeZone: profile.timeZone,
      latitude: toNumber(profile.latitude), longitude: toNumber(profile.longitude),
    });
    const baziDayRelation = relateBaziDay(natalBazi, dailyBazi);
    const natalSun = natalAstrology.planets.find((item) => item.key === "sun");
    const natalMoon = natalAstrology.planets.find((item) => item.key === "moon");
    const dailySun = dailyAstrology.planets.find((item) => item.key === "sun");
    const dailyMoon = dailyAstrology.planets.find((item) => item.key === "moon");
    const dayPillar = dailyBazi.pillars[2];
    const evidence: DailyEvidence[] = [
      { label: "本命底图", detail: `日主${natalBazi.fiveElementProfile.dayMaster}${natalBazi.fiveElementProfile.dayMasterElement} · 月令${natalBazi.seasonalProfile.relationToDayMaster} · 太阳${natalSun?.sign.name ?? ""}${natalMoon ? ` · 月亮${natalMoon.sign.name}` : ""}` },
      { label: "今日行运", detail: transit.contacts[0]
        ? `${transit.contacts[0].transit}${transit.contacts[0].name}本命${transit.contacts[0].natal} · ${transit.contacts[0].window}主题 · 今日${baziDayRelation.dayPillar}日`
        : `太阳${dailySun?.sign.name ?? ""} · 月亮${dailyMoon?.sign.name ?? ""}${dayPillar ? ` · 今日${dayPillar.ganZhi}日` : ""}` },
    ];
    if (latestCheckin) evidence.push({ label: "近期状态", detail: `最近一次小行动：${latestCheckin.status === "done" ? "已完成" : latestCheckin.status === "release" ? "先放下" : "还在进行"}「${latestCheckin.action}」` });
    else if (activeObservation) evidence.push({ label: "近期状态", detail: `最近反复出现：${activeObservation.title}` });
    else if (recent.length) {
      evidence.push({ label: "近期状态", detail: `最近在意：${recent[0].question || "一件尚未落定的事"}` });
      if (recent[0].source) evidence.push({ label: "近期镜像", detail: recent[0].source });
    }
    if (authorizedFacts.length) evidence.push({ label: "授权现实", detail: `你明确保留：${authorizedFacts[0].text}` });
    return {
      mode: "personal_daily_fortune",
      date: `${today.year}-${String(today.month).padStart(2, "0")}-${String(today.day).padStart(2, "0")}`,
      evidence,
      modelContext: {
        mode: "personal_daily_fortune", date: today, recent, recentCheckins, authorizedFacts, activeObservation,
        natal: {
          bazi: {
            dayMaster: natalBazi.fiveElementProfile.dayMaster, dayMasterElement: natalBazi.fiveElementProfile.dayMasterElement,
            strength: natalBazi.fiveElementProfile.strengthBand, seasonalRelation: natalBazi.seasonalProfile.relationToDayMaster,
            dominantTenGods: natalBazi.tenGodProfile.dominant, activeLuck: natalBazi.luck?.cycles.find((cycle) => today.year >= cycle.startYear && today.year <= cycle.endYear) ?? null,
          },
          astrology: { sun: natalSun?.sign.name, moon: natalMoon?.sign.name, ascendant: natalAstrology.angles[0]?.sign.name ?? null },
        },
        today: {
          bazi: { dayPillar: dayPillar?.ganZhi, solarTerm: dailyBazi.solarTerms.previous, relationToNatal: baziDayRelation },
          astrology: { sun: dailySun?.sign.name, moon: dailyMoon?.sign.name, transitContacts: transit.contacts, transitMethod: transit.method },
        },
      },
    };
  } catch {
    const date = new Date().toISOString().slice(0, 10);
    return {
      mode: "daily_state_note", date,
      evidence: recent.length ? [{ label: "近期状态", detail: `最近在意：${recent[0].question || "一件尚未落定的事"}` }] : [{ label: "近期状态", detail: "今天的状态与此刻的对话" }],
      modelContext: { date, mode: "daily_state_note", recent, recentCheckins, authorizedFacts, activeObservation },
    };
  }
}
