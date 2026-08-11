Warning: truncated output (original token count: 2591)
Total output lines: 160

import { calculateAstrology, calculateAstrologyTransits } from "../server/tools/astrology/core.js";
import { calculateBazi, relateBaziDay } from "../server/tools/bazi/engine.js";

export type DailyBirthProfile = {
  year: number; month: number; day: number; hour: number; minute: number; unknownTime: boolean;
  place: string; utcOffsetMinutes: number; longitude: string; latitude: string;
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
  const allowed = new Set(evidence.map((entry) => entry.label)…1591 tokens truncated…, detail: `最近在意：${recent[0].question || "一件尚未落定的事"}` });
      if (recent[0].source) evidence.push({ label: "近期镜像", detail: recent[0].source });
    }
    if (authorizedFacts.length) evidence.push({ label: "授权现实", detail: `你明确保留：${authorizedFacts[0].text}` });
    return {
      mode: "personal_daily_fortune",
      date: `${today.year}-${String(today.month).padStart(2, "0")}-${String(today.day).padStart(2, "0")}`,
      evidence,
      modelContext: {
        mode: "personal_daily_fortune", date: today, recent, recentCheckins, authorizedFacts,
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
      modelContext: { date, mode: "daily_state_note", recent, recentCheckins, authorizedFacts },
    };
  }
}