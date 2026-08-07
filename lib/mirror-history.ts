import { createClientId } from "./client-id";
import { markAccountDataChanged } from "./account-data";

export type MirrorHistorySource = "liuyao" | "tarot" | "bazi" | "astrology";
export type MirrorHistoryRecord = {
  id: string;
  source: MirrorHistorySource;
  sourceLabel: string;
  question: string;
  savedAt: string;
  summary: string;
  factIds: string[];
  meta?: string;
  payload?: unknown;
  reflection?: {
    headline?: string;
    shareableReflection?: string;
    shiguangInterpretation?: string;
    practicalGuidance?: string;
    reflectionQuestion?: string;
  };
  feedback?: "resonates" | "needs_correction";
};

export const MIRROR_HISTORY_KEY = "life-mirror:guest-history:v1";

function read(): MirrorHistoryRecord[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(MIRROR_HISTORY_KEY) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

export function saveMirrorHistory(record: Omit<MirrorHistoryRecord, "id" | "savedAt">) {
  const next: MirrorHistoryRecord = { ...record, id: createClientId(), savedAt: new Date().toISOString() };
  window.localStorage.setItem(MIRROR_HISTORY_KEY, JSON.stringify([next, ...read()].slice(0, 80)));
  markAccountDataChanged();
  return next;
}

export function updateMirrorHistoryFeedback(id: string, feedback: MirrorHistoryRecord["feedback"]) {
  window.localStorage.setItem(MIRROR_HISTORY_KEY, JSON.stringify(read().map((item) => item.id === id ? { ...item, feedback } : item)));
  markAccountDataChanged();
}
