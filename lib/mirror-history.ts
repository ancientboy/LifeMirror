import { createClientId } from "./client-id";
import { markAccountDataChanged, writeLocalAccountData, type AccountSnapshot } from "./account-data";

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
  important?: boolean;
  personId?: string;
  personName?: string;
  openLoopStatus?: "open" | "resolved" | "unknown";
  dedupKey?: string;
};

export const MIRROR_HISTORY_KEY = "life-mirror:guest-history:v1";

function read(): MirrorHistoryRecord[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(MIRROR_HISTORY_KEY) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

export function saveMirrorHistory(record: Omit<MirrorHistoryRecord, "id" | "savedAt">) {
  const current = read();
  const existing = record.dedupKey ? current.find((item) => item.dedupKey === record.dedupKey) : undefined;
  if (existing) return existing;
  const next: MirrorHistoryRecord = { ...record, id: createClientId(), savedAt: new Date().toISOString() };
  window.localStorage.setItem(MIRROR_HISTORY_KEY, JSON.stringify([next, ...current].slice(0, 80)));
  markAccountDataChanged();
  // A signed-in user writes to D1 immediately; localStorage is then only a
  // cache/offline fallback. Guests receive 401 and keep the local record.
  void fetch("/api/v1/account/history", {
    method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ history: next }),
  }).then(async (response) => response.ok ? await response.json() as { data?: AccountSnapshot } : null)
    .then((value) => { if (value?.data) writeLocalAccountData(value.data); })
    .catch(() => undefined);
  return next;
}

export function updateMirrorHistoryFeedback(id: string, feedback: MirrorHistoryRecord["feedback"]) {
  window.localStorage.setItem(MIRROR_HISTORY_KEY, JSON.stringify(read().map((item) => item.id === id ? { ...item, feedback } : item)));
  markAccountDataChanged();
}

export function updateMirrorHistory(id: string, patch: Pick<MirrorHistoryRecord, "important" | "personId" | "personName" | "openLoopStatus">) {
  window.localStorage.setItem(MIRROR_HISTORY_KEY, JSON.stringify(read().map((item) => item.id === id ? { ...item, ...patch } : item)));
  markAccountDataChanged();
  // Persist edits on the authoritative path immediately. The generic snapshot
  // sync remains an offline fallback, never the only way a deletion/edit wins.
  void fetch(`/api/v1/account/history/${encodeURIComponent(id)}`, {
    method: "PATCH", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(patch),
  }).then(async (response) => response.ok ? await response.json() as { data?: AccountSnapshot } : null)
    .then((value) => { if (value?.data) writeLocalAccountData(value.data); })
    .catch(() => undefined);
}

export function deleteMirrorHistory(id: string) {
  window.localStorage.setItem(MIRROR_HISTORY_KEY, JSON.stringify(read().filter((item) => item.id !== id)));
  markAccountDataChanged();
  void fetch(`/api/v1/account/history/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" })
    .then(async (response) => response.ok ? await response.json() as { data?: AccountSnapshot } : null)
    .then((value) => { if (value?.data) writeLocalAccountData(value.data); })
    .catch(() => undefined);
}
