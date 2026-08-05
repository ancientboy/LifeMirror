import { createClientId } from "./client-id";

export type MemorySettings = {
  enabled: boolean;
  explicitFacts: boolean;
  mirrorEvidence: boolean;
};

export type SavedFact = {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
};

type MirrorEvent = {
  id?: string;
  question?: string;
  savedAt?: string;
  sourceLabel?: string;
  source?: string;
  reflection?: {
    shareableReflection?: string;
    shiguangInterpretation?: string;
    mirrorUnderstanding?: string;
    traditionalJudgment?: string;
    insight?: string;
  };
};

export type RetrievedMemory = {
  facts: Array<{ text: string; updatedAt: string }>;
  evidence: Array<{ source: string; question: string; summary: string; savedAt: string }>;
};

const SETTINGS_KEY = "life-mirror:memory-settings:v1";
const FACTS_KEY = "life-mirror:saved-facts:v1";
const HISTORY_KEY = "life-mirror:guest-history:v1";
export const MEMORY_CHANGED_EVENT = "life-mirror:memory-changed";

export const defaultMemorySettings: MemorySettings = {
  enabled: false,
  explicitFacts: true,
  mirrorEvidence: true,
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function notifyMemoryChanged() {
  window.dispatchEvent(new CustomEvent(MEMORY_CHANGED_EVENT));
  window.dispatchEvent(new CustomEvent("life-mirror:account-data-changed"));
}

export function getMemorySettings(): MemorySettings {
  return { ...defaultMemorySettings, ...readJson<Partial<MemorySettings>>(SETTINGS_KEY, {}) };
}

export function updateMemorySettings(next: Partial<MemorySettings>): MemorySettings {
  const value = { ...getMemorySettings(), ...next };
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(value));
  notifyMemoryChanged();
  return value;
}

export function getSavedFacts(): SavedFact[] {
  return readJson<SavedFact[]>(FACTS_KEY, []).slice(0, 50);
}

export function addSavedFact(text: string): SavedFact | null {
  const normalized = text.replace(/^[：:，,\s]+/, "").replace(/\s+/g, " ").trim().slice(0, 180);
  if (normalized.length < 2) return null;
  const current = getSavedFacts();
  const existing = current.find((item) => item.text === normalized);
  const now = new Date().toISOString();
  const fact = existing ?? { id: createClientId(), text: normalized, createdAt: now, updatedAt: now };
  const nextFact = { ...fact, updatedAt: now };
  const next = [nextFact, ...current.filter((item) => item.id !== nextFact.id)].slice(0, 50);
  window.localStorage.setItem(FACTS_KEY, JSON.stringify(next));
  notifyMemoryChanged();
  return nextFact;
}

export function removeSavedFact(id: string) {
  window.localStorage.setItem(FACTS_KEY, JSON.stringify(getSavedFacts().filter((item) => item.id !== id)));
  notifyMemoryChanged();
}

export function captureExplicitMemory(message: string, settings = getMemorySettings()): SavedFact | null {
  if (!settings.enabled || !settings.explicitFacts) return null;
  const match = message.match(/(?:请|帮我)?记住(?:一下)?[：:，,\s]*(.{2,180})/);
  return match?.[1] ? addSavedFact(match[1]) : null;
}

function terms(text: string) {
  const cleaned = text.toLowerCase().replace(/[\s，。！？；：、,.!?;:'"“”‘’（）()\[\]]/g, "");
  const result = new Set<string>();
  for (let index = 0; index < cleaned.length - 1; index += 1) result.add(cleaned.slice(index, index + 2));
  return result;
}

function relevance(query: string, candidate: string) {
  const queryTerms = terms(query);
  if (!queryTerms.size) return 0;
  const candidateTerms = terms(candidate);
  let matches = 0;
  queryTerms.forEach((term) => { if (candidateTerms.has(term)) matches += 1; });
  return matches / queryTerms.size;
}

export function retrieveRelevantMemory(query: string, settings = getMemorySettings()): RetrievedMemory {
  if (!settings.enabled) return { facts: [], evidence: [] };
  const facts = getSavedFacts()
    .map((fact) => ({ fact, score: relevance(query, fact.text) }))
    .sort((a, b) => b.score - a.score || b.fact.updatedAt.localeCompare(a.fact.updatedAt))
    .filter((item) => item.score > 0 || /你记得|还记得|以前|之前|上次|我的偏好|关于我/.test(query))
    .slice(0, 5)
    .map(({ fact }) => ({ text: fact.text, updatedAt: fact.updatedAt }));

  if (!settings.mirrorEvidence) return { facts, evidence: [] };
  const events = readJson<MirrorEvent[]>(HISTORY_KEY, []);
  const evidence = events
    .map((event) => {
      const summary = event.reflection?.shareableReflection ?? event.reflection?.shiguangInterpretation ?? event.reflection?.mirrorUnderstanding ?? event.reflection?.traditionalJudgment ?? event.reflection?.insight ?? "";
      return { event, summary, score: relevance(query, `${event.question ?? ""}${summary}`) };
    })
    .filter((item) => item.summary && (item.score > 0 || /命盘|塔罗|六爻|占星|镜像|以前|过去|上次/.test(query)))
    .sort((a, b) => b.score - a.score || (b.event.savedAt ?? "").localeCompare(a.event.savedAt ?? ""))
    .slice(0, 3)
    .map(({ event, summary }) => ({
      source: event.sourceLabel ?? event.source ?? "个人镜像",
      question: event.question ?? "未命名镜像",
      summary: summary.slice(0, 420),
      savedAt: event.savedAt ?? "",
    }));
  return { facts, evidence };
}
