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
  createdAt: string;
  updatedAt: string;
};

export type RelationshipLoop = { id: string; personId: string; situation: string; need?: string; status: "awaiting_action" | "reported"; actionTaken?: boolean; outcome?: "smooth" | "mixed" | "rough"; reflection?: string; createdAt: string; reportedAt?: string };

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

export function getPrivatePeople(): PrivatePerson[] {
  const value = readSettings().privatePeople;
  return Array.isArray(value) ? value.filter((item): item is PrivatePerson => Boolean(item && typeof item === "object" && typeof (item as PrivatePerson).id === "string" && typeof (item as PrivatePerson).displayName === "string")) : [];
}

export function savePrivatePerson(input: Pick<PrivatePerson, "displayName" | "relationshipType" | "userDescription" | "communicationNotes"> & { id?: string }) {
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
    createdAt: existing?.createdAt ?? now, updatedAt: now,
  };
  write([person, ...current.filter((item) => item.id !== person.id)]);
  return person;
}

export function deletePrivatePerson(id: string) {
  write(getPrivatePeople().filter((person) => person.id !== id), getRelationshipLoops().filter((loop) => loop.personId !== id));
}

export function getRelationshipLoops(): RelationshipLoop[] {
  const value = readSettings().relationshipLoops;
  return Array.isArray(value) ? value.filter((item): item is RelationshipLoop => Boolean(item && typeof item === "object" && typeof (item as RelationshipLoop).id === "string" && typeof (item as RelationshipLoop).personId === "string" && typeof (item as RelationshipLoop).situation === "string")).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
}

export function createRelationshipLoop(input: Pick<RelationshipLoop, "personId" | "situation" | "need">) {
  const now = new Date().toISOString(); const loop: RelationshipLoop = { id: createClientId(), personId: input.personId, situation: input.situation.trim().slice(0, 180), need: input.need?.trim().slice(0, 180) || undefined, status: "awaiting_action", createdAt: now };
  write(getPrivatePeople(), [loop, ...getRelationshipLoops()]); return loop;
}

export function reportRelationshipLoop(id: string, input: { actionTaken: boolean; outcome?: RelationshipLoop["outcome"]; reflection?: string }) {
  const next = getRelationshipLoops().map((loop) => loop.id === id ? { ...loop, status: "reported" as const, actionTaken: input.actionTaken, outcome: input.outcome, reflection: input.reflection?.trim().slice(0, 300) || undefined, reportedAt: new Date().toISOString() } : loop);
  write(getPrivatePeople(), next); return next.find((loop) => loop.id === id) ?? null;
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
