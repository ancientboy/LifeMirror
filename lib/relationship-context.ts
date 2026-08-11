import { createClientId } from "./client-id";
import { markAccountDataChanged } from "./account-data";
import { buildRelationshipArchive, buildRelationshipCalibration, calculateRelationshipLoopMetrics, type RelationshipArchive, type RelationshipCalibration, type RelationshipLoopMetrics } from "./relationship-learning";

/**
 * A private, user-authored view of a real person.  It deliberately does not
 * model the other person's inner life as a product fact.
 */
export type PrivatePerson = {
  id: string;
  displayName: string;
  relationshipType?: string;
  userDescription?: string;
  communicationNotes?: string;
  /** Owner-entered birth data. It is private and never a claim made by TA. */
  birthProfile?: PersonBirthProfile;
  /** Deterministic symbolic facts for this exact birth profile. Never promoted
   * to a fact or observation about the person's character. */
  stableReferences?: PersonStableReferences;
  /** Prevents social linking/invitation flows for a private minor mirror. */
  isMinor?: boolean;
  observations?: RelationshipObservation[];
  createdAt: string;
  updatedAt: string;
};

export type PersonBirthProfile = {
  date: string;
  time?: string;
  place?: string;
  utcOffsetMinutes?: number;
  latitude?: number;
  longitude?: number;
  timeKnown: boolean;
  profileKey: string;
};

export type PersonStableReferences = {
  profileKey: string;
  calculatedAt: string;
  bazi: { summary: string; payload: unknown };
  astrology: { summary: string; payload: unknown };
};

export type RelationshipObservation = { id: string; text: string; important?: boolean; createdAt: string; updatedAt: string; source: "owner_observation" | "owner_correction" | "simulation_assessment" };

export type RelationshipLoop = { id: string; personId: string; situation: string; need?: string; status: "awaiting_action" | "reported"; actionTaken?: boolean; outcome?: "smooth" | "mixed" | "rough"; reflection?: string; createdAt: string; updatedAt: string; reportedAt?: string };
type RelationshipEffectEvent = "rehearsal_started" | "followup_seen" | "action_taken" | "feedback_reported";
type RelationshipFollowupSettings = { enabled?: boolean; dismissed?: Record<string, string>; seen?: Record<string, string> };

const SETTINGS_KEY = "life-mirror:memory-settings:v1";

function readSettings(): Record<string, unknown> {
  try {
    const value = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch { return {}; }
}

function write(people: PrivatePerson[], loops = getRelationshipLoops()) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...readSettings(), privatePeople: people.slice(0, 40), relationshipLoops: loops.slice(0, 100), privatePeopleUpdatedAt: new Date().toISOString() }));
  markAccountDataChanged();
}

function addDeletedSettingId(key: "deletedPrivatePeople" | "deletedRelationshipLoops", id: string) {
  const settings = readSettings();
  const current = Array.isArray(settings[key]) ? settings[key].filter((value): value is string => typeof value === "string") : [];
  return [...new Set([id, ...current])].slice(0, 100);
}

function followupSettings(): RelationshipFollowupSettings {
  const value = readSettings().relationshipFollowups;
  return value && typeof value === "object" && !Array.isArray(value) ? value as RelationshipFollowupSettings : {};
}

function writeFollowupSettings(next: RelationshipFollowupSettings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...readSettings(), relationshipFollowups: next }));
  markAccountDataChanged();
}

/** Sends only opaque lifecycle counters; never rehearsal or feedback text. */
export async function recordRelationshipEffectEvent(loop: Pick<RelationshipLoop, "id" | "personId">, eventType: RelationshipEffectEvent) {
  await fetch("/api/v1/account/effect-loop/events", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ loopId: loop.id, relationshipKey: loop.personId, eventType }) }).catch(() => undefined);
}

/** Removes opaque telemetry with its matching private record; no interaction text is sent. */
async function deleteRelationshipEffectData(input: { loopId?: string; relationshipKey?: string }) {
  await fetch("/api/v1/account/effect-loop/events", { method: "DELETE", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }).catch(() => undefined);
}

export function relationshipFollowupsEnabled() { return followupSettings().enabled === true; }

export function setRelationshipFollowupsEnabled(enabled: boolean) {
  writeFollowupSettings({ ...followupSettings(), enabled });
}

export function getDueRelationshipFollowup(now = Date.now()) {
  if (!relationshipFollowupsEnabled()) return null;
  const settings = followupSettings();
  return getRelationshipLoops().find((loop) => {
    if (loop.status !== "awaiting_action" || now - new Date(loop.createdAt).getTime() < 24 * 3_600_000) return false;
    const lastSeen = Date.parse(settings.seen?.[loop.id] ?? "");
    const dismissedUntil = Date.parse(settings.dismissed?.[loop.id] ?? "");
    return (!Number.isFinite(lastSeen) || now - lastSeen >= 24 * 3_600_000) && (!Number.isFinite(dismissedUntil) || now >= dismissedUntil);
  }) ?? null;
}

export function markRelationshipFollowupSeen(loopId: string) {
  const settings = followupSettings();
  writeFollowupSettings({ ...settings, seen: { ...settings.seen, [loopId]: new Date().toISOString() } });
}

export function dismissRelationshipFollowup(loopId: string) {
  const settings = followupSettings();
  writeFollowupSettings({ ...settings, dismissed: { ...settings.dismissed, [loopId]: new Date(Date.now() + 24 * 3_600_000).toISOString() } });
}

export function getPrivatePeople(): PrivatePerson[] {
  const value = readSettings().privatePeople;
  return Array.isArray(value) ? value.filter((item): item is PrivatePerson => Boolean(item && typeof item === "object" && typeof (item as PrivatePerson).id === "string" && typeof (item as PrivatePerson).displayName === "string")) : [];
}

export function savePrivatePerson(input: Pick<PrivatePerson, "displayName" | "relationshipType" | "userDescription" | "communicationNotes" | "birthProfile" | "stableReferences" | "isMinor"> & { id?: string }) {
  const displayName = input.displayName.trim().slice(0, 40);
  if (!displayName) return null;
  const current = getPrivatePeople();
  const existing = input.id ? current.find((person) => person.id === input.id) : undefined;
  const now = new Date().toISOString();
  const person: PrivatePerson = {
    id: existing?.id ?? createClientId(), displayName,
    relationshipType: input.relationshipType?.trim().slice(0, 40) || undefined,
    userDescription: input.userDescription?.trim().slice(0, 300) || undefined,
    communicationNotes: input.communicationNotes?.trim().slice(0, 300) || undefined,
    birthProfile: input.birthProfile,
    stableReferences: input.stableReferences ?? (existing?.stableReferences?.profileKey === input.birthProfile?.profileKey ? existing?.stableReferences : undefined),
    isMinor: input.isMinor === true,
    observations: existing?.observations ?? [], createdAt: existing?.createdAt ?? now, updatedAt: now,
  };
  write([person, ...current.filter((item) => item.id !== person.id)]);
  return person;
}

/** Observations stay explicitly owner-authored; they are never TA personality facts. */
export function savePersonObservation(personId: string, text: string, source: RelationshipObservation["source"] = "owner_observation") {
  const clean = text.trim().slice(0, 300); if (!clean) return null;
  const now = new Date().toISOString(); const people = getPrivatePeople(); const person = people.find((item) => item.id === personId); if (!person) return null;
  const observation: RelationshipObservation = { id: createClientId(), text: clean, source, createdAt: now, updatedAt: now };
  write(people.map((item) => item.id === personId ? { ...item, observations: [observation, ...(item.observations ?? [])].slice(0, 30), updatedAt: now } : item));
  return observation;
}

/**
 * A one-tap assessment records only the owner's confidence in this simulated
 * turn.  It deliberately excludes the simulated wording, so a model-created
 * guess can never become a fact about the other person.
 */
export function saveSimulationAssessment(personId: string, assessment: "close" | "partial") {
  return savePersonObservation(personId, assessment === "close" ? "本次模拟：更像 TA 的现实回应。" : "本次模拟：只像一部分，仍需以真实互动为准。", "simulation_assessment");
}

export function deletePersonObservation(personId: string, observationId: string) {
  const people = getPrivatePeople(); const person = people.find((item) => item.id === personId); if (!person) return false;
  write(people.map((item) => item.id === personId ? { ...item, observations: (item.observations ?? []).filter((entry) => entry.id !== observationId), updatedAt: new Date().toISOString() } : item));
  return true;
}

export function deletePrivatePerson(id: string) {
  const people = getPrivatePeople().filter((person) => person.id !== id);
  const removedLoops = getRelationshipLoops().filter((loop) => loop.personId === id).map((loop) => loop.id);
  const settings = readSettings();
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    ...settings,
    privatePeople: people.slice(0, 40),
    relationshipLoops: getRelationshipLoops().filter((loop) => loop.personId !== id).slice(0, 100),
    deletedPrivatePeople: addDeletedSettingId("deletedPrivatePeople", id),
    deletedRelationshipLoops: [...new Set([...removedLoops, ...(Array.isArray(settings.deletedRelationshipLoops) ? settings.deletedRelationshipLoops.filter((value): value is string => typeof value === "string") : [])])].slice(0, 100),
    privatePeopleUpdatedAt: new Date().toISOString(),
  }));
  markAccountDataChanged();
  void deleteRelationshipEffectData({ relationshipKey: id });
}

export function getRelationshipLoops(): RelationshipLoop[] {
  const value = readSettings().relationshipLoops;
  return Array.isArray(value) ? value.filter((item): item is RelationshipLoop => Boolean(item && typeof item === "object" && typeof (item as RelationshipLoop).id === "string" && typeof (item as RelationshipLoop).personId === "string" && typeof (item as RelationshipLoop).situation === "string")).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
}

export function getRelationshipLoopsForPerson(personId: string): RelationshipLoop[] {
  return getRelationshipLoops().filter((loop) => loop.personId === personId);
}

export function deleteRelationshipLoop(id: string) {
  const loop = getRelationshipLoops().find((item) => item.id === id);
  if (!loop) return false;
  const settings = readSettings();
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, relationshipLoops: getRelationshipLoops().filter((item) => item.id !== id), deletedRelationshipLoops: addDeletedSettingId("deletedRelationshipLoops", id), privatePeopleUpdatedAt: new Date().toISOString() }));
  markAccountDataChanged();
  void deleteRelationshipEffectData({ loopId: id });
  return true;
}

export function createRelationshipLoop(input: Pick<RelationshipLoop, "personId" | "situation" | "need">) {
  const now = new Date().toISOString(); const loop: RelationshipLoop = { id: createClientId(), personId: input.personId, situation: input.situation.trim().slice(0, 180), need: input.need?.trim().slice(0, 180) || undefined, status: "awaiting_action", createdAt: now, updatedAt: now };
  write(getPrivatePeople(), [loop, ...getRelationshipLoops()]);
  void recordRelationshipEffectEvent(loop, "rehearsal_started");
  return loop;
}

export function reportRelationshipLoop(id: string, input: { actionTaken: boolean; outcome?: RelationshipLoop["outcome"]; reflection?: string }) {
  const reportedAt = new Date().toISOString();
  const next = getRelationshipLoops().map((loop) => loop.id === id ? { ...loop, status: "reported" as const, actionTaken: input.actionTaken, outcome: input.outcome, reflection: input.reflection?.trim().slice(0, 300) || undefined, reportedAt, updatedAt: reportedAt } : loop);
  write(getPrivatePeople(), next);
  const reported = next.find((loop) => loop.id === id) ?? null;
  if (reported) {
    if (input.actionTaken) void recordRelationshipEffectEvent(reported, "action_taken");
    void recordRelationshipEffectEvent(reported, "feedback_reported");
  }
  return reported;
}

export function getRelationshipCalibration(personId: string): RelationshipCalibration {
  return buildRelationshipCalibration(personId, getRelationshipLoops());
}

export function getRelationshipArchive(personId: string): RelationshipArchive {
  return buildRelationshipArchive(personId, getRelationshipLoops());
}

export function getRelationshipLoopMetrics(): RelationshipLoopMetrics {
  return calculateRelationshipLoopMetrics(getRelationshipLoops());
}

export function relationshipLoopInsight(loop: RelationshipLoop) {
  if (!loop.actionTaken) return "这次先没有走到现实里也没关系。下次把目标缩小成一句开场，行动会更容易发生。";
  if (loop.outcome === "smooth") return "这次你真的开口了，而且现实反馈并不全是你原先担心的样子。下次可以继续先讲具体感受，再提一个小请求。";
  if (loop.outcome === "mixed") return "你已经把话带回现实了。结果有来有回很正常；下次先确认彼此听到的重点，再决定要不要继续深入。";
  return "这次并不顺利，但它给了下一次更具体的线索。先照顾好自己，等情绪平一点，再决定是否用更小的请求重新开口。";
}
