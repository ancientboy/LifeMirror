import type { PersonContext } from "./person-context";
import type { PrivatePerson } from "./relationship-context";
import type { RelationshipMemoryContext } from "./relationships/types";
import { markAccountDataChanged } from "./account-data";

export type PersonMirrorTurn = {
  id: string;
  role: "user" | "simulation";
  text: string;
  createdAt: string;
};

export type PersonMirrorChatInput = {
  person: {
    id: string;
    displayName: string;
    relationshipType?: string;
    userDescription?: string;
    communicationNotes?: string;
    isMinor?: boolean;
  };
  evidence: {
    ownerObservations: string[];
    simulationCorrections: string[];
    realInteractions: string[];
    extractedMessages: Array<{ speaker: "user" | "other" | "unknown"; text: string }>;
    realityFeedback: Array<{ outcome: string; acted: boolean; note?: string }>;
  };
  messages: Array<{ role: "user" | "simulation"; content: string }>;
};

const SETTINGS_KEY = "life-mirror:memory-settings:v1";
const legacyHistoryKey = (personId: string) => `life-mirror:person-simulation:v2:${personId}`;

function readSettings(): Record<string, unknown> {
  try {
    const value = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch { return {}; }
}

function storedThreads(settings: Record<string, unknown>) {
  const value = settings.personSimulationThreads;
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function readPersonMirrorTurns(personId: string): PersonMirrorTurn[] {
  if (typeof window === "undefined") return [];
  try {
    const settings = readSettings();
    const value = storedThreads(settings)[personId] ?? JSON.parse(window.localStorage.getItem(legacyHistoryKey(personId)) ?? "[]");
    return Array.isArray(value)
      ? value.filter((item): item is PersonMirrorTurn => Boolean(item && typeof item === "object" && (item.role === "user" || item.role === "simulation") && typeof item.text === "string" && typeof item.id === "string")).slice(-40)
      : [];
  } catch { return []; }
}

export function writePersonMirrorTurns(personId: string, turns: PersonMirrorTurn[]) {
  if (typeof window === "undefined") return;
  const settings = readSettings();
  const current = storedThreads(settings);
  const next = Object.fromEntries([[personId, turns.slice(-40)], ...Object.entries(current).filter(([key]) => key !== personId)].slice(0, 40));
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, personSimulationThreads: next, privatePeopleUpdatedAt: new Date().toISOString() }));
  window.localStorage.removeItem(legacyHistoryKey(personId));
  markAccountDataChanged();
}

export function clearPersonMirrorTurns(personId: string) {
  if (typeof window === "undefined") return;
  const settings = readSettings();
  const current = storedThreads(settings);
  const next = Object.fromEntries(Object.entries(current).filter(([key]) => key !== personId));
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, personSimulationThreads: next, privatePeopleUpdatedAt: new Date().toISOString() }));
  window.localStorage.removeItem(legacyHistoryKey(personId));
  markAccountDataChanged();
}

export function buildPersonMirrorChatInput(person: PrivatePerson, context: PersonContext, serverMemory: RelationshipMemoryContext, turns: PersonMirrorTurn[]): PersonMirrorChatInput {
  return {
    person: {
      id: person.id,
      displayName: person.displayName,
      relationshipType: person.relationshipType,
      userDescription: person.userDescription,
      communicationNotes: person.communicationNotes,
      isMinor: person.isMinor,
    },
    evidence: {
      ownerObservations: context.ownerObservations.slice(0, 12).map((item) => item.text),
      simulationCorrections: context.simulationCorrections.slice(0, 8).map((item) => item.text),
      realInteractions: context.realInteractions.slice(0, 8).map((item) => item.reflection || item.situation).filter(Boolean),
      extractedMessages: serverMemory.extractedMessages.slice(-30).map((item) => ({ speaker: item.speaker, text: item.text })),
      realityFeedback: serverMemory.realityFeedback.slice(0, 8).map((item) => ({ outcome: item.outcome, acted: item.acted, note: item.note })),
    },
    messages: turns.slice(-20).map((item) => ({ role: item.role, content: item.text })),
  };
}

export function personMirrorHasPersonalEvidence(input: PersonMirrorChatInput) {
  return Boolean(
    input.person.userDescription ||
    input.person.communicationNotes ||
    input.evidence.ownerObservations.length ||
    input.evidence.simulationCorrections.length ||
    input.evidence.realInteractions.length ||
    input.evidence.extractedMessages.some((item) => item.speaker === "other") ||
    input.evidence.realityFeedback.some((item) => item.note),
  );
}
