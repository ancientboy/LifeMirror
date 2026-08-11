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

export type MirrorHistoryPersistence = "server" | "guest" | "pending";

function writeLocalRecord(next: MirrorHistoryRecord) {
  const current = read();
  const existingIndex = current.findIndex((item) => item.id === next.id || (next.dedupKey && item.dedupKey === next.dedupKey));
  const history = existingIndex >= 0
    ? current.map((item, index) => index === existingIndex ? { ...item, ...next } : item)
    : [next, ...current];
  window.localStorage.setItem(MIRROR_HISTORY_KEY, JSON.stringify(history.slice(0, 80)));
  markAccountDataChanged();
}

export async function persistMirrorHistory(next: MirrorHistoryRecord): Promise<MirrorHistoryPersistence> {
  try {
    const response = await fetch("/api/v1/account/history", {
      method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ history: next }),
    });
    if (response.ok) {
      const value = await response.json() as { data?: AccountSnapshot };
      if (value.data) writeLocalAccountData(value.data);
      return "server";
    }
    if (response.status === 401) {
      writeLocalRecord(next);
      return "guest";
    }
    writeLocalRecord(next);
    return "pending";
  } catch {
    // Keep an explicit offline copy. AccountDataSync will retry the D1 merge,
    // while the result page remains honest that the write is not confirmed.
    writeLocalRecord(next);
    return "pending";
  }
}

export async function saveMirrorHistory(record: Omit<MirrorHistoryRecord, "id" | "savedAt">) {
  const current = read();
  const existing = record.dedupKey ? current.find((item) => item.dedupKey === record.dedupKey) : undefined;
  const next: MirrorHistoryRecord = existing ?? { ...record, id: createClientId(), savedAt: new Date().toISOString() };
  const persistence = await persistMirrorHistory(next);
  return { record: next, persistence };
}

function writeLocalFeedback(id: string, feedback: MirrorHistoryRecord["feedback"]) {
  window.localStorage.setItem(MIRROR_HISTORY_KEY, JSON.stringify(read().map((item) => item.id === id ? { ...item, feedback } : item)));
  markAccountDataChanged();
}

export async function updateMirrorHistoryFeedback(id: string, feedback: MirrorHistoryRecord["feedback"]): Promise<MirrorHistoryPersistence> {
  try {
    const response = await fetch(`/api/v1/account/history/${encodeURIComponent(id)}`, {
      method: "PATCH", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ feedback }),
    });
    if (response.ok) {
      const value = await response.json() as { data?: AccountSnapshot };
      if (value.data) writeLocalAccountData(value.data);
      return "server";
    }
    writeLocalFeedback(id, feedback);
    return response.status === 401 ? "guest" : "pending";
  } catch {
    writeLocalFeedback(id, feedback);
    return "pending";
  }
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
